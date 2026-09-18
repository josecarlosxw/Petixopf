"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPdfjs } from "@/lib/pdf/pdfjs";

export function PdfCanvasViewer({ blob, onTotalPages }: { blob: Blob; onTotalPages?: (n: number) => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const pdfRef = React.useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const pdfjsLib = await getPdfjs();
      const ab = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
      if (cancelled) return;
      pdfRef.current = pdf;
      setTotal(pdf.numPages);
      onTotalPages?.(pdf.numPages);
      setPage(1);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
      pdfRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  const renderPage = React.useCallback(async (pageNum: number) => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;
    const pdfPage = await pdf.getPage(pageNum);
    const wrapWidth = wrapRef.current?.clientWidth || 800;
    const scale = Math.min(2, wrapWidth / pdfPage.getViewport({ scale: 1 }).width);
    const vp = pdfPage.getViewport({ scale });
    canvas.width = vp.width;
    canvas.height = vp.height;
    canvas.style.width = "100%";
    const ctx = canvas.getContext("2d")!;
    await pdfPage.render({ canvasContext: ctx, viewport: vp }).promise;
  }, []);

  React.useEffect(() => {
    if (!loading) renderPage(page);
  }, [page, loading, renderPage]);

  return (
    <div className="flex flex-col gap-3">
      <div ref={wrapRef} className="overflow-hidden rounded-md border border-border bg-muted/30">
        <canvas ref={canvasRef} className="block" />
      </div>
      <div className="flex items-center justify-center gap-3 text-sm">
        <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-muted-foreground">
          {loading ? "Carregando…" : `Pág. ${page} / ${total}`}
        </span>
        <Button variant="outline" size="icon" disabled={page >= total} onClick={() => setPage((p) => p + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
