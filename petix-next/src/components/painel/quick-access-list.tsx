import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    href: "/consulta",
    category: "Ferramentas · Consulta",
    name: "Consulta Fornecedor → Petix",
    badge: "55 produtos",
    badgeClass: "bg-primary/10 border-primary/20 text-accent-foreground",
  },
  {
    href: "/split-nfe",
    category: "Ferramentas · PDF · OCR",
    name: "Split NF-e PDF",
    badge: "OCR",
    badgeClass: "bg-status-amber/10 border-status-amber/20 text-status-amber",
  },
  {
    href: "/planilhas",
    category: "Documentos · Editor",
    name: "Editor de Planilhas",
    badge: "Excel",
    badgeClass: "bg-primary/10 border-primary/20 text-status-green",
  },
  {
    href: "/comunidade",
    category: "Equipe · Comunicação",
    name: "Comunidade",
  },
];

export function QuickAccessList() {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {ITEMS.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-faint">{item.category}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-[10px]",
                    item.badgeClass,
                  )}
                >
                  {item.badge}
                </span>
              )}
              <ArrowRight className="size-3.5 text-faint" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
