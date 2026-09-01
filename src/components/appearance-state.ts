export type ThemeMode = "light" | "dark" | "system";
export type ShellPreferences = { theme: ThemeMode; sidebarExpanded: boolean };

export const themeStorageKey = "safespend:v1:theme";
export const sidebarStorageKey = "safespend:v1:sidebar-expanded";

export function parseTheme(value: string | null): ThemeMode {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function parseSidebarExpanded(value: string | null) {
  return value === "true";
}
