import { FileUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getImportRepository } from "@/features/imports/server-repository";
import { UploadForm } from "@/features/imports/upload-form";
import { getTransactionRepository } from "@/features/transactions/server-repository";

export const dynamic = "force-dynamic";
const statusLabel: Record<string, string> = { mapping: "Needs mapping", preview: "Ready to confirm", completed: "Completed" };
export default async function ImportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams; const repository = getImportRepository(); const imports = repository.list(); const profiles = repository.listProfiles(); const accounts = getTransactionRepository().listOptions().accounts;
  return <section className="mx-auto max-w-7xl space-y-6"><div><p className="eyebrow">Data intake</p><h1 className="page-title">Import transactions</h1><p className="mt-2 text-sm text-muted-foreground">Upload a CSV or Excel file, map its columns, validate, and confirm transactions before they enter your records.</p></div>
    {status === "confirm-error" && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">The import could not be confirmed.</div>}
    {accounts.length ? <UploadForm accounts={accounts} profiles={profiles} /> : <div className="rounded-xl border border-dashed bg-card p-10 text-center"><FileUp className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">An account is required</h2><p className="mt-2 text-sm text-muted-foreground">Create an active account before importing transactions.</p><Button asChild className="mt-5"><Link href="/accounts/new">Add account</Link></Button></div>}
    <div><h2 className="text-xl font-semibold">Recent imports</h2>{imports.length ? <div className="mt-4 space-y-3">{imports.map((item) => <article className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between" key={item.id}><div><p className="font-medium">{item.fileName}</p><p className="text-sm text-muted-foreground">{item.accountName} · {item.rowCount} rows{item.profileName ? ` · ${item.profileName}` : ""}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-muted px-2 py-1 text-xs">{statusLabel[item.status] ?? item.status}</span><Button asChild size="sm" variant="outline"><Link href={item.status === "mapping" ? `/imports/${item.id}/map` : `/imports/${item.id}/preview`}>Open</Link></Button></div></article>)}</div> : <div className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No imports yet.</div>}</div>
  </section>;
}
