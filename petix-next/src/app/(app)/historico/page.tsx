"use client";
import * as React from "react";
import { Clock3, FileText, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import { useShell } from "@/components/layout/shell-context";
import {
  listHistoricoConsulta,
  clearHistoricoConsulta,
  listHistoricoPdf,
  clearHistoricoPdf,
  type HistoricoConsultaEntry,
  type HistoricoPdfEntry,
} from "@/lib/firebase/historico";

function formatTime(d: Date) {
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString(
    "pt-BR",
    { hour: "2-digit", minute: "2-digit", second: "2-digit" },
  )}`;
}

export default function HistoricoPage() {
  const { user } = useAnonymousAuth();
  const { setHistCount } = useShell();
  const [tab, setTab] = React.useState<"consultas" | "pdfs">("consultas");

  const [consultas, setConsultas] = React.useState<HistoricoConsultaEntry[]>([]);
  const [pdfs, setPdfs] = React.useState<HistoricoPdfEntry[]>([]);
  const [pdfLoaded, setPdfLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    setLoading(true);
    listHistoricoConsulta(user.uid)
      .then((entries) => {
        setConsultas(entries);
        setHistCount(entries.length);
      })
      .catch((e) => console.error("Erro ao carregar histórico:", e))
      .finally(() => setLoading(false));
  }, [user, setHistCount]);

  React.useEffect(() => {
    if (!user || tab !== "pdfs" || pdfLoaded) return;
    setPdfLoaded(true);
    listHistoricoPdf(user.uid)
      .then(setPdfs)
      .catch((e) => console.error("Erro ao carregar histórico PDF:", e));
  }, [user, tab, pdfLoaded]);

  async function handleClearConsultas() {
    if (consultas.length === 0 || !user) return;
    if (!confirm("Limpar todo o histórico? Esta ação não pode ser desfeita.")) return;
    await clearHistoricoConsulta(user.uid);
    setConsultas([]);
    setHistCount(0);
  }

  async function handleClearPdfs() {
    if (pdfs.length === 0 || !user) return;
    if (!confirm("Limpar todo o histórico de PDFs?")) return;
    await clearHistoricoPdf(user.uid);
    setPdfs([]);
  }

  function copyCode(cod: string) {
    navigator.clipboard.writeText(cod).catch(() => {});
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("consultas")}
          className={cn(
            "border-b-2 px-4 py-2 text-sm transition-colors",
            tab === "consultas"
              ? "border-accent-foreground text-accent-foreground"
              : "border-transparent text-muted-foreground",
          )}
        >
          Consultas
        </button>
        <button
          onClick={() => setTab("pdfs")}
          className={cn(
            "border-b-2 px-4 py-2 text-sm transition-colors",
            tab === "pdfs"
              ? "border-accent-foreground text-accent-foreground"
              : "border-transparent text-muted-foreground",
          )}
        >
          PDFs (Split NF-e)
        </button>
      </div>

      {tab === "consultas" ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {loading
                ? "Carregando…"
                : `${consultas.length} registro${consultas.length !== 1 ? "s" : ""}`}
            </span>
            <Button variant="outline" size="sm" onClick={handleClearConsultas}>
              <Trash2 className="size-3.5" />
              Limpar histórico
            </Button>
          </div>

          {!loading && consultas.length === 0 && (
            <EmptyState
              icon={<Clock3 className="size-6" />}
              title="Nenhuma busca ainda"
              description="As consultas feitas na ferramenta Fornecedor → Petix aparecerão aqui automaticamente."
            />
          )}

          {consultas.map((e) => (
            <Card key={e.id} className="flex items-start gap-3 p-4">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-faint" />
              <div className="flex-1">
                <p className="text-sm font-medium">{e.query}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {e.found} código{e.found !== 1 ? "s" : ""} encontrado
                  {e.found !== 1 ? "s" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.codes.length > 0 ? (
                    e.codes.map((c, i) => (
                      <button
                        key={`${c}-${i}`}
                        onClick={() => copyCode(c)}
                        title="Clique para copiar"
                        className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-xs text-accent-foreground"
                      >
                        {c}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-faint">Nenhum resultado</span>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs text-faint">{formatTime(e.time)}</span>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{pdfs.length} registro{pdfs.length !== 1 ? "s" : ""}</span>
            <Button variant="outline" size="sm" onClick={handleClearPdfs}>
              <Trash2 className="size-3.5" />
              Limpar histórico
            </Button>
          </div>

          {pdfs.length === 0 && (
            <EmptyState
              icon={<FileText className="size-6" />}
              title="Nenhum PDF processado ainda"
              description="Os PDFs processados na ferramenta Split NF-e aparecerão aqui."
            />
          )}

          {pdfs.map((e) => (
            <Card key={e.id} className="flex items-start gap-3 p-4">
              <FileText className="mt-0.5 size-4 shrink-0 text-faint" />
              <div className="flex-1">
                <p className="text-sm font-medium">{e.arquivo}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {e.totalPaginas} pág. · {e.partes} partes · {e.encontrados} NF-e
                  encontradas
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.arquivos.slice(0, 5).map((n, i) => (
                    <span
                      key={i}
                      title={n}
                      className="max-w-[140px] truncate rounded-full border border-border-strong px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {n}
                    </span>
                  ))}
                  {e.arquivos.length > 5 && (
                    <span className="text-xs text-faint">
                      +{e.arquivos.length - 5} mais
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs text-faint">{formatTime(e.time)}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 p-10 text-center">
      <span className="text-faint">{icon}</span>
      <h3 className="font-medium">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}
