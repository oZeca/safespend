"use client";

import { MobileNavigation } from "@/components/mobile-navigation";
import { PwaProvider } from "@/features/pwa/pwa-provider";
import { PrivacyProvider } from "@/components/privacy-provider";
import { AppearanceProvider, useAppearance } from "@/components/appearance-provider";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { cn } from "@/lib/utils";

function ShellContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const { sidebarExpanded } = useAppearance();
  return <PrivacyProvider><div className="min-h-screen bg-background">
    <DesktopSidebar />
    <div className={cn("app-content min-w-0", sidebarExpanded ? "sm:pl-56" : "sm:pl-[4.25rem]")}>
      <main className="min-w-0 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-5 sm:py-6 lg:px-7">{children}</main>
    </div>
    <MobileNavigation />
  </div></PrivacyProvider>;
}

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PwaProvider><AppearanceProvider><ShellContent>{children}</ShellContent></AppearanceProvider></PwaProvider>;
}
