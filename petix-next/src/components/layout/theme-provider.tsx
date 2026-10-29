"use client";
import * as React from "react";

type Theme = "dark" | "light";

const ThemeContext = React.createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

// Paridade com o app atual: não há persistência de tema hoje (sempre volta
// a escuro ao recarregar). Se quiser persistir entre sessões, é só pedir.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>("dark");

  React.useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}
