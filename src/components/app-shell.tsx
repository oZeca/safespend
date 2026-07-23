import { Landmark } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="container flex min-w-0 flex-col items-start gap-3 py-3 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <Link className="flex shrink-0 items-center gap-2 font-semibold" href="/dashboard"><Landmark className="h-5 w-5" />SafeSpend</Link>
          <nav aria-label="Primary navigation" className="flex w-full min-w-0 items-center gap-4 overflow-x-auto whitespace-nowrap pb-1 text-sm sm:w-auto sm:pb-0"><Link className="text-muted-foreground hover:text-foreground" href="/dashboard">Dashboard</Link><Link className="text-muted-foreground hover:text-foreground" href="/accounts">Accounts</Link><Link className="text-muted-foreground hover:text-foreground" href="/transactions">Transactions</Link><Link className="text-muted-foreground hover:text-foreground" href="/forecast">Forecast</Link><Link className="text-muted-foreground hover:text-foreground" href="/imports">Imports</Link><Link className="text-muted-foreground hover:text-foreground" href="/rules">Rules</Link><Link className="text-muted-foreground hover:text-foreground" href="/settings">Settings</Link></nav>
        </div>
      </header>
      <main className="container min-w-0 py-6 sm:py-10">{children}</main>
    </div>
  );
}
