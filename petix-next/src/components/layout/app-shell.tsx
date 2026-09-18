"use client";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { ShellProvider } from "@/components/layout/shell-context";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ShellProvider>
        <AppSidebar />
        <div className="flex min-h-screen flex-col md:pl-(--spacing-sidebar)">
          <Topbar />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
        <CommandPalette />
      </ShellProvider>
    </ThemeProvider>
  );
}
