"use client";
import * as React from "react";
import { Search, X, Copy, Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FORNECEDOR_PETIX_DATA, type FornecedorPetixProduto } from "@/lib/data/fornecedor-petix-data";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import { addHistoricoConsulta } from "@/lib/firebase/historico";

/**
 * Extrai somente os dígitos de uma string e retorna os 3 últimos.
 * Ex: "10031181000191" -> "191" | "1-91" -> "191" | " 191 " -> "191"
 */
function last3Digits(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.slice(-3);
}

function findMatches(term: string): FornecedorPetixProduto[] {
  const key = last3Digits(term);
  // Exige pelo menos 3 dígitos no termo buscado para evitar
  // correspondências ambíguas/parciais.
  if (key.length < 3) return [];
  return FORNECEDOR_PETIX_DATA.filter((r) => last3Digits(r.cod_fornecedor) === key);
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 font-mono text-3xl font-semibold text-accent-foreground"
    >
      {code}
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
}

function ProdutoAnswerCard({ r }: { r: FornecedorPetixProduto }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-2 p-5">
        <p className="text-xs uppercase tracking-wide text-faint">código petix</p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(r.cod_petix).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex w-fit items-center gap-2 font-mono text-3xl font-semibold text-accent-foreground"
        >
          {r.cod_petix}
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
        <p className="text-sm text-muted-foreground">{r.desc_petix}</p>
        <p className="text-xs text-faint">
          {copied ? "✓ copiado!" : "clique no código para copiar"}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/40 p-5">
        <div>
          <p className="text-xs text-faint">código fornecedor</p>
          <p className="font-mono text-sm">{r.cod_fornecedor}</p>
          <p className="mt-2 max-w-xs text-xs text-muted-foreground">{r.desc_fornecedor.trim()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-faint">valor fornecedor</p>
          <p className="font-mono text-sm">R$ {parseFloat(r.valor_fornecedor).toFixed(2)}</p>
        </div>
      </div>
    </Card>
  );
}

function MultiRow({ r }: { r: FornecedorPetixProduto }) {
  const [flash, setFlash] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(r.cod_petix).catch(() => {});
        setFlash(true);
        setTimeout(() => setFlash(false), 700);
      }}
      className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-left last:border-b-0 transition-colors"
      style={{ background: flash ? "rgba(34,197,94,.08)" : undefined }}
    >
      <div>
        <p className="font-mono text-xs text-faint">{r.cod_fornecedor}</p>
        <p className="text-sm">{r.desc_petix}</p>
      </div>
      <span className="font-mono text-sm font-semibold text-accent-foreground">
        {r.cod_petix}
      </span>
    </button>
  );
}

export default function ConsultaPage() {
  const { user } = useAnonymousAuth();
  const [q, setQ] = React.useState("");
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleHistory(query: string, results: FornecedorPetixProduto[]) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!user) return;
      addHistoricoConsulta(user.uid, {
        query,
        codes: results.map((r) => r.cod_petix),
        found: results.length,
      }).catch((e) => console.error("Erro ao salvar histórico:", e));
    }, 900);
  }

  const terms = q
    .trim()
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  React.useEffect(() => {
    if (terms.length === 0) return;
    const all = terms.flatMap((t) => findMatches(t));
    if (all.length > 0) scheduleHistory(q.trim(), all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Consulta Fornecedor → Petix</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Converta códigos Fornecedor em Petix instantaneamente. Busca unitária ou em lote.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQ("")}
          placeholder="Digite os 3 últimos números do código do Fornecedor, separados por vírgula. Ex: 191, 046"
          className="h-11 pl-10 pr-10"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {terms.length === 0 && (
        <Card className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
          <span className="text-2xl">🔍</span>
          <h3 className="font-medium text-foreground">Pronto para buscar</h3>
          <p>
            Digite os 3 últimos números do código do Fornecedor, separados por vírgula.
            <br />
            Ex: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">191, 046</code>
          </p>
        </Card>
      )}

      {terms.length === 1 && <SingleResult term={terms[0]} />}
      {terms.length > 1 && <BatchResult terms={terms} />}
    </div>
  );
}

function SingleResult({ term }: { term: string }) {
  const matches = findMatches(term);
  if (matches.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-mono text-lg text-muted-foreground">&quot;{term}&quot;</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nenhum item encontrado para este código.
        </p>
      </Card>
    );
  }
  if (matches.length === 1) return <ProdutoAnswerCard r={matches[0]} />;
  return (
    <Card className="overflow-hidden">
      <p className="border-b border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
        {matches.length} resultados — clique para copiar o código petix
      </p>
      {matches.map((r) => (
        <MultiRow key={r.cod_petix} r={r} />
      ))}
    </Card>
  );
}

function BatchResult({ terms }: { terms: string[] }) {
  const seen = new Set<string>();
  const uniq = terms.filter((t) => (seen.has(t) ? false : (seen.add(t), true)));
  const foundCodes: string[] = [];
  const [copiedAll, setCopiedAll] = React.useState(false);

  const sections = uniq.map((term) => {
    const matches = findMatches(term);
    if (matches.length === 1) foundCodes.push(matches[0].cod_petix);
    return { term, matches };
  });

  return (
    <div className="flex flex-col gap-4">
      {foundCodes.length >= 2 && (
        <Card className="flex items-center justify-between gap-3 border-primary/20 bg-primary/5 p-4">
          <p className="text-sm">
            <strong>{foundCodes.length}</strong> códigos Petix ·{" "}
            {foundCodes.map((c, i) => (
              <span key={c}>
                <strong className="text-accent-foreground">{c}</strong>
                {i < foundCodes.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(foundCodes.join(", ")).catch(() => {});
              setCopiedAll(true);
              setTimeout(() => setCopiedAll(false), 2000);
            }}
          >
            {copiedAll ? "✓ Copiados!" : "⎘ Copiar todos"}
          </Button>
        </Card>
      )}

      {sections.map(({ term, matches }) => (
        <div key={term} className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {matches.length === 0 ? (
              <span className="text-status-red">…{term} não encontrado</span>
            ) : (
              <span>
                …{term} → {matches.length === 1 ? matches[0].cod_petix : `${matches.length} resultados`}
              </span>
            )}
          </p>
          {matches.length === 0 && (
            <Card className="p-4 text-sm text-muted-foreground">
              Nenhum item encontrado.
            </Card>
          )}
          {matches.length === 1 && <ProdutoAnswerCard r={matches[0]} />}
          {matches.length > 1 && (
            <Card className="overflow-hidden">
              {matches.map((r) => (
                <MultiRow key={r.cod_petix} r={r} />
              ))}
            </Card>
          )}
        </div>
      ))}
    </div>
  );
}
