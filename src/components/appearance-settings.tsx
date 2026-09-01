"use client";

import { Monitor, Moon, PanelLeft, Sun } from "lucide-react";
import { useAppearance, type ThemeMode } from "@/components/appearance-provider";
import { cn } from "@/lib/utils";

const themes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [{ value: "light", label: "Light", icon: Sun }, { value: "dark", label: "Dark", icon: Moon }, { value: "system", label: "System", icon: Monitor }];

export function AppearanceSettings() {
  const { theme, setTheme, sidebarExpanded, setSidebarExpanded } = useAppearance();
  return <section className="panel" id="appearance"><div className="panel-header"><div><p className="eyebrow">Preferences</p><h2 className="text-lg font-semibold">Appearance</h2><p className="mt-1 text-sm text-muted-foreground">Choose how SafeSpend looks on this browser.</p></div></div>
    <div className="panel-body space-y-6">
      <fieldset><legend className="text-sm font-medium">Theme</legend><div className="mt-3 grid grid-cols-3 gap-2">{themes.map(({ value, label, icon: Icon }) => <button aria-pressed={theme === value} className={cn("flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border bg-background text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", theme === value && "border-primary bg-muted")} key={value} onClick={() => setTheme(value)} type="button"><Icon className="h-5 w-5" />{label}</button>)}</div></fieldset>
      <div className="flex items-center justify-between gap-4 border-t pt-5"><div><p className="text-sm font-medium">Expanded desktop sidebar</p><p className="mt-1 text-xs text-muted-foreground">Show navigation labels alongside their icons.</p></div><button aria-label="Expanded desktop sidebar" aria-pressed={sidebarExpanded} className={cn("flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium", sidebarExpanded && "border-primary bg-primary text-primary-foreground")} onClick={() => setSidebarExpanded(!sidebarExpanded)} type="button"><PanelLeft className="h-4 w-4" />{sidebarExpanded ? "Expanded" : "Collapsed"}</button></div>
    </div>
  </section>;
}
