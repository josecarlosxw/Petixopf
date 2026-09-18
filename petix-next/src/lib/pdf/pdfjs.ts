let configured = false;

/** Import dinâmico do pdf.js configurado com o worker bundlado via npm. */
export async function getPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  if (!configured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    configured = true;
  }
  return pdfjsLib;
}
