import { Landmark, LayoutDashboard, PiggyBank, ReceiptText, Settings, Tags, Upload } from "lucide-react";

export const primaryNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/forecast", label: "Forecast", icon: PiggyBank },
] as const;

export const secondaryNavigation = [
  { href: "/imports", label: "Imports", icon: Upload },
  { href: "/rules", label: "Rules", icon: Tags },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const navigation = [...primaryNavigation, ...secondaryNavigation];

export function isNavigationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
