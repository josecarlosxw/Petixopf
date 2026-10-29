import Link from "next/link";
import { Card } from "@/components/ui/card";

const KPIS = [
  {
    href: "/consulta",
    label: "Produtos Mapeados",
    value: "55",
    sub: "Fornecedor → Petix",
  },
  {
    href: "/split-nfe",
    label: "Split NF-e PDF",
    value: "OCR",
    sub: "Renomeação automática",
  },
];

export function KpiGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {KPIS.map((kpi) => (
        <Link key={kpi.href} href={kpi.href}>
          <Card className="p-5 transition-colors hover:border-border-strong">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-accent-foreground">
              {kpi.value}
            </p>
            <p className="mt-1 text-xs text-faint">{kpi.sub}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
