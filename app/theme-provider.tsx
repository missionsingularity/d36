"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Appearance = "system" | "light" | "dark";
type ThemeContextValue = {
  dark: boolean;
  appearance: Appearance;
  setDark: (dark: boolean) => void;
  setAppearance: (appearance: Appearance) => void;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, updateDark] = useState(false);
  const [appearance, updateAppearance] = useState<Appearance>("system");

  useEffect(() => {
    const resolve = (value: Appearance) =>
      value === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : value === "dark";
    const apply = (value: Appearance) => {
      updateAppearance(value);
      const nextDark = resolve(value);
      document.documentElement.dataset.theme = nextDark ? "dark" : "light";
      updateDark(nextDark);
    };
    const stored = localStorage.getItem("brahma-theme");
    const initial: Appearance =
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "system";
    apply(initial);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = () => {
      if (appearance === "system") apply("system");
    };
    media.addEventListener("change", onMediaChange);
    const synchronize = (event: StorageEvent) => {
      if (event.key === "brahma-theme" || event.key === null) {
        const value = event.newValue;
        apply(
          value === "dark" || value === "light" || value === "system"
            ? value
            : "system",
        );
      }
    };
    window.addEventListener("storage", synchronize);
    return () => {
      media.removeEventListener("change", onMediaChange);
      window.removeEventListener("storage", synchronize);
    };
  }, [appearance]);

  function setAppearance(next: Appearance) {
    updateAppearance(next);
    const nextDark =
      next === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : next === "dark";
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    updateDark(nextDark);
    try {
      localStorage.setItem("brahma-theme", next);
    } catch {}
  }
  function setDark(next: boolean) {
    setAppearance(next ? "dark" : "light");
  }

  return (
    <ThemeContext.Provider value={{ dark, appearance, setDark, setAppearance }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("ThemeProvider is required");
  return theme;
}
