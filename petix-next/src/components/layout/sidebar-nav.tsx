"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NAV_GERAL, NAV_FERRAMENTAS, NAV_DOCUMENTOS } from "@/components/layout/nav-data";
import { useShell } from "@/components/layout/shell-context";

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
  dynamicBadges,
}: {
  title: string;
  items: typeof NAV_GERAL;
  pathname: string;
  onNavigate?: () => void;
  dynamicBadges?: Record<string, number | null>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 text-[11px] font-medium text-faint">{title}</p>
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        const dynamicBadge = dynamicBadges?.[item.href];
        const badge =
          dynamicBadge !== undefined
            ? dynamicBadge !== null
              ? String(dynamicBadge)
              : undefined
            : item.badge;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {badge && <Badge variant={active ? "outline" : "muted"}>{badge}</Badge>}
          </Link>
        );
      })}
    </div>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { histCount, commCount } = useShell();

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <Link href="/" className="flex items-center gap-2 px-2 py-1.5">
        <img
          src="/fiv-icon.png"
          alt="FIV"
          className="size-8 shrink-0 rounded-md object-contain"
        />
        <span className="font-mono text-sm font-semibold tracking-tight">
          PetixOps
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
        <NavSection title="GERAL" items={NAV_GERAL} pathname={pathname} onNavigate={onNavigate} />
        <NavSection
          title="FERRAMENTAS"
          items={NAV_FERRAMENTAS}
          pathname={pathname}
          onNavigate={onNavigate}
          dynamicBadges={{ "/historico": histCount, "/comunidade": commCount }}
        />
        <NavSection title="DOCUMENTOS" items={NAV_DOCUMENTOS} pathname={pathname} onNavigate={onNavigate} />
      </nav>

      <Separator />

      <div className="flex flex-col gap-1">
        <p className="px-3 text-[11px] font-medium text-faint">CONFIGURAÇÕES</p>
        <div className="flex items-center justify-between rounded-md px-3 py-2">
          <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Settings className="size-4" />
            Tema
          </span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
