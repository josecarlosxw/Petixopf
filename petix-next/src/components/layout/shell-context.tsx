"use client";
import * as React from "react";

type ShellContextValue = {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  cmdOpen: boolean;
  setCmdOpen: (open: boolean) => void;
  histCount: number | null;
  setHistCount: (n: number) => void;
  commCount: number | null;
  setCommCount: (n: number) => void;
};

const ShellContext = React.createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [histCount, setHistCount] = React.useState<number | null>(null);
  const [commCount, setCommCount] = React.useState<number | null>(null);

  // Atalho global ⌘K / Ctrl+K, equivalente ao cmdKeydown do app.js
  React.useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") setCmdOpen(false);
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  return (
    <ShellContext.Provider
      value={{
        mobileOpen,
        setMobileOpen,
        cmdOpen,
        setCmdOpen,
        histCount,
        setHistCount,
        commCount,
        setCommCount,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

export function useShell() {
  const ctx = React.useContext(ShellContext);
  if (!ctx) throw new Error("useShell deve ser usado dentro de ShellProvider");
  return ctx;
}
