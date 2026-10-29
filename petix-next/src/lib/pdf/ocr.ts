import { extractNFe } from "@/lib/pdf/nfe";
import { getPdfjs } from "@/lib/pdf/pdfjs";

export type OcrResult = { numero: string | null; via: "texto" | "ocr" };


/**
 * Tenta extrair o número da NF-e do texto nativo do PDF; se o texto for
 * insuficiente (PDF escaneado/imagem), renderiza a página em canvas e roda
 * OCR via Tesseract.js. Equivalente a ocrPart() no app.js original.
 */
export async function ocrPart(pdfBlob: Blob, isLargeFile: boolean): Promise<OcrResult> {
  try {
    const pdfjsLib = await getPdfjs();
    const ab = await pdfBlob.arrayBuffer();
    const pdfData = new Uint8Array(ab);

    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();
    const nativeText = content.items
      .map((i) => ("str" in i ? i.str : ""))
      .join(" ");

    if (nativeText && nativeText.trim().length > 20) {
      const numero = extractNFe(nativeText);
      if (numero) {
        page.cleanup?.();
        await pdf.destroy();
        return { numero, via: "texto" };
      }
    }

    const renderScale = isLargeFile ? 1.0 : 1.5;
    const viewport = page.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("por");
    const {
      data: { text },
    } = await worker.recognize(canvas);
    await worker.terminate();

    const numero = text && text.length > 20 ? extractNFe(text) : null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup?.();
    await pdf.destroy();

    return { numero, via: "ocr" };
  } catch {
    return { numero: null, via: "ocr" };
  }
}
