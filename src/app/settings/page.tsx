import { DatabaseBackup, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restoreDatabaseAction } from "@/features/release/actions";
import { RestoreForm } from "@/features/release/restore-form";
import { getReleaseStatus } from "@/features/release/server-status";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const release = getReleaseStatus();
  return <section className="mx-auto max-w-4xl space-y-7">
    <div><p className="text-sm font-medium text-primary">Settings</p><h1 className="text-3xl font-semibold tracking-tight">Data and recovery</h1><p className="mt-2 text-sm text-muted-foreground">Download local copies before upgrades or material changes.</p></div>
    {status === "restored" && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950" role="status">Database restored successfully. A timestamped pre-restore copy was retained beside the configured database.</div>}
    <div className="grid gap-5 sm:grid-cols-2">
      <section className="rounded-xl border bg-card p-5 shadow-sm"><DatabaseBackup className="h-6 w-6 text-primary" /><h2 className="mt-3 text-lg font-semibold">SQLite backup</h2><p className="mt-2 text-sm text-muted-foreground">A consistent snapshot containing all SafeSpend data and migrations.</p><Button asChild className="mt-5"><a download href="/api/backup"><Download className="mr-2 h-4 w-4" />Download backup</a></Button></section>
      <section className="rounded-xl border bg-card p-5 shadow-sm"><FileSpreadsheet className="h-6 w-6 text-primary" /><h2 className="mt-3 text-lg font-semibold">Transaction CSV</h2><p className="mt-2 text-sm text-muted-foreground">Active transactions with categories, splits, flags, transfer links, and import provenance.</p><Button asChild className="mt-5" variant="outline"><a download href="/api/export/transactions"><Download className="mr-2 h-4 w-4" />Export transactions</a></Button></section>
    </div>
    <section className="rounded-xl border border-red-200 bg-card p-5 shadow-sm sm:p-7"><h2 className="text-xl font-semibold">Restore database</h2><p className="mt-2 text-sm text-muted-foreground">Restore is destructive. SafeSpend first validates a temporary copy, then preserves the current database as a timestamped recovery file before atomically replacing it.</p><div className="mt-5"><RestoreForm action={restoreDatabaseAction} /></div></section>
    <section className="rounded-xl border bg-card p-5 text-sm shadow-sm"><h2 className="font-semibold">Runtime defaults</h2><dl className="mt-4 grid gap-3 sm:grid-cols-3"><div><dt className="text-muted-foreground">Currency</dt><dd className="font-medium">{release.defaultCurrency}</dd></div><div><dt className="text-muted-foreground">Financial month starts</dt><dd className="font-medium">Day {release.financialMonthStartDay}</dd></div><div><dt className="text-muted-foreground">Applied migrations</dt><dd className="font-medium">{release.migrationCount}</dd></div></dl></section>
  </section>;
}
