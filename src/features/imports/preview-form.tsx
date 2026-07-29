"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/features/accounts/money";
import { confirmImportAction } from "./actions";
import type { ImportDetail } from "./model";

export function ImportPreviewForm({ detail }: { detail: ImportDetail }) {
  const selectable = detail.rows.filter((row) => !row.error && !row.isExactDuplicate);
  const selectableIds = selectable.map((row) => row.id);
  const [selectedIds, setSelectedIds] = useState(() => new Set(selectableIds));
  const toggle = (id: string) => setSelectedIds((current) => {
    const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });

  return <form action={confirmImportAction} className="space-y-4">
    <input name="importId" type="hidden" value={detail.id} />
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => setSelectedIds(new Set(selectableIds))} size="sm" type="button" variant="outline">Select all ready</Button>
      <Button onClick={() => setSelectedIds(new Set())} size="sm" type="button" variant="outline">Clear selection</Button>
      <span aria-live="polite" className="text-sm text-muted-foreground">{selectedIds.size} of {selectable.length} ready rows selected</span>
    </div>
    <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm">
      <thead className="bg-muted"><tr><th className="p-3">Import</th><th className="p-3">Row</th><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Merchant</th><th className="p-3 text-right">Amount</th><th className="p-3">Rule result</th><th className="p-3">Status</th></tr></thead>
      <tbody className="divide-y">{detail.rows.map((row) => {
        const canSelect = !row.error && !row.isExactDuplicate;
        return <tr className={!canSelect || !selectedIds.has(row.id) ? "bg-muted/30 text-muted-foreground" : undefined} key={row.id}>
          <td className="p-3"><input aria-label={`Import row ${row.rowNumber}`} checked={canSelect && selectedIds.has(row.id)} disabled={!canSelect} name="selectedRowId" onChange={() => toggle(row.id)} type="checkbox" value={row.id} /></td>
          <td className="p-3">{row.rowNumber}</td><td className="p-3">{row.date ?? "—"}</td><td className="p-3">{row.description ?? "—"}</td><td className="p-3">{row.merchant ?? "—"}</td>
          <td className="p-3 text-right tabular-nums">{row.amountCents === null ? "—" : formatCurrency(row.amountCents)}</td>
          <td className="p-3">{row.matchedRuleName ? <span>{row.suggestedCategoryName} · {row.suggestedTransactionType ?? "keep inferred type"}<span className="block text-xs text-muted-foreground">{row.matchedRuleName}</span></span> : "No match"}</td>
          <td className="p-3">{row.error ? <span className="text-red-700">{row.error}</span> : row.isExactDuplicate ? <span className="text-amber-700">Exact duplicate</span> : selectedIds.has(row.id) ? <span className="text-emerald-700">Ready</span> : <span>Excluded</span>}</td>
        </tr>;
      })}</tbody>
    </table></div></div>
    <div className="flex flex-col items-start justify-between gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
      <p className="text-sm text-muted-foreground">Duplicates and invalid rows are skipped automatically. Uncheck any other row you do not want to import.</p>
      <Button disabled={selectedIds.size === 0} type="submit">Confirm {selectedIds.size} transaction{selectedIds.size === 1 ? "" : "s"}</Button>
    </div>
  </form>;
}
