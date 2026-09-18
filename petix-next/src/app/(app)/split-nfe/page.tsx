"use client";
import * as React from "react";
import { PDFDocument } from "pdf-lib";
import { UploadCloud, FileText as FileIcon, X, Download } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseRanges, formatBytes } from "@/lib/pdf/nfe";
import { ocrPart } from "@/lib/pdf/ocr";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import { addHistoricoPdf } from "@/lib/firebase/historico";

const MAX_SIZE = 500 * 1024 * 1024; // 500MB
const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB

type Mode = "all" | "range" | "every";

type ResultRow = {
  index: number;
  partLabel: string;
  startPage: number;
  endPage: number;
  status: "proc" | "ok" | "miss";
  finalName: string;
  badge: string;
};

type ZipItem = { name: string; bytes: Uint8Array };

export default function SplitNfePage() {
  const { user } = useAnonymousAuth();

  const [file, setFile] = React.useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = React.useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [mode, setMode] = React.useState<Mode>("all");
  const [rangeInput, setRangeInput] = React.useState("");
  const [everyInput, setEveryInput] = React.useState("1");
  const [doOcr, setDoOcr] = React.useState(true);

  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState<{ pct: number; label: string } | null>(
    null,
  );
  const [results, setResults] = React.useState<ResultRow[]>([]);
  const [stats, setStats] = React.useState({ found: 0, miss: 0 });
  const [zipBlob, setZipBlob] = React.useState<Blob | null>(null);
  const [zipName, setZipName] = React.useState("nfe_split.zip");

  async function handleFile(f: File) {
    if (f.size > MAX_SIZE) {
      alert(`Arquivo muito grande (${(f.size / 1024 / 1024).toFixed(1)}MB). Limite: 500MB.`);
      return;
    }
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      alert("Por favor, selecione um arquivo PDF válido.");
      return;
    }
    const ab = await f.arrayBuffer();
    try {
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      setFile(f);
      setPdfBytes(ab);
      setTotalPages(doc.getPageCount());
      setResults([]);
      setZipBlob(null);
      setProgress(null);
      setStats({ found: 0, miss: 0 });
    } catch (e) {
      alert("Erro ao carregar PDF: " + (e instanceof Error ? e.message : e));
    }
  }

  function reset() {
    setFile(null);
    setPdfBytes(null);
    setTotalPages(0);
    setResults([]);
    setZipBlob(null);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRun() {
    if (!pdfBytes || !file) return;

    let segments: [number, number][] = [];
    try {
      if (mode === "range") {
        if (!rangeInput.trim()) {
          alert("Informe ao menos um intervalo de páginas.");
          return;
        }
        segments = parseRanges(rangeInput.trim(), totalPages);
      } else if (mode === "all") {
        segments = Array.from({ length: totalPages }, (_, i) => [i + 1, i + 1]);
      } else {
        const x = parseInt(everyInput, 10);
        if (!x || x < 1) {
          alert("Informe um número válido de páginas.");
          return;
        }
        for (let s = 1; s <= totalPages; s += x) segments.push([s, Math.min(s + x - 1, totalPages)]);
      }
    } catch (err) {
      alert("Erro nos intervalos: " + (err instanceof Error ? err.message : err));
      return;
    }
    if (!segments.length) {
      alert("Nenhum intervalo válido.");
      return;
    }

    const isLargeFile = file.size > LARGE_FILE_THRESHOLD;
    const CONCURRENCY = isLargeFile ? 3 : 10;

    setRunning(true);
    setZipBlob(null);
    setStats({ found: 0, miss: 0 });
    setProgress({ pct: 0, label: `Dividindo em ${segments.length} parte(s)…` });

    const baseName = file.name.replace(/\.pdf$/i, "");
    const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    type Part = {
      bytes: Uint8Array;
      startPage: number;
      endPage: number;
      partLabel: string;
    };
    const parts: Part[] = [];

    for (let i = 0; i < segments.length; i++) {
      const [s, e] = segments[i];
      setProgress({
        pct: (i / segments.length) * (doOcr ? 40 : 90),
        label: `Criando parte ${i + 1}/${segments.length}…`,
      });
      const newDoc = await PDFDocument.create();
      const indices: number[] = [];
      for (let p = s; p <= e; p++) indices.push(p - 1);
      const copied = await newDoc.copyPages(srcDoc, indices);
      copied.forEach((pg) => newDoc.addPage(pg));
      const bytes = await newDoc.save();
      const partLabel =
        segments.length === 1
          ? `${baseName}_dividido`
          : mode === "all"
            ? `${baseName}_pag_${String(i + 1).padStart(String(totalPages).length, "0")}`
            : `${baseName}_parte_${String(i + 1).padStart(String(segments.length).length, "0")}_pgs_${s}-${e}`;
      parts.push({ bytes, startPage: s, endPage: e, partLabel });
      await yieldToBrowser();
    }

    setResults(
      parts.map((p, i) => ({
        index: i,
        partLabel: p.partLabel,
        startPage: p.startPage,
        endPage: p.endPage,
        status: "proc",
        finalName: `${p.partLabel}.pdf`,
        badge: "aguardando",
      })),
    );

    const nfContador: Record<string, number> = {};
    const zipResults: ZipItem[] = new Array(parts.length);
    let foundCount = 0;
    let missCount = 0;
    let completedCount = 0;

    async function processOne(i: number) {
      const part = parts[i];
      let row: ResultRow;

      if (doOcr) {
        const blob = new Blob([part.bytes as BlobPart], { type: "application/pdf" });
        const ocrResult = await ocrPart(blob, isLargeFile);
        let nomeFinal: string;
        let badge: string;
        let status: ResultRow["status"];

        if (ocrResult.numero) {
          const base = ocrResult.numero;
          if (nfContador[base] === undefined) nfContador[base] = 0;
          else nfContador[base]++;
          nomeFinal = nfContador[base] === 0 ? `${base}.pdf` : `${base}(${nfContador[base]}).pdf`;
          badge = ocrResult.via.toUpperCase();
          status = "ok";
          foundCount++;
        } else {
          nomeFinal = `sem_numero_${i + 1}.pdf`;
          badge = "NÃO ENCONTRADO";
          status = "miss";
          missCount++;
        }
        zipResults[i] = { bytes: part.bytes, name: nomeFinal };
        row = { index: i, partLabel: part.partLabel, startPage: part.startPage, endPage: part.endPage, status, finalName: nomeFinal, badge };
      } else {
        const nomeFinal = part.partLabel + ".pdf";
        zipResults[i] = { bytes: part.bytes, name: nomeFinal };
        foundCount++;
        row = { index: i, partLabel: part.partLabel, startPage: part.startPage, endPage: part.endPage, status: "ok", finalName: nomeFinal, badge: "DIVIDIDO" };
      }

      completedCount++;
      const pct = (doOcr ? 40 : 90) + (completedCount / parts.length) * (doOcr ? 55 : 5);
      setProgress({ pct, label: `Processando… ${completedCount}/${parts.length}` });
      setStats({ found: foundCount, miss: missCount });
      setResults((prev) => prev.map((r) => (r.index === i ? row : r)));
    }

    for (let start = 0; start < parts.length; start += CONCURRENCY) {
      const batch = parts.slice(start, start + CONCURRENCY).map((_, k) => processOne(start + k));
      await Promise.all(batch);
      await yieldToBrowser();
    }

    setProgress({ pct: 95, label: "Compactando ZIP…" });
    await yieldToBrowser();

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const folder = zip.folder(baseName)!;
    zipResults.forEach((item) => folder.file(item.name, item.bytes));

    const blob = await zip.generateAsync({ type: "blob", compression: "STORE" }, (m) =>
      setProgress({ pct: 95 + m.percent * 0.05, label: `Compactando… ${Math.round(m.percent)}%` }),
    );

    setProgress({ pct: 100, label: "✓ Concluído!" });
    setZipBlob(blob);
    setZipName(`${baseName}_NFe.zip`);
    setRunning(false);

    if (user) {
      addHistoricoPdf(user.uid, {
        arquivo: file.name,
        totalPaginas: totalPages,
        partes: zipResults.length,
        encontrados: foundCount,
        naoEncontrados: missCount,
        arquivos: zipResults.map((f) => f.name),
      }).catch((e) => console.error("Erro ao salvar histórico PDF:", e));
    }
  }

  function handleDownload() {
    if (!zipBlob) return;
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Split NF-e PDF</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Divida PDFs de nota fiscal com renomeação automática via OCR.
        </p>
      </div>

      {!file ? (
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
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border-strong p-10 text-center transition-colors",
            dragging && "border-primary bg-primary/5",
          )}
        >
          <UploadCloud className="size-6 text-faint" />
          <p className="text-sm font-medium">Arraste um PDF aqui ou clique para selecionar</p>
          <p className="text-xs text-faint">Limite de 500MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <Card className="flex items-center gap-3 p-4">
          <FileIcon className="size-5 shrink-0 text-faint" />
          <div className="flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-faint">
              {totalPages} página{totalPages > 1 ? "s" : ""} · {formatBytes(file.size)}
            </p>
          </div>
          <button onClick={reset} className="text-faint hover:text-status-red">
            <X className="size-4" />
          </button>
        </Card>
      )}

      {file && (
        <>
          <div className="flex gap-1 rounded-md bg-muted p-1 text-sm">
            {(["all", "range", "every"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded px-3 py-1.5 transition-colors",
                  mode === m ? "bg-card shadow-sm" : "text-muted-foreground",
                )}
              >
                {m === "all" ? "Cada página" : m === "range" ? "Intervalos" : "A cada N"}
              </button>
            ))}
          </div>

          {mode === "range" && (
            <Input
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              placeholder="Ex: 1-3,5,7-10"
            />
          )}
          {mode === "every" && (
            <Input
              type="number"
              min={1}
              value={everyInput}
              onChange={(e) => setEveryInput(e.target.value)}
              placeholder="Número de páginas por parte"
            />
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={doOcr}
              onChange={(e) => setDoOcr(e.target.checked)}
              className="size-4 rounded border-border-strong accent-[var(--accent)]"
            />
            Extrair número da NF-e (OCR)
          </label>

          <Button onClick={handleRun} disabled={running}>
            {running ? "Processando…" : doOcr ? "✂ Dividir e Processar" : "✂ Dividir PDF"}
          </Button>
        </>
      )}

      {progress && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.label}</span>
            <span>{Math.round(progress.pct)}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress.pct}%` }} />
          </div>
          {(stats.found > 0 || stats.miss > 0) && (
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-status-green">{stats.found} encontrado{stats.found !== 1 ? "s" : ""}</span>
              <span className="text-status-red">{stats.miss} não encontrado{stats.miss !== 1 ? "s" : ""}</span>
            </div>
          )}
        </Card>
      )}

      {results.length > 0 && (
        <Card className="divide-y divide-border overflow-hidden">
          {results.map((r) => (
            <div key={r.index} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-5 shrink-0 text-xs text-faint">{r.index + 1}</span>
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  r.status === "proc" && "bg-status-amber",
                  r.status === "ok" && "bg-status-green",
                  r.status === "miss" && "bg-status-red",
                )}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm",
                    r.status === "ok" && "text-status-green",
                    r.status === "miss" && "text-status-red",
                  )}
                >
                  {r.finalName}
                </p>
                <p className="text-xs text-faint">
                  {r.partLabel}.pdf · pgs {r.startPage}–{r.endPage}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                {r.badge}
              </span>
            </div>
          ))}
        </Card>
      )}

      {zipBlob && (
        <Button onClick={handleDownload} variant="outline" className="w-fit">
          <Download className="size-4" />
          Baixar ZIP
        </Button>
      )}
    </div>
  );
}

function yieldToBrowser() {
  return new Promise((r) => setTimeout(r, 0));
}
