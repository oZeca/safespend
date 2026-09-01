"use client";

import { ChevronsLeft, ChevronsRight, Landmark } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppearance } from "@/components/appearance-provider";
import { isNavigationActive, navigation } from "@/components/navigation";
import { PrivacyToggle } from "@/components/privacy-provider";
import { cn } from "@/lib/utils";

export function DesktopSidebar() {
  const pathname = usePathname();
  const { sidebarExpanded, toggleSidebar } = useAppearance();
  return <aside className={cn("sidebar fixed inset-y-0 left-0 z-40 hidden border-r bg-background sm:flex sm:flex-col", sidebarExpanded ? "w-56" : "w-[4.25rem]")} data-expanded={sidebarExpanded}>
    <div className="flex h-20 items-center px-3">
      <Link className="group flex min-w-0 items-center gap-3" href="/dashboard" title="SafeSpend">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-foreground text-background shadow-sm"><Landmark className="h-5 w-5" /></span>
        {sidebarExpanded && <span className="truncate text-sm font-semibold tracking-tight">SafeSpend</span>}
      </Link>
    </div>
    <nav aria-label="Primary navigation" className="flex flex-1 flex-col gap-1 px-2 py-2">
      {navigation.map(({ href, label, icon: Icon }, index) => <Link aria-current={isNavigationActive(pathname, href) ? "page" : undefined} className={cn("group relative flex h-11 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground", isNavigationActive(pathname, href) && "bg-muted text-foreground", index === 4 && "mt-auto")} href={href} key={href} title={!sidebarExpanded ? label : undefined}>
        <Icon className="h-[18px] w-[18px] shrink-0" />{sidebarExpanded && <span>{label}</span>}
        {!sidebarExpanded && <span className="pointer-events-none absolute left-full z-50 ml-3 hidden rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-lg group-hover:block group-focus-visible:block">{label}</span>}
      </Link>)}
    </nav>
    <div className="space-y-1 border-t p-2">
      <div className={cn("flex", sidebarExpanded ? "justify-start" : "justify-center")}><PrivacyToggle compact={!sidebarExpanded} /></div>
      <button aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"} aria-pressed={sidebarExpanded} className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={toggleSidebar} type="button">
        {sidebarExpanded ? <ChevronsLeft className="h-[18px] w-[18px]" /> : <ChevronsRight className="h-[18px] w-[18px]" />}{sidebarExpanded && <span>Collapse</span>}
      </button>
    </div>
  </aside>;
}
