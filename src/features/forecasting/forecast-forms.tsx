"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { formatMoneyInput } from "@/features/accounts/validation";
import type { ForecastFormState } from "./actions";
import type { RecurringItem, SavingsGoal } from "./model";

type Action = (state: ForecastFormState, formData: FormData) => Promise<ForecastFormState>;
const inputClass = "h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
function ErrorMessage({ errors }: { errors?: string[] }) { return errors?.[0] ? <p className="text-xs text-red-700">{errors[0]}</p> : null; }
function Submit({ children }: { children: string }) { const { pending } = useFormStatus(); return <Button disabled={pending} type="submit">{pending ? "Saving…" : children}</Button>; }
function Alert({ state }: { state: ForecastFormState }) { return state.message ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{state.message}</div> : null; }

export function GoalForm({ action, goal, minimumBufferCents, defaultStartDate, defaultTargetDate }: {
  action: Action; goal: SavingsGoal | null; minimumBufferCents: number; defaultStartDate: string; defaultTargetDate: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const value = (key: string, fallback: string) => state.values?.[key] ?? fallback;
  return <form action={formAction} className="space-y-5">
    <Alert state={state} />
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Goal name</span><input className={inputClass} defaultValue={value("name", goal?.name ?? "Annual savings")} name="name" /><ErrorMessage errors={state.errors?.name} /></label>
      <label className="space-y-1.5"><span className="text-sm font-medium">Start date</span><input className={inputClass} defaultValue={value("startDate", goal?.startDate ?? defaultStartDate)} name="startDate" type="date" /><ErrorMessage errors={state.errors?.startDate} /></label>
      <label className="space-y-1.5"><span className="text-sm font-medium">Target date</span><input className={inputClass} defaultValue={value("targetDate", goal?.targetDate ?? defaultTargetDate)} name="targetDate" type="date" /><ErrorMessage errors={state.errors?.targetDate} /></label>
      <label className="space-y-1.5"><span className="text-sm font-medium">Annual target</span><input className={inputClass} defaultValue={value("targetAmount", goal ? formatMoneyInput(goal.targetAmountCents) : "")} inputMode="decimal" name="targetAmount" placeholder="12000.00" /><ErrorMessage errors={state.errors?.targetAmount} /></label>
      <label className="space-y-1.5"><span className="text-sm font-medium">Already saved at start</span><input className={inputClass} defaultValue={value("startingAmount", goal ? formatMoneyInput(goal.startingAmountCents) : "0.00")} inputMode="decimal" name="startingAmount" /><ErrorMessage errors={state.errors?.startingAmount} /></label>
      <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Minimum cash buffer</span><input className={inputClass} defaultValue={value("minimumCashBuffer", formatMoneyInput(minimumBufferCents))} inputMode="decimal" name="minimumCashBuffer" /><p className="text-xs text-muted-foreground">Reserved from safe-to-spend.</p><ErrorMessage errors={state.errors?.minimumCashBuffer} /></label>
    </div>
    <label className="flex items-start gap-3"><input className="mt-1 h-4 w-4 accent-emerald-700" defaultChecked={state.values ? state.values.includeInvestmentTransfers === "on" : goal?.includeInvestmentTransfers ?? false} name="includeInvestmentTransfers" type="checkbox" /><span><span className="block text-sm font-medium">Count investment transfers toward this goal</span><span className="text-xs text-muted-foreground">Positive transfers entering investment accounts are credited as savings.</span></span></label>
    <div className="flex justify-end"><Submit>{goal ? "Save goal" : "Create goal"}</Submit></div>
  </form>;
}

function AssumptionForm({ action, kind, defaultDate }: { action: Action; kind: "income" | "expense"; defaultDate: string }) {
  const [state, formAction] = useActionState(action, {});
  const value = (key: string, fallback = "") => state.values?.[key] ?? fallback;
  return <form action={formAction} className="space-y-3 rounded-md border p-4">
    <Alert state={state} />
    <label className="space-y-1"><span className="text-sm font-medium">Name</span><input className={inputClass} defaultValue={value("name")} name="name" placeholder={kind === "income" ? "Bonus" : "Annual insurance"} /><ErrorMessage errors={state.errors?.name} /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1"><span className="text-sm font-medium">Date</span><input className={inputClass} defaultValue={value("expectedDate", defaultDate)} name="expectedDate" type="date" /><ErrorMessage errors={state.errors?.expectedDate} /></label><label className="space-y-1"><span className="text-sm font-medium">Amount</span><input className={inputClass} defaultValue={value("amount")} inputMode="decimal" name="amount" placeholder="500.00" /><ErrorMessage errors={state.errors?.amount} /></label></div>
    <div className="flex justify-end"><Submit>{kind === "income" ? "Add expected income" : "Add planned expense"}</Submit></div>
  </form>;
}

export function IncomeForm(props: { action: Action; defaultDate: string }) { return <AssumptionForm {...props} kind="income" />; }
export function PlannedExpenseForm(props: { action: Action; defaultDate: string }) { return <AssumptionForm {...props} kind="expense" />; }

export function RecurringForm({ action, defaultDate, item }: { action: Action; defaultDate: string; item?: RecurringItem }) {
  const [state, formAction] = useActionState(action, {});
  const defaults: Record<string, string> = item ? {
    name: item.name, transactionType: item.transactionType, amount: formatMoneyInput(Math.abs(item.expectedAmountCents)),
    frequency: item.frequency, nextExpectedDate: item.nextExpectedDate, endDate: item.endDate ?? ""
  } : {};
  const value = (key: string, fallback = "") => state.values?.[key] ?? defaults[key] ?? fallback;
  return <form action={formAction} className="space-y-3 rounded-md border p-4">
    <Alert state={state} />
    <label className="space-y-1"><span className="text-sm font-medium">Name</span><input className={inputClass} defaultValue={value("name")} name="name" placeholder="Rent" /><ErrorMessage errors={state.errors?.name} /></label>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="space-y-1"><span className="text-sm font-medium">Type</span><select className={inputClass} defaultValue={value("transactionType", "expense")} name="transactionType"><option value="expense">Expense</option><option value="income">Income</option></select><ErrorMessage errors={state.errors?.transactionType} /></label>
      <label className="space-y-1"><span className="text-sm font-medium">Amount</span><input className={inputClass} defaultValue={value("amount")} inputMode="decimal" name="amount" placeholder="100.00" /><ErrorMessage errors={state.errors?.amount} /></label>
      <label className="space-y-1"><span className="text-sm font-medium">Frequency</span><select className={inputClass} defaultValue={value("frequency", "monthly")} name="frequency"><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select><ErrorMessage errors={state.errors?.frequency} /></label>
      <label className="space-y-1"><span className="text-sm font-medium">Next date</span><input className={inputClass} defaultValue={value("nextExpectedDate", defaultDate)} name="nextExpectedDate" type="date" /><ErrorMessage errors={state.errors?.nextExpectedDate} /></label>
      <label className="space-y-1"><span className="text-sm font-medium">End date <span className="font-normal text-muted-foreground">(optional)</span></span><input className={inputClass} defaultValue={value("endDate")} name="endDate" type="date" /><ErrorMessage errors={state.errors?.endDate} /></label>
    </div>
    <div className="flex justify-end"><Submit>{item ? "Save recurring item" : "Add recurring item"}</Submit></div>
  </form>;
}
