"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { isNavigationActive as active, primaryNavigation as primary, secondaryNavigation as secondary } from "@/components/navigation";

export function MobileNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const previousPathname = useRef(pathname);
  const moreActive = secondary.some((item) => active(pathname, item.href));
  useEffect(() => {
    if (previousPathname.current !== pathname) setMoreOpen(false);
    previousPathname.current = pathname;
  }, [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMoreOpen(false); moreButton.current?.focus(); }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [moreOpen]);

  return <>
    {moreOpen && <button aria-label="Close more navigation" className="fixed inset-0 z-40 bg-black/20 sm:hidden" onClick={() => setMoreOpen(false)} type="button" />}
    {moreOpen && <div aria-label="More navigation" className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 rounded-xl border bg-background p-2 shadow-xl sm:hidden" role="menu">
      {secondary.map(({ href, icon: Icon, label }) => <Link aria-current={active(pathname, href) ? "page" : undefined} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-muted" href={href} key={href} role="menuitem"><Icon className="h-5 w-5" />{label}</Link>)}
    </div>}
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <div className="grid h-[4.75rem] grid-cols-5">
        {primary.map(({ href, icon: Icon, label }) => {
          const selected = active(pathname, href);
          return <Link aria-current={selected ? "page" : undefined} className={cn("flex min-h-11 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium", selected ? "text-primary" : "text-muted-foreground")} href={href} key={href}><Icon className="h-5 w-5" /><span>{label}</span></Link>;
        })}
        <button aria-expanded={moreOpen} aria-haspopup="menu" className={cn("flex min-h-11 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium", moreActive || moreOpen ? "text-primary" : "text-muted-foreground")} onClick={() => setMoreOpen((open) => !open)} ref={moreButton} type="button"><MoreHorizontal className="h-5 w-5" /><span>More</span></button>
      </div>
    </nav>
  </>;
}
