import { Landmark } from "lucide-react";
import Link from "next/link";
import { MobileNavigation } from "@/components/mobile-navigation";
import { PwaProvider } from "@/features/pwa/pwa-provider";
import { PrivacyProvider, PrivacyToggle } from "@/components/privacy-provider";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <PwaProvider><PrivacyProvider><div className="min-h-screen w-full max-w-full overflow-x-clip bg-muted/40">
      <header className="border-b bg-background">
        <div className="container flex min-h-16 min-w-0 items-center justify-between gap-3">
          <Link className="flex shrink-0 items-center gap-2 font-semibold" href="/dashboard"><Landmark className="h-5 w-5" />SafeSpend</Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-4 whitespace-nowrap text-sm sm:flex"><Link className="text-muted-foreground hover:text-foreground" href="/dashboard">Dashboard</Link><Link className="text-muted-foreground hover:text-foreground" href="/accounts">Accounts</Link><Link className="text-muted-foreground hover:text-foreground" href="/transactions">Transactions</Link><Link className="text-muted-foreground hover:text-foreground" href="/forecast">Forecast</Link><Link className="text-muted-foreground hover:text-foreground" href="/imports">Imports</Link><Link className="text-muted-foreground hover:text-foreground" href="/rules">Rules</Link><Link className="text-muted-foreground hover:text-foreground" href="/settings">Settings</Link></nav>
          <PrivacyToggle />
        </div>
      </header>
      <main className="container min-w-0 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-6 sm:py-10">{children}</main>
      <MobileNavigation />
    </div></PrivacyProvider></PwaProvider>
  );
}
