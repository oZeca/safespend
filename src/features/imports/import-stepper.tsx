import { cn } from "@/lib/utils";

export function ImportStepper({ step }: { step: 1 | 2 | 3 }) {
  return <ol aria-label="Import progress" className="grid overflow-hidden rounded-lg border bg-card sm:grid-cols-3">{["Upload", "Mapping", "Review & import"].map((label, index) => { const number = index + 1; return <li aria-current={number === step ? "step" : undefined} className={cn("flex items-center gap-3 border-b px-4 py-4 text-xs last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0", number === step ? "font-semibold text-foreground" : number < step ? "text-primary" : "text-muted-foreground")} key={label}><span className={cn("grid h-7 w-7 place-items-center rounded-full border", number <= step && "border-current")}>{number < step ? "✓" : number}</span>{label}</li>; })}</ol>;
}
