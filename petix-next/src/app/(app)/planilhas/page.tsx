"use client";
import * as React from "react";
import { SpreadsheetHome } from "@/components/tools/planilhas/spreadsheet-home";
import { SpreadsheetEditor, type FormatMap } from "@/components/tools/planilhas/spreadsheet-editor";
import { emptyGrid, DEFAULT_ROWS, DEFAULT_COLS, type SheetTab } from "@/lib/spreadsheet/engine";
import {
  saveSpreadsheet,
  listSpreadsheets,
  getSpreadsheet,
  deleteSpreadsheet,
  type SavedSheetMeta,
} from "@/lib/firebase/planilhas";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";

export default function PlanilhasPage() {
  const { user } = useAnonymousAuth();
  const [view, setView] = React.useState<"home" | "editor">("home");

  const [sheets, setSheets] = React.useState<SavedSheetMeta[]>([]);
  const [loadingList, setLoadingList] = React.useState(true);

  const [docId, setDocId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("Planilha sem título");
  const [tabs, setTabs] = React.useState<SheetTab[]>([]);
  const [formats, setFormats] = React.useState<FormatMap[]>([]);
  const [dirty, setDirty] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState("");
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshList = React.useCallback(() => {
    if (!user) return;
    setLoadingList(true);
    listSpreadsheets(user.uid)
      .then(setSheets)
      .finally(() => setLoadingList(false));
  }, [user]);

  React.useEffect(() => {
    refreshList();
  }, [refreshList]);

  const doSave = React.useCallback(
    async (silent = false) => {
      if (!user) {
        if (!silent) alert("Faça login para salvar.");
        return;
      }
      setSaveStatus("Salvando…");
      const result = await saveSpreadsheet({ uid: user.uid, docId, title, tabs });
      if ("error" in result) {
        setSaveStatus(result.error.includes("grande") ? "Muito grande!" : "Erro ao salvar");
        if (!silent) alert("Erro ao salvar: " + result.error);
        return;
      }
      setDocId(result.docId);
      setDirty(false);
      setSaveStatus("✓ Salvo");
      setTimeout(() => setSaveStatus(""), 2500);
    },
    [user, docId, title, tabs],
  );

  function markDirty() {
    setDirty(true);
    setSaveStatus("Não salvo •");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(true), 4000);
  }

  function handleChangeTabs(next: SheetTab[], markAsDirty?: boolean) {
    setTabs(next);
    if (markAsDirty) markDirty();
  }

  function handleNew() {
    setDocId(null);
    setTitle("Planilha sem título");
    setTabs([{ name: "Plan1", data: emptyGrid(DEFAULT_ROWS, DEFAULT_COLS) }]);
    setFormats([{}]);
    setDirty(false);
    setSaveStatus("");
    setView("editor");
  }

  async function handleImport(file: File) {
    try {
      const XLSX = await import("xlsx");
      const ab = await file.arrayBuffer();
      const ext = file.name.split(".").pop()?.toLowerCase();

      let wb;
      if (ext === "csv") {
        const text = new TextDecoder("utf-8").decode(ab);
        wb = XLSX.read(text, { type: "string" });
      } else {
        wb = XLSX.read(ab, { type: "array", cellDates: true, cellText: false });
      }

      const newTabs: SheetTab[] = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name];
        const raw = XLSX.utils.sheet_to_json<string[]>(ws, {
          header: 1,
          defval: "",
          raw: false,
          dateNF: "dd/mm/yyyy",
        });
        const usedCols = Math.max(...raw.map((r) => r.length), 1);
        const usedRows = raw.length;
        const totalRows = Math.max(usedRows + 20, DEFAULT_ROWS);
        const totalCols = Math.max(usedCols + 4, DEFAULT_COLS);
        const data = Array.from({ length: totalRows }, (_, r) =>
          Array.from({ length: totalCols }, (_, c) => String(raw[r]?.[c] ?? "")),
        );
        return { name, data };
      });

      setDocId(null);
      setTitle(file.name.replace(/\.[^.]+$/, ""));
      setTabs(newTabs);
      setFormats(newTabs.map(() => ({})));
      setDirty(true);
      setSaveStatus("Não salvo •");
      setView("editor");
    } catch (e) {
      alert(
        "Erro ao importar arquivo: " +
          (e instanceof Error ? e.message : e) +
          "\n\nVerifique se o arquivo é um .xlsx, .xls ou .csv válido.",
      );
    }
  }

  async function handleOpen(id: string) {
    const doc = await getSpreadsheet(id);
    if (!doc) {
      alert("Planilha não encontrada.");
      return;
    }
    const normalized = doc.tabs.map((t) => {
      const data = t.data || [];
      const rows = Math.max(data.length, DEFAULT_ROWS);
      const cols = Math.max(...data.map((r) => r.length), DEFAULT_COLS);
      return {
        name: t.name || "Plan1",
        data: Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => data[r]?.[c] ?? ""),
        ),
      };
    });
    setDocId(id);
    setTitle(doc.title);
    setTabs(normalized.length ? normalized : [{ name: "Plan1", data: emptyGrid(DEFAULT_ROWS, DEFAULT_COLS) }]);
    setFormats(normalized.map(() => ({})));
    setDirty(false);
    setSaveStatus("");
    setView("editor");
  }

  async function handleDelete(id: string) {
    if (!confirm("Deletar esta planilha permanentemente?")) return;
    await deleteSpreadsheet(id);
    refreshList();
  }

  function handleBack() {
    if (dirty) doSave(true);
    setView("home");
    refreshList();
  }

  async function handleExport() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    tabs.forEach((tab) => {
      const ws = XLSX.utils.aoa_to_sheet(tab.data);
      XLSX.utils.book_append_sheet(wb, ws, tab.name);
    });
    XLSX.writeFile(wb, (title || "planilha") + ".xlsx");
  }

  if (view === "home") {
    return (
      <SpreadsheetHome
        sheets={sheets}
        loading={loadingList}
        onNew={handleNew}
        onImport={handleImport}
        onOpen={handleOpen}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <SpreadsheetEditor
      title={title}
      tabs={tabs}
      formats={formats}
      saveStatus={saveStatus}
      onTitleChange={(t) => {
        setTitle(t);
        markDirty();
      }}
      onBack={handleBack}
      onChangeTabs={handleChangeTabs}
      onChangeFormats={setFormats}
      onSave={() => doSave(false)}
      onExport={handleExport}
    />
  );
}
