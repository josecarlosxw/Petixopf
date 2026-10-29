"use client";
import * as React from "react";
import { PDFDocument } from "pdf-lib";
import { UploadCloud, FileStack, X, Download } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB, mesmo limite do tool3 original

type PickedFile = { file: File; id: string };

export default function ColisaoPage() {
  const [files, setFiles] = React.useState<PickedFile[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [merging, setMerging] = React.useState(false);
  const [progress, setProgress] = React.useState<{ pct: number; label: string } | null>(
    null,
  );
  const [mergedBlob, setMergedBlob] = React.useState<Blob | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function addFiles(newFiles: File[]) {
    let rejected = 0;
    setFiles((prev) => {
      const next = [...prev];
      newFiles.forEach((f) => {
        if (f.size > MAX_FILE_SIZE) {
          rejected++;
          return;
        }
        const exists = next.find((pf) => pf.file.name === f.name && pf.file.size === f.size);
        if (!exists) next.push({ file: f, id: `${f.name}-${f.size}-${next.length}` });
      });
      return next;
    });
    if (rejected > 0) {
      alert(`${rejected} arquivo(s) excedeu(ram) o limite de 500MB e foi(ram) ignorado(s).`);
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function clearAll() {
    setFiles([]);
    setMergedBlob(null);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleMerge() {
    if (files.length < 2) {
      alert("Selecione pelo menos 2 PDFs para mesclar.");
      return;
    }
    setMerging(true);
    setMergedBlob(null);
    setProgress({ pct: 0, label: "Iniciando…" });

    try {
      const mergedPdf = await PDFDocument.create();
      const totalSize = files.reduce((a, f) => a + f.file.size, 0);
      let processedSize = 0;

      for (const { file } of files) {
        const ab = await file.arrayBuffer();
        const pdf = await PDFDocument.load(ab);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((p) => mergedPdf.addPage(p));

        processedSize += file.size;
        setProgress({
          pct: (processedSize / totalSize) * 90,
          label: `Processando: ${file.name}`,
        });
      }

      setProgress({ pct: 95, label: "Gerando PDF…" });
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      setProgress({ pct: 100, label: "Concluído!" });
      setMergedBlob(blob);
    } catch (err) {
      console.error("Erro ao mesclar:", err);
      alert("Erro ao mesclar PDFs. Tente novamente.");
      setProgress(null);
    } finally {
      setMerging(false);
    }
  }

  function handleDownload() {
    if (!mergedBlob) return;
    const url = URL.createObjectURL(mergedBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `colisao_${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Colisão</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mescle múltiplos PDFs em um único arquivo, na ordem de upload.
        </p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf"));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border-strong p-10 text-center transition-colors",
          dragging && "border-primary bg-primary/5",
        )}
      >
        <UploadCloud className="size-6 text-faint" />
        <p className="text-sm font-medium">Arraste PDFs aqui ou clique para selecionar</p>
        <p className="text-xs text-faint">Limite de 500MB por arquivo</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(Array.from(e.target.files));
          }}
        />
      </div>

      {files.length > 0 && (
        <Card className="divide-y divide-border overflow-hidden">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-2.5">
              <FileStack className="size-4 shrink-0 text-faint" />
              <span className="flex-1 truncate text-sm" title={f.file.name}>
                {f.file.name}
              </span>
              <span className="shrink-0 text-xs text-faint">
                {(f.file.size / 1024 / 1024).toFixed(1)}MB
              </span>
              <button
                onClick={() => removeFile(f.id)}
                className="shrink-0 text-faint hover:text-status-red"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </Card>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleMerge} disabled={merging || files.length < 2}>
            {merging ? "Mesclando…" : `Mesclar ${files.length} PDFs`}
          </Button>
          <Button variant="outline" onClick={clearAll}>
            Limpar lista
          </Button>
        </div>
      )}

      {progress && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.label}</span>
            <span>{Math.round(progress.pct)}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
        </Card>
      )}

      {mergedBlob && (
        <Button onClick={handleDownload} variant="outline" className="w-fit">
          <Download className="size-4" />
          Baixar PDF mesclado
        </Button>
      )}
    </div>
  );
}
