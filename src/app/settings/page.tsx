import { DatabaseBackup, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restoreDatabaseAction } from "@/features/release/actions";
import { RestoreForm } from "@/features/release/restore-form";
import { getReleaseStatus } from "@/features/release/server-status";
import { InstallPwaCard } from "@/features/pwa/install-card";
import { AppearanceSettings } from "@/components/appearance-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const release = getReleaseStatus();
  return <section className="mx-auto max-w-6xl space-y-6">
    <div><p className="eyebrow">SafeSpend</p><h1 className="page-title">Settings</h1><p className="mt-2 text-sm text-muted-foreground">Appearance, local data, and recovery preferences.</p></div>
    {status === "restored" && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950" role="status">Database restored successfully. A timestamped pre-restore copy was retained beside the configured database.</div>}
    <div className="grid items-start gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="panel hidden p-2 lg:sticky lg:top-6 lg:block"><a className="block rounded-md px-3 py-2 text-sm hover:bg-muted" href="#appearance">Appearance</a><a className="block rounded-md px-3 py-2 text-sm hover:bg-muted" href="#data">Data & recovery</a><a className="block rounded-md px-3 py-2 text-sm hover:bg-muted" href="#runtime">Runtime</a></nav>
      <div className="space-y-6"><AppearanceSettings />
    <div id="data"><p className="eyebrow">Local data</p><h2 className="mb-4 text-lg font-semibold">Data and recovery</h2><div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-xl border bg-card p-5 shadow-sm"><DatabaseBackup className="h-6 w-6 text-primary" /><h2 className="mt-3 text-lg font-semibold">SQLite backup</h2><p className="mt-2 text-sm text-muted-foreground">A consistent snapshot containing all SafeSpend data and migrations.</p><Button asChild className="mt-5"><a download href="/api/backup"><Download className="mr-2 h-4 w-4" />Download backup</a></Button></section>
      <section className="rounded-xl border bg-card p-5 shadow-sm"><FileSpreadsheet className="h-6 w-6 text-primary" /><h2 className="mt-3 text-lg font-semibold">Transaction CSV</h2><p className="mt-2 text-sm text-muted-foreground">Active transactions with categories, splits, flags, transfer links, and import provenance.</p><Button asChild className="mt-5" variant="outline"><a download href="/api/export/transactions"><Download className="mr-2 h-4 w-4" />Export transactions</a></Button></section>
      <InstallPwaCard />
    </div></div>
    <section className="rounded-xl border border-red-200 bg-card p-5 shadow-sm sm:p-7"><h2 className="text-xl font-semibold">Restore database</h2><p className="mt-2 text-sm text-muted-foreground">Restore is destructive. SafeSpend first validates a temporary copy, then preserves the current database as a timestamped recovery file before atomically replacing it.</p><div className="mt-5"><RestoreForm action={restoreDatabaseAction} /></div></section>
    <section className="rounded-xl border bg-card p-5 text-sm shadow-sm" id="runtime"><p className="eyebrow">Environment</p><h2 className="font-semibold">Runtime defaults</h2><dl className="mt-4 grid gap-3 sm:grid-cols-3"><div><dt className="text-muted-foreground">Currency</dt><dd className="font-medium">{release.defaultCurrency}</dd></div><div><dt className="text-muted-foreground">Financial month starts</dt><dd className="font-medium">Day {release.financialMonthStartDay}</dd></div><div><dt className="text-muted-foreground">Applied migrations</dt><dd className="font-medium">{release.migrationCount}</dd></div></dl></section>
    </div></div>
  </section>;
}
