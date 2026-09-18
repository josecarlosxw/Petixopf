"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NAV_TOPBAR } from "@/components/layout/nav-data";
import { useShell } from "@/components/layout/shell-context";

export function Topbar() {
  const pathname = usePathname();
  const { setMobileOpen, setCmdOpen } = useShell();

  return (
    <header className="sticky top-0 z-20 flex h-(--spacing-topbar) items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </Button>

      <nav className="hidden items-center gap-1 md:flex">
        {NAV_TOPBAR.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCmdOpen(true)}
        className="ml-auto flex w-full max-w-xs items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-faint transition-colors hover:border-border-strong"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="rounded border border-border-strong bg-background px-1.5 py-0.5 font-mono text-[10px] text-faint">
          ⌘K
        </kbd>
      </button>
    </header>
  );
}
