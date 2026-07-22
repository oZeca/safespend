import { Landmark } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Link className="flex items-center gap-2 font-semibold" href="/dashboard"><Landmark className="h-5 w-5" />SafeSpend</Link>
          <nav className="flex items-center gap-4 text-sm"><Link className="text-muted-foreground hover:text-foreground" href="/dashboard">Dashboard</Link><Link className="text-muted-foreground hover:text-foreground" href="/accounts">Accounts</Link></nav>
        </div>
      </header>
      <main className="container py-6 sm:py-10">{children}</main>
    </div>
  );
}
