"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ThemeContextValue = { dark: boolean; setDark: (dark: boolean) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, updateDark] = useState(false);

  useEffect(() => {
    updateDark(document.documentElement.dataset.theme === "dark");
    const synchronize = (event: StorageEvent) => {
      if (event.key === "brahma-theme" || event.key === null) {
        const next = event.newValue === "dark";
        document.documentElement.dataset.theme = next ? "dark" : "light";
        updateDark(next);
      }
    };
    window.addEventListener("storage", synchronize);
    return () => window.removeEventListener("storage", synchronize);
  }, []);

  function setDark(next: boolean) {
    document.documentElement.dataset.theme = next ? "dark" : "light";
    updateDark(next);
    try {
      localStorage.setItem("brahma-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("ThemeProvider is required");
  return theme;
}
