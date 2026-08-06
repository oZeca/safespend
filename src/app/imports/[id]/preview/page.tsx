import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/features/accounts/money";
import { getImportRepository } from "@/features/imports/server-repository";
import { ImportPreviewForm } from "@/features/imports/preview-form";
import { getTransactionRepository } from "@/features/transactions/server-repository";

export const dynamic = "force-dynamic";
export default async function PreviewImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const detail = getImportRepository().findById(id); if (!detail) notFound(); if (detail.status === "mapping") redirect(`/imports/${id}/map`);
  const validCount = detail.rows.filter((row) => !row.error && !row.isExactDuplicate).length; const completed = detail.status === "completed";
  const categories = completed ? [] : getTransactionRepository().listOptions(detail.accountId).categories;
  return <section className="mx-auto max-w-6xl space-y-6"><div><Link className="text-sm text-muted-foreground hover:text-foreground" href="/imports">← Imports</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">{completed ? "Import result" : "Preview import"}</h1><p className="mt-2 text-sm text-muted-foreground">{detail.fileName} · {detail.accountName}</p></div>
    {completed && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">Import completed. {detail.importedCount} imported, {detail.skippedCount} duplicates skipped, {detail.excludedCount} manually excluded, {detail.errorCount} invalid.</div>}
    <div className="grid gap-4 sm:grid-cols-4"><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Rows</p><p className="mt-1 text-2xl font-semibold">{detail.rowCount}</p></div><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Ready</p><p className="mt-1 text-2xl font-semibold text-emerald-700">{completed ? detail.importedCount : validCount}</p></div><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Duplicates</p><p className="mt-1 text-2xl font-semibold">{detail.skippedCount}</p></div><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Invalid</p><p className="mt-1 text-2xl font-semibold text-red-700">{detail.errorCount}</p></div></div>
    {!completed && <ImportPreviewForm categories={categories} detail={detail} />}
    {completed && <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-muted"><tr><th className="p-3">Row</th><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Merchant</th><th className="p-3 text-right">Amount</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y">{detail.rows.map((row) => <tr key={row.id}><td className="p-3">{row.rowNumber}</td><td className="p-3">{row.date ?? "—"}</td><td className="p-3">{row.description ?? "—"}</td><td className="p-3">{row.merchant ?? "—"}</td><td className="p-3 text-right tabular-nums">{row.amountCents === null ? "—" : formatCurrency(row.amountCents)}</td><td className="p-3">{row.error ? <span className="text-red-700">Invalid</span> : row.isExactDuplicate ? <span className="text-amber-700">Duplicate skipped</span> : row.isSelected === false ? <span>Manually excluded</span> : <span className="text-emerald-700">Imported</span>}</td></tr>)}</tbody></table></div></div>}
    {completed && <Button asChild><Link href={`/transactions?account=${detail.accountId}`}>View imported transactions</Link></Button>}
  </section>;
}
