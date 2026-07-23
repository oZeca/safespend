"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatMoneyInput } from "@/features/accounts/validation";
import type { CategoryOption } from "@/features/transactions/model";
import type { TransferFormState } from "./actions";
import type { TransactionSplit } from "./model";

type Row = { key: number; categoryId: string; amount: string; notes: string };
type Action = (state: TransferFormState, data: FormData) => Promise<TransferFormState>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button disabled={pending} type="submit">{pending ? "Saving…" : "Save splits"}</Button>;
}

function ClearButton() {
  const { pending } = useFormStatus();
  return <Button disabled={pending} type="submit" variant="outline">{pending ? "Removing…" : "Remove splits"}</Button>;
}

function Status({ state }: { state: TransferFormState }) {
  if (state.message) return <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{state.message}</div>;
  if (state.success) return <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{state.success}</div>;
  return null;
}

export function SplitForm({ action, clearAction, categories, splits, disabled }: {
  action: Action; clearAction: Action; categories: CategoryOption[]; splits: TransactionSplit[]; disabled: boolean;
}) {
  const initialRows = useMemo<Row[]>(() => splits.length
    ? splits.map((split, index) => ({ key: index, categoryId: split.categoryId, amount: formatMoneyInput(split.amountCents), notes: split.notes ?? "" }))
    : [{ key: 0, categoryId: "", amount: "", notes: "" }, { key: 1, categoryId: "", amount: "", notes: "" }], [splits]);
  const [rows, setRows] = useState(initialRows);
  const [nextKey, setNextKey] = useState(initialRows.length);
  const [state, formAction] = useActionState(action, {});
  const [clearState, clearFormAction] = useActionState(clearAction, {});
  const router = useRouter();
  useEffect(() => { if (state.revision || clearState.revision) router.refresh(); }, [state.revision, clearState.revision, router]);
  const serialized = JSON.stringify(rows.map(({ categoryId, amount, notes }) => ({ categoryId, amount, notes })));
  const setRow = (key: number, field: keyof Omit<Row, "key">, value: string) => setRows((current) => current.map((row) => row.key === key ? { ...row, [field]: value } : row));
  return <div className="space-y-4">
    <Status state={state.message || state.success ? state : clearState} />
    {disabled ? <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Transfers cannot be split. Unlink and reclassify this transaction first.</p> : <>
      <form action={formAction} className="space-y-3">
        <input name="splits" type="hidden" value={serialized} />
        {rows.map((row, index) => <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_9rem_1fr_auto]" key={row.key}>
          <label className="space-y-1"><span className="text-xs font-medium">Category {index + 1}</span><select aria-label={`Split ${index + 1} category`} className="h-10 w-full rounded-md border bg-background px-3 text-sm" onChange={(event) => setRow(row.key, "categoryId", event.target.value)} value={row.categoryId}><option value="">Choose category</option>{categories.filter((category) => category.kind !== "transfer" && category.name !== "Uncategorized").map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="space-y-1"><span className="text-xs font-medium">Amount</span><input aria-label={`Split ${index + 1} amount`} className="h-10 w-full rounded-md border bg-background px-3 text-sm" inputMode="decimal" onChange={(event) => setRow(row.key, "amount", event.target.value)} placeholder="-25.00" value={row.amount} /></label>
          <label className="space-y-1"><span className="text-xs font-medium">Notes</span><input aria-label={`Split ${index + 1} notes`} className="h-10 w-full rounded-md border bg-background px-3 text-sm" onChange={(event) => setRow(row.key, "notes", event.target.value)} value={row.notes} /></label>
          <Button aria-label={`Remove split ${index + 1}`} disabled={rows.length <= 2} onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))} type="button" variant="outline">Remove</Button>
        </div>)}
        <div className="flex flex-wrap justify-between gap-3"><Button onClick={() => { setRows((current) => [...current, { key: nextKey, categoryId: "", amount: "", notes: "" }]); setNextKey((key) => key + 1); }} type="button" variant="outline">Add split</Button><SubmitButton /></div>
      </form>
      {splits.length > 0 && <form action={clearFormAction}><ClearButton /></form>}
    </>}
  </div>;
}
