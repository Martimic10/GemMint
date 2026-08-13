"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  ready: boolean;
}

const STORAGE_KEY = "gemmint-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isLightLocked() {
  return document.documentElement.dataset.themeLock === "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (isLightLocked()) {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    return;
  }
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return null;
}

/** First visit defaults to light; only honor an explicit stored choice. */
export function resolvePreferredTheme(): Theme {
  return readStoredTheme() ?? "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = resolvePreferredTheme();
    setThemeState(initial);
    applyTheme(initial);
    setReady(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, ready }),
    [theme, setTheme, toggleTheme, ready]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Forces light mode for dashboard / auth while mounted, then restores
 * the user's marketing-site preference on leave.
 */
export function ForceLightTheme({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.themeLock = "light";
    root.classList.remove("dark");
    root.style.colorScheme = "light";

    return () => {
      delete root.dataset.themeLock;
      applyTheme(resolvePreferredTheme());
    };
  }, []);

  return <>{children}</>;
}

/** Inline before hydration — keep dashboard/auth light; marketing defaults to light on first visit. */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(STORAGE_KEY)};var p=location.pathname||"";var locked=p.indexOf("/dashboard")===0||p.indexOf("/sign-in")===0;var r=document.documentElement;if(locked){r.dataset.themeLock="light";r.classList.remove("dark");r.style.colorScheme="light";return}var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t="light"}r.classList.toggle("dark",t==="dark");r.style.colorScheme=t}catch(e){}})();`;
