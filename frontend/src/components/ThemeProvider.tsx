import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ThemeContext } from "../lib/theme-context";
import type { Theme } from "../lib/theme-context";

const THEME_KEY = "mv_theme";

function initialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark"))
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
