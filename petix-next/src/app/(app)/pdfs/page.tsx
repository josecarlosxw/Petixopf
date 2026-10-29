"use client";
import * as React from "react";
import { UploadCloud, FileText, Eye, Download, Trash2, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PdfCanvasViewer } from "@/components/tools/pdf-canvas-viewer";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import {
  savePdfDoc,
  listPdfDocs,
  getPdfDocBase64,
  deletePdfDoc,
  base64ToBlob,
  fileToBase64,
  formatSize,
  type SavedPdfMeta,
} from "@/lib/firebase/pdfs-docs";

export default function MeusPdfsPage() {
  const { user } = useAnonymousAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const [file, setFile] = React.useState<File | null>(null);
  const [totalPages, setTotalPages] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [saveProgress, setSaveProgress] = React.useState<{ pct: number; label: string } | null>(null);

  const [saved, setSaved] = React.useState<SavedPdfMeta[]>([]);
  const [openedBlob, setOpenedBlob] = React.useState<Blob | null>(null);
  const [openedName, setOpenedName] = React.useState("");

  const refreshSaved = React.useCallback(() => {
    if (!user) return;
    listPdfDocs(user.uid).then(setSaved).catch(console.error);
  }, [user]);

  React.useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  function handleFile(f: File) {
    if (f.type !== "application/pdf") return;
    setFile(f);
  }

  function closeUpload() {
    setFile(null);
    setTotalPages(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSave() {
    if (!file || !user) return;
    setSaving(true);
    setSaveProgress({ pct: 30, label: "Convertendo…" });
    try {
      const base64 = await fileToBase64(file);
      setSaveProgress({ pct: 70, label: "Salvando no Firestore…" });
      await savePdfDoc(user.uid, {
        nome: file.name,
        tamanho: file.size,
        paginas: totalPages,
        base64,
      });
      setSaveProgress({ pct: 100, label: "Salvo com sucesso!" });
      setTimeout(() => {
        setSaveProgress(null);
        closeUpload();
        refreshSaved();
      }, 800);
    } catch (e) {
      console.error(e);
      setSaveProgress(null);
      alert("Erro ao salvar: " + (e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  }

  async function openSaved(id: string) {
    setOpenedBlob(null);
    setOpenedName("Carregando…");
    try {
      const { nome, base64 } = await getPdfDocBase64(id);
      setOpenedName(nome);
      setOpenedBlob(base64ToBlob(base64));
    } catch (e) {
      console.error(e);
      setOpenedName("Erro ao carregar");
    }
  }

  async function downloadSaved(id: string) {
    try {
      const { nome, base64 } = await getPdfDocBase64(id);
      const blob = base64ToBlob(base64);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nome;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      console.error(e);
      alert("Erro ao baixar.");
    }
  }

  async function removeSaved(id: string) {
    if (!confirm("Remover este PDF?")) return;
    await deletePdfDoc(id);
    refreshSaved();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Meus PDFs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualize PDFs e salve-os no Firestore para acessar depois.
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
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <FileText className="size-5 shrink-0 text-faint" />
            <div className="flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-faint">{totalPages} página{totalPages !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={closeUpload} className="text-faint hover:text-status-red">
              <X className="size-4" />
            </button>
          </div>
          <PdfCanvasViewer blob={file} onTotalPages={setTotalPages} />
          {saveProgress ? (
            <div className="text-xs text-muted-foreground">
              {saveProgress.label} ({saveProgress.pct}%)
            </div>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="w-fit">
              Salvar no Firebase
            </Button>
          )}
        </Card>
      )}

      {openedBlob && (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <p className="truncate text-sm font-medium">{openedName}</p>
            <button onClick={() => setOpenedBlob(null)} className="text-faint hover:text-status-red">
              <X className="size-4" />
            </button>
          </div>
          <PdfCanvasViewer blob={openedBlob} />
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">PDFs salvos</h2>
        {saved.length === 0 && (
          <Card className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <FileText className="size-5 text-faint" />
            <h3 className="font-medium text-foreground">Nenhum PDF salvo</h3>
            <p>Faça upload e clique em Salvar no Firebase para manter o documento acessível.</p>
          </Card>
        )}
        {saved.map((doc) => (
          <Card key={doc.id} className="flex items-center gap-3 p-4">
            <FileText className="size-4 shrink-0 text-faint" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{doc.nome}</p>
              <p className="text-xs text-faint">
                {doc.paginas} pág. · {formatSize(doc.tamanho)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button variant="outline" size="sm" onClick={() => openSaved(doc.id)}>
                <Eye className="size-3.5" />
                Ver
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadSaved(doc.id)}>
                <Download className="size-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => removeSaved(doc.id)}>
                <Trash2 className="size-3.5 text-status-red" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
