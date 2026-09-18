"use client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useShell } from "@/components/layout/shell-context";

export function AppSidebar() {
  const { mobileOpen, setMobileOpen } = useShell();

  return (
    <>
      {/* Desktop: sidebar fixa, sempre visível */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-(--spacing-sidebar) border-r border-border bg-sidebar md:block">
        <SidebarNav />
      </aside>

      {/* Mobile: drawer, equivalente a toggleSidebar()/closeSidebar() */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 md:hidden">
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
