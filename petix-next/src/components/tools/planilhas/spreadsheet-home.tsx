"use client";
import * as React from "react";
import { UploadCloud, FileSpreadsheet, Plus, Trash2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SavedSheetMeta } from "@/lib/firebase/planilhas";

export function SpreadsheetHome({
  sheets,
  loading,
  onNew,
  onImport,
  onOpen,
  onDelete,
}: {
  sheets: SavedSheetMeta[];
  loading: boolean;
  onNew: () => void;
  onImport: (file: File) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [dragging, setDragging] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = sheets.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planilhas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Editor de planilhas com fórmulas, salvo no Firestore.
          </p>
        </div>
        <Button onClick={onNew}>
          <Plus className="size-4" />
          Nova planilha
        </Button>
      </div>

      <div
        id="xl-dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (!file) return;
          const ext = file.name.split(".").pop()?.toLowerCase();
          if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
            alert("Formato não suportado. Use .xlsx, .xls ou .csv");
            return;
          }
          onImport(file);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-border-strong p-6 text-center transition-colors",
          dragging && "border-primary bg-primary/5",
        )}
      >
        <UploadCloud className="size-5 text-faint" />
        <p className="text-sm">Arraste um .xlsx, .xls ou .csv para importar</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
        />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar planilhas..."
          className="pl-9"
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {!loading && filtered.length === 0 && (
        <Card className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
          <FileSpreadsheet className="size-6 text-faint" />
          Nenhuma planilha salva ainda.
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Card
            key={s.id}
            onClick={() => onOpen(s.id)}
            className="flex cursor-pointer flex-col gap-2 p-4 transition-colors hover:border-border-strong"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="flex-1 text-sm font-semibold leading-snug">{s.title}</p>
              <FileSpreadsheet className="size-4 shrink-0 text-accent-foreground" />
            </div>
            <p className="truncate font-mono text-xs text-faint">
              {s.tabNames.slice(0, 3).join(", ") || "Sem abas"}
              {s.tabNames.length > 3 ? "…" : ""}
              {s.rowCount ? ` · ${s.rowCount} linhas` : ""}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-faint">
                {s.updatedAt?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) ?? "—"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s.id);
                }}
                className="rounded p-1 text-status-red opacity-60 hover:bg-status-red/10 hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
