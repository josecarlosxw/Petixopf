import Link from "next/link";
import { Search, FileOutput } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    href: "/consulta",
    icon: Search,
    title: "Consulta Fornecedor → Petix",
    description:
      "Converta códigos Fornecedor em Petix instantaneamente. Busca unitária ou em lote.",
    variant: "blue" as const,
  },
  {
    href: "/split-nfe",
    icon: FileOutput,
    title: "Split NF-e PDF",
    description: "Divida PDFs de nota fiscal com renomeação automática via OCR.",
    variant: "green" as const,
  },
];

const VARIANT_CLASSES: Record<"blue" | "green", string> = {
  blue: "bg-sky-500/10 text-sky-400",
  green: "bg-primary/10 text-accent-foreground",
};

export function CategoryGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link key={cat.href} href={cat.href}>
            <Card className="flex h-full flex-col gap-3 p-5 transition-colors hover:border-border-strong">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-md",
                  VARIANT_CLASSES[cat.variant],
                )}
              >
                <Icon className="size-4" />
              </span>
              <h3 className="font-semibold">{cat.title}</h3>
              <p className="text-sm text-muted-foreground">{cat.description}</p>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
