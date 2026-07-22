"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { accountTypeLabels, accountTypes, type Account } from "./model";
import type { AccountFormState } from "./actions";
import { formatMoneyInput } from "./validation";

type FormAction = (state: AccountFormState, formData: FormData) => Promise<AccountFormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button disabled={pending} type="submit">{pending ? "Saving…" : label}</Button>;
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-red-700">{errors[0]}</p>;
}

export function AccountForm({ action, account }: { action: FormAction; account?: Account }) {
  const [state, formAction] = useActionState(action, {});
  const values = state.values;
  const value = (key: string, fallback: string) => typeof values?.[key] === "string" ? values[key] as string : fallback;
  const checked = (key: string, fallback: boolean) => typeof values?.[key] === "boolean" ? values[key] as boolean : fallback;
  const inputClass = "h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <form action={formAction} className="space-y-6 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
      {state.message && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{state.message}</div>}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2"><span className="text-sm font-medium">Account name</span><input className={inputClass} defaultValue={value("name", account?.name ?? "")} name="name" required /><FieldError errors={state.errors?.name} /></label>
        <label className="space-y-2"><span className="text-sm font-medium">Institution <span className="font-normal text-muted-foreground">(optional)</span></span><input className={inputClass} defaultValue={value("institution", account?.institution ?? "")} name="institution" /><FieldError errors={state.errors?.institution} /></label>
        <label className="space-y-2"><span className="text-sm font-medium">Type</span><select className={inputClass} defaultValue={value("accountType", account?.accountType ?? "current")} name="accountType">{accountTypes.map((type) => <option key={type} value={type}>{accountTypeLabels[type]}</option>)}</select><FieldError errors={state.errors?.accountType} /></label>
        <label className="space-y-2"><span className="text-sm font-medium">Currency</span><select className={inputClass} defaultValue="EUR" name="currency"><option value="EUR">EUR — Euro</option></select><FieldError errors={state.errors?.currency} /></label>
        <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Current balance</span><div className="relative"><span className="absolute left-3 top-2 text-muted-foreground">€</span><input className={`${inputClass} pl-8`} defaultValue={value("currentBalance", account ? formatMoneyInput(account.currentBalanceCents) : "0.00")} inputMode="decimal" name="currentBalance" required /></div><p className="text-xs text-muted-foreground">Use a negative value for money owed.</p><FieldError errors={state.errors?.currentBalance} /></label>
      </div>
      <fieldset className="space-y-3"><legend className="text-sm font-medium">Include this account in</legend>
        <label className="flex items-start gap-3"><input className="mt-1 h-4 w-4 accent-emerald-700" defaultChecked={checked("includedInAvailableCash", account?.includedInAvailableCash ?? true)} name="includedInAvailableCash" type="checkbox" /><span><span className="block text-sm">Available cash</span><span className="text-xs text-muted-foreground">Money that can support current spending.</span></span></label>
        <label className="flex items-start gap-3"><input className="mt-1 h-4 w-4 accent-emerald-700" defaultChecked={checked("includedInNetWorth", account?.includedInNetWorth ?? true)} name="includedInNetWorth" type="checkbox" /><span><span className="block text-sm">Net worth</span><span className="text-xs text-muted-foreground">Count the balance in your overall position.</span></span></label>
      </fieldset>
      <div className="flex justify-end"><SubmitButton label={account ? "Save changes" : "Create account"} /></div>
    </form>
  );
}
