"use client";

import { Info } from "lucide-react";
import { useId, useState } from "react";

export function InfoTooltip({ calculation }: { calculation: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return <span className="group relative inline-flex shrink-0 align-middle">
    <button
      aria-describedby={id}
      aria-expanded={open}
      aria-label="Show calculation"
      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((value) => !value)}
      onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
      type="button"
    >
      <Info aria-hidden="true" className="h-3.5 w-3.5" />
    </button>
    <span
      className={`${open ? "block" : "hidden"} pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 whitespace-pre-line rounded-md bg-slate-950 px-3 py-2 text-left text-xs font-normal leading-relaxed text-white shadow-lg group-hover:block group-focus-within:block`}
      id={id}
      role="tooltip"
    >
      {calculation}
    </span>
  </span>;
}
