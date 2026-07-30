"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { formatMoneyInput } from "@/features/accounts/validation";
import type { TransactionFormState } from "./actions";
import { transactionTypeLabels, transactionTypes, type AccountOption, type CategoryOption, type Transaction } from "./model";

type FormAction = (state: TransactionFormState, formData: FormData) => Promise<TransactionFormState>;
function SubmitButton({ edit }: { edit: boolean }) { const { pending } = useFormStatus(); return <Button disabled={pending} type="submit">{pending ? "Saving…" : edit ? "Save changes" : "Create transaction"}</Button>; }
function FieldError({ errors }: { errors?: string[] }) { return errors?.length ? <p className="text-sm text-red-700">{errors[0]}</p> : null; }

export function TransactionForm({ action, accounts, categories, transaction, defaultDate }: { action: FormAction; accounts: AccountOption[]; categories: CategoryOption[]; transaction?: Transaction; defaultDate: string }) {
  const [state, formAction] = useActionState(action, {}); const values = state.values;
  const value = (key: string, fallback: string) => values?.[key] ?? fallback;
  const checked = (key: string, fallback: boolean) => values ? values[key] === "on" : fallback;
  const inputClass = "h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  return <form action={formAction} className="space-y-6 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
    {state.message && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{state.message}</div>}
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="space-y-2"><span className="text-sm font-medium">Account</span><select className={inputClass} defaultValue={value("accountId", transaction?.accountId ?? accounts[0]?.id ?? "")} name="accountId"><option disabled value="">Select account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><FieldError errors={state.errors?.accountId} /></label>
      <label className="space-y-2"><span className="text-sm font-medium">Date</span><input className={inputClass} defaultValue={value("date", transaction?.date ?? defaultDate)} name="date" required type="date" /><FieldError errors={state.errors?.date} /></label>
      <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Description</span><input className={inputClass} defaultValue={value("description", transaction?.description ?? "")} name="description" required /><FieldError errors={state.errors?.description} /></label>
      <label className="space-y-2"><span className="text-sm font-medium">Merchant <span className="font-normal text-muted-foreground">(optional)</span></span><input className={inputClass} defaultValue={value("merchant", transaction?.merchant ?? "")} name="merchant" /><FieldError errors={state.errors?.merchant} /></label>
      <label className="space-y-2"><span className="text-sm font-medium">Amount</span><input className={inputClass} defaultValue={value("amount", transaction ? formatMoneyInput(transaction.amountCents) : "")} inputMode="decimal" name="amount" placeholder="-45.20" required /><p className="text-xs text-muted-foreground">Negative leaves the account; positive enters it.</p><FieldError errors={state.errors?.amount} /></label>
      <label className="space-y-2"><span className="text-sm font-medium">Type</span><select className={inputClass} defaultValue={value("transactionType", transaction?.transactionType ?? "expense")} name="transactionType">{transactionTypes.map((type) => <option key={type} value={type}>{transactionTypeLabels[type]}</option>)}</select><FieldError errors={state.errors?.transactionType} /></label>
      <label className="space-y-2"><span className="text-sm font-medium">Category</span><select className={inputClass} defaultValue={value("categoryId", transaction?.categoryId ?? "")} name="categoryId"><option value="">Uncategorized</option>{categories.filter((category) => category.name !== "Uncategorized").map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><FieldError errors={state.errors?.categoryId} /></label>
      <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span></span><textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" defaultValue={value("notes", transaction?.notes ?? "")} name="notes" /><FieldError errors={state.errors?.notes} /></label>
      <fieldset className="space-y-3 rounded-md border p-4 sm:col-span-2"><legend className="px-1 text-sm font-medium">Forecast treatment</legend>
        <label className="flex items-start gap-3"><input className="mt-1 h-4 w-4 accent-emerald-700" defaultChecked={checked("isRecurring", transaction?.isRecurring ?? false)} name="isRecurring" type="checkbox" /><span><span className="block text-sm">Recurring actual</span><span className="text-xs text-muted-foreground">Exclude this actual from the variable-spending baseline because it is represented by a recurring assumption.</span></span></label>
        <label className="flex items-start gap-3"><input className="mt-1 h-4 w-4 accent-emerald-700" defaultChecked={checked("isExceptional", transaction?.isExceptional ?? false)} name="isExceptional" type="checkbox" /><span><span className="block text-sm">Exceptional transaction</span><span className="text-xs text-muted-foreground">Keep it in actual totals but exclude it from the historical forecast baseline.</span></span></label>
        <label className="flex items-start gap-3"><input className="mt-1 h-4 w-4 accent-emerald-700" defaultChecked={checked("excludedFromForecastBaseline", transaction?.excludedFromForecastBaseline ?? false)} name="excludedFromForecastBaseline" type="checkbox" /><span><span className="block text-sm">Exclude from forecast baseline</span><span className="text-xs text-muted-foreground">Use for other unusual items that should not shape projected variable spending.</span></span></label>
      </fieldset>
      <fieldset className="space-y-3 rounded-md border p-4 sm:col-span-2"><legend className="px-1 text-sm font-medium">Balance treatment</legend>
        <label className="flex items-start gap-3"><input className="mt-1 h-4 w-4 accent-emerald-700" defaultChecked={checked("excludedFromAccountBalance", transaction?.excludedFromAccountBalance ?? false)} name="excludedFromAccountBalance" type="checkbox" /><span><span className="block text-sm">Internal movement within this account</span><span className="text-xs text-muted-foreground">Keep the transaction visible but exclude it from calculated account balances. Use when one account combines internal pockets or funds.</span></span></label>
      </fieldset>
    </div><div className="flex justify-end"><SubmitButton edit={Boolean(transaction)} /></div>
  </form>;
}
