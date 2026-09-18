"use client";
import Link from "next/link";
import { ArrowRight, FileOutput, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShell } from "@/components/layout/shell-context";

export function DashHero() {
  const { setCmdOpen } = useShell();

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-8">
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border-strong px-3 py-1 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary" />
        PetixOps · Central de Operações
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">
        Bem-vindo ao <em className="italic text-accent-foreground">PetixOps</em>
      </h1>
      <p className="max-w-xl text-muted-foreground">
        Ferramentas internas para agilizar o dia a dia. Tudo roda no seu
        navegador — sem servidor, sem cadastro, sem custo.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button asChild>
          <Link href="/consulta">
            Consulta Fornecedor → Petix
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/split-nfe">
            <FileOutput className="size-3.5" />
            Split NF-e PDF
          </Link>
        </Button>
        <Button variant="outline" onClick={() => setCmdOpen(true)}>
          <Search className="size-3.5" />
          Buscar
          <span className="rounded border border-border-strong bg-background px-1.5 py-0.5 font-mono text-[10px] text-faint">
            ⌘K
          </span>
        </Button>
      </div>
    </div>
  );
}
