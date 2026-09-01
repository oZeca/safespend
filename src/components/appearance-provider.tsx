"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { parseSidebarExpanded, parseTheme, sidebarStorageKey, themeStorageKey, type ShellPreferences, type ThemeMode } from "@/components/appearance-state";
export type { ThemeMode, ShellPreferences } from "@/components/appearance-state";

type AppearanceContextValue = ShellPreferences & {
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  setSidebarExpanded: (expanded: boolean) => void;
  toggleSidebar: () => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [theme, updateTheme] = useState<ThemeMode>("system");
  const [sidebarExpanded, updateSidebarExpanded] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      updateTheme(parseTheme(localStorage.getItem(themeStorageKey)));
      updateSidebarExpanded(parseSidebarExpanded(localStorage.getItem(sidebarStorageKey)));
    } catch { /* Storage can be disabled without breaking the shell. */ }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const next = theme === "system" ? systemTheme() : theme;
      setResolvedTheme(next);
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  function setTheme(next: ThemeMode) {
    updateTheme(next);
    try { localStorage.setItem(themeStorageKey, next); } catch { /* See above. */ }
  }
  function setSidebarExpanded(next: boolean) {
    updateSidebarExpanded(next);
    try { localStorage.setItem(sidebarStorageKey, String(next)); } catch { /* See above. */ }
  }

  const value = useMemo(() => ({ theme, sidebarExpanded, resolvedTheme, setTheme, setSidebarExpanded, toggleSidebar: () => setSidebarExpanded(!sidebarExpanded) }), [theme, sidebarExpanded, resolvedTheme]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance must be rendered within AppearanceProvider.");
  return context;
}

export const appearanceBootScript = `(function(){try{var t=localStorage.getItem('${themeStorageKey}');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()`;
