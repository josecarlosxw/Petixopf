"use client";
import * as React from "react";
import {
  ArrowLeft,
  Bold,
  Italic,
  Plus,
  Minus,
  Download,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  colLetter,
  cellRef,
  evalCell,
  emptyGrid,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  type SheetTab,
} from "@/lib/spreadsheet/engine";

export type CellFormat = { bold?: boolean; italic?: boolean };
// Formatação por célula, por aba: tabIndex -> "r-c" -> format.
// Diferente do app original (onde bold/italic eram aplicados só no DOM e
// desapareciam no próximo re-render), aqui persisto no estado — pequena
// melhoria deliberada para o recurso funcionar de verdade. Ver observação
// na entrega.
export type FormatMap = Record<string, CellFormat>;

export function SpreadsheetEditor({
  title,
  tabs,
  formats,
  saveStatus,
  onTitleChange,
  onBack,
  onChangeTabs,
  onChangeFormats,
  onSave,
  onExport,
}: {
  title: string;
  tabs: SheetTab[];
  formats: FormatMap[];
  saveStatus: string;
  onTitleChange: (title: string) => void;
  onBack: () => void;
  onChangeTabs: (tabs: SheetTab[], markDirty?: boolean) => void;
  onChangeFormats: (formats: FormatMap[]) => void;
  onSave: () => void;
  onExport: () => void;
}) {
  const [curTab, setCurTab] = React.useState(0);
  const [selR, setSelR] = React.useState(0);
  const [selC, setSelC] = React.useState(0);
  const [editing, setEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState("");
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; r: number; c: number } | null>(null);
  const clipboardRef = React.useRef<string>("");
  const gridWrapRef = React.useRef<HTMLDivElement>(null);

  const tab = tabs[curTab];
  const data = tab?.data ?? [];
  const rows = data.length;
  const cols = data[0]?.length || DEFAULT_COLS;
  const tabFormat = formats[curTab] ?? {};

  function updateCell(r: number, c: number, value: string) {
    const next = tabs.map((t, i) =>
      i === curTab
        ? { ...t, data: t.data.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? value : v)) : row)) }
        : t,
    );
    onChangeTabs(next, true);
  }

  function moveCell(dr: number, dc: number) {
    setSelR((r) => Math.min(rows - 1, Math.max(0, r + dr)));
    setSelC((c) => Math.min(cols - 1, Math.max(0, c + dc)));
  }

  function startEdit(r: number, c: number, initial?: string) {
    setSelR(r);
    setSelC(c);
    setEditing(true);
    setEditValue(initial ?? data[r]?.[c] ?? "");
  }

  function commitEdit() {
    if (editing) updateCell(selR, selC, editValue);
    setEditing(false);
  }

  function addRow() {
    onChangeTabs(
      tabs.map((t, i) => (i === curTab ? { ...t, data: [...t.data, Array(cols).fill("")] } : t)),
      true,
    );
  }
  function addCol() {
    onChangeTabs(
      tabs.map((t, i) => (i === curTab ? { ...t, data: t.data.map((row) => [...row, ""]) } : t)),
      true,
    );
  }
  function delRow() {
    if (rows <= 1) return;
    onChangeTabs(
      tabs.map((t, i) => (i === curTab ? { ...t, data: t.data.filter((_, ri) => ri !== selR) } : t)),
      true,
    );
    setSelR((r) => Math.max(0, r - 1));
  }
  function insertRowAt(r: number) {
    onChangeTabs(
      tabs.map((t, i) =>
        i === curTab ? { ...t, data: [...t.data.slice(0, r), Array(cols).fill(""), ...t.data.slice(r)] } : t,
      ),
      true,
    );
  }
  function insertColAt(c: number) {
    onChangeTabs(
      tabs.map((t, i) =>
        i === curTab ? { ...t, data: t.data.map((row) => [...row.slice(0, c), "", ...row.slice(c)]) } : t,
      ),
      true,
    );
  }
  function clearCell(r: number, c: number) {
    updateCell(r, c, "");
  }

  function toggleFormat(key: keyof CellFormat) {
    const fKey = `${selR}-${selC}`;
    const nextFormats = formats.map((f, i) => {
      if (i !== curTab) return f;
      const current = f[fKey] ?? {};
      return { ...f, [fKey]: { ...current, [key]: !current[key] } };
    });
    onChangeFormats(nextFormats);
  }

  function addTab() {
    const name = `Plan${tabs.length + 1}`;
    onChangeTabs([...tabs, { name, data: emptyGrid(DEFAULT_ROWS, DEFAULT_COLS) }], true);
    onChangeFormats([...formats, {}]);
    setCurTab(tabs.length);
  }

  function renameTab(i: number) {
    const name = prompt("Novo nome da aba:", tabs[i].name);
    if (name && name.trim()) {
      onChangeTabs(
        tabs.map((t, ti) => (ti === i ? { ...t, name: name.trim() } : t)),
        true,
      );
    }
  }

  // Navegação por teclado + atalhos, equivalente ao listener global do app.js
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInput = activeTag === "input" || activeTag === "textarea";
      if (isInput || editing) {
        if (e.key === "Enter" && isInput) return; // tratado pelo próprio input
        return;
      }
      if (e.key === "ArrowRight") { e.preventDefault(); moveCell(0, 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); moveCell(0, -1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); moveCell(1, 0); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveCell(-1, 0); }
      else if (e.key === "Tab") { e.preventDefault(); moveCell(0, e.shiftKey ? -1 : 1); }
      else if (e.key === "Enter") { e.preventDefault(); moveCell(1, 0); }
      else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); clearCell(selR, selC); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); onSave(); }
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { startEdit(selR, selC, e.key); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selR, selC, editing, rows, cols, curTab]);

  React.useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener("click", close, { once: true });
    return () => document.removeEventListener("click", close);
  }, [contextMenu]);

  return (
    <div className="flex h-[calc(100vh-var(--spacing-topbar)-3rem)] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-8 max-w-xs font-medium"
        />
        <span className="text-xs text-faint">{saveStatus}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => toggleFormat("bold")}>
            <Bold className="size-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => toggleFormat("italic")}>
            <Italic className="size-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-3.5" />
            Linha
          </Button>
          <Button variant="outline" size="sm" onClick={addCol}>
            <Plus className="size-3.5" />
            Coluna
          </Button>
          <Button variant="outline" size="sm" onClick={delRow}>
            <Minus className="size-3.5" />
            Linha
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="size-3.5" />
            Exportar
          </Button>
          <Button size="sm" onClick={onSave}>
            <Save className="size-3.5" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5">
        <span className="w-12 shrink-0 rounded bg-muted px-2 py-1 text-center font-mono text-xs">
          {cellRef(selR, selC)}
        </span>
        <input
          value={editing ? editValue : data[selR]?.[selC] ?? ""}
          onFocus={() => !editing && startEdit(selR, selC)}
          onChange={(e) => {
            setEditing(true);
            setEditValue(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitEdit();
              moveCell(1, 0);
            }
          }}
          onBlur={commitEdit}
          className="flex-1 bg-transparent font-mono text-sm outline-none"
          placeholder="Digite um valor ou fórmula (ex: =SOMA(A1:A5))"
        />
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => {
              setCurTab(i);
              setSelR(0);
              setSelC(0);
            }}
            onDoubleClick={() => renameTab(i)}
            className={cn(
              "shrink-0 rounded-t-md border border-b-0 border-border px-3.5 py-1.5 text-xs font-medium transition-colors",
              i === curTab ? "bg-card text-foreground" : "bg-transparent text-muted-foreground",
            )}
          >
            {t.name}
          </button>
        ))}
        <button
          onClick={addTab}
          className="shrink-0 rounded-t-md border border-b-0 border-dashed border-border-strong px-3 py-1.5 text-xs text-faint"
        >
          +
        </button>
      </div>

      <div ref={gridWrapRef} className="flex-1 overflow-auto rounded-md border border-border">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-[3] w-11 border border-border bg-muted" />
              {Array.from({ length: cols }, (_, c) => (
                <th
                  key={c}
                  onClick={() => setSelC(c)}
                  className="sticky top-0 z-[2] min-w-[110px] cursor-pointer select-none border border-border bg-muted px-1 py-1 text-center font-semibold text-muted-foreground"
                >
                  {colLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                <td
                  onClick={() => setSelR(r)}
                  className="sticky left-0 z-[1] cursor-pointer select-none border border-border bg-muted px-1 text-center text-muted-foreground"
                >
                  {r + 1}
                </td>
                {Array.from({ length: cols }, (_, c) => {
                  const isSel = r === selR && c === selC;
                  const isEditingThis = isSel && editing;
                  const raw = data[r]?.[c] ?? "";
                  const fmt = tabFormat[`${r}-${c}`];
                  return (
                    <td
                      key={c}
                      onClick={() => {
                        if (editing) commitEdit();
                        setSelR(r);
                        setSelC(c);
                      }}
                      onDoubleClick={() => startEdit(r, c)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelR(r);
                        setSelC(c);
                        setContextMenu({ x: e.clientX, y: e.clientY, r, c });
                      }}
                      style={{
                        fontWeight: fmt?.bold ? 700 : undefined,
                        fontStyle: fmt?.italic ? "italic" : undefined,
                      }}
                      className={cn(
                        "max-w-[200px] cursor-cell overflow-hidden border border-border px-1.5 py-0.5 whitespace-nowrap",
                        isSel ? "bg-primary/15 outline outline-2 -outline-offset-2 outline-primary" : "bg-card",
                      )}
                    >
                      {isEditingThis ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitEdit();
                              moveCell(1, 0);
                            } else if (e.key === "Tab") {
                              e.preventDefault();
                              commitEdit();
                              moveCell(0, 1);
                            } else if (e.key === "Escape") {
                              setEditing(false);
                            }
                          }}
                          className="w-full min-w-[90px] bg-transparent outline-none"
                        />
                      ) : (
                        String(evalCell(raw, data))
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contextMenu && (
        <div
          style={{ left: contextMenu.x, top: contextMenu.y }}
          className="fixed z-50 min-w-[190px] rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          {[
            { label: "📋 Copiar célula", fn: () => (clipboardRef.current = data[contextMenu.r]?.[contextMenu.c] ?? "") },
            { label: "📄 Colar", fn: () => updateCell(contextMenu.r, contextMenu.c, clipboardRef.current) },
            { label: "🗑 Limpar célula", fn: () => clearCell(contextMenu.r, contextMenu.c) },
            { label: "➕ Inserir linha acima", fn: () => insertRowAt(contextMenu.r) },
            { label: "➕ Inserir coluna à esq", fn: () => insertColAt(contextMenu.c) },
            { label: "🗑 Deletar linha", fn: () => { setSelR(contextMenu.r); delRow(); } },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.fn();
                setContextMenu(null);
              }}
              className="block w-full rounded px-3 py-1.5 text-left text-xs hover:bg-muted"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
