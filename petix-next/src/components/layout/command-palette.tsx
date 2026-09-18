"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ALL_NAV_ITEMS } from "@/components/layout/nav-data";
import { useShell } from "@/components/layout/shell-context";

export function CommandPalette() {
  const { cmdOpen, setCmdOpen } = useShell();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [highlighted, setHighlighted] = React.useState(0);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_NAV_ITEMS;
    return ALL_NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    );
  }, [query]);

  React.useEffect(() => {
    setHighlighted(0);
  }, [query, cmdOpen]);

  function goTo(href: string) {
    setCmdOpen(false);
    setQuery("");
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[highlighted]) {
      e.preventDefault();
      goTo(results[highlighted].href);
    }
  }

  return (
    <Dialog open={cmdOpen} onOpenChange={setCmdOpen}>
      <DialogContent showClose={false} className="top-[20%] translate-y-0 p-0 gap-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="size-4 text-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar ferramentas..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-faint">
              Nada encontrado.
            </p>
          )}
          {results.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => goTo(item.href)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  i === highlighted
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">
                  <span className="block">{item.label}</span>
                  <span className="block text-xs text-faint">{item.description}</span>
                </span>
                {item.badge && <Badge variant="muted">{item.badge}</Badge>}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
