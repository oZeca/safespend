"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { CategoryOption } from "@/features/transactions/model";
import { transactionTypeLabels, transactionTypes } from "@/features/transactions/model";
import type { RuleFormState } from "./actions";
import { previewRuleAction } from "./actions";
import type { CategorizationRule } from "./model";

type FormAction = (state: RuleFormState, formData: FormData) => Promise<RuleFormState>;
function Submit({ edit }: { edit: boolean }) { const { pending } = useFormStatus(); return <Button disabled={pending} type="submit">{pending ? "Saving…" : edit ? "Save rule" : "Create rule"}</Button>; }
function ErrorText({ errors }: { errors?: string[] }) { return errors?.length ? <p className="text-sm text-red-700">{errors[0]}</p> : null; }
export function RuleForm({ action, categories, rule, defaults }: { action: FormAction; categories: CategoryOption[]; rule?: CategorizationRule; defaults?: Partial<Record<string, string>> }) {
  const [state, formAction] = useActionState(action, {}); const [previewState, previewAction] = useActionState(previewRuleAction, {}); const errors = state.errors ?? previewState.errors; const input = "h-10 w-full rounded-md border bg-background px-3 text-sm";
  const values = state.values ?? previewState.values; const value = (name: string, fallback: string) => values?.[name] ?? fallback;
  return <form action={formAction} className="space-y-6 rounded-xl border bg-card p-5 shadow-sm sm:p-7" key={values ? JSON.stringify(values) : "initial"}>
    {(state.message || previewState.message) && <div className={`rounded-md border p-3 text-sm ${errors ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`} role="status">{state.message ?? previewState.message}</div>}
    <div className="grid gap-5 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">Rule name</span><input className={input} defaultValue={value("name", rule?.name ?? defaults?.name ?? "")} name="name" required /><ErrorText errors={errors?.name} /></label>
      <label className="space-y-2"><span className="text-sm font-medium">Priority</span><input className={input} defaultValue={value("priority", String(rule?.priority ?? defaults?.priority ?? "100"))} min="0" max="10000" name="priority" required type="number" /><p className="text-xs text-muted-foreground">Lower numbers run first.</p><ErrorText errors={errors?.priority} /></label>
      <label className="space-y-2"><span className="text-sm font-medium">Match field</span><select className={input} defaultValue={value("matchField", rule?.matchField ?? defaults?.matchField ?? "normalized_description")} name="matchField"><option value="description">Description</option><option value="normalized_description">Normalized description</option><option value="merchant">Merchant</option></select></label>
      <label className="space-y-2"><span className="text-sm font-medium">Match type</span><select className={input} defaultValue={value("matchType", rule?.matchType ?? defaults?.matchType ?? "contains")} name="matchType"><option value="contains">Contains</option><option value="starts_with">Starts with</option><option value="exact">Exact</option><option value="regex">Regular expression</option></select></label>
      <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Pattern</span><input className={input} defaultValue={value("pattern", rule?.pattern ?? defaults?.pattern ?? "")} name="pattern" required /><p className="text-xs text-muted-foreground">Matching is case-insensitive.</p><ErrorText errors={errors?.pattern} /></label>
      <label className="space-y-2"><span className="text-sm font-medium">Assign category</span><select className={input} defaultValue={value("categoryId", rule?.categoryId ?? defaults?.categoryId ?? "")} name="categoryId" required><option value="">Select category</option>{categories.filter((category) => category.name !== "Uncategorized").map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><ErrorText errors={errors?.categoryId} /></label>
      <label className="space-y-2"><span className="text-sm font-medium">Assign type <span className="font-normal text-muted-foreground">(optional)</span></span><select className={input} defaultValue={value("transactionType", rule?.transactionType ?? defaults?.transactionType ?? "")} name="transactionType"><option value="">Keep current/inferred type</option>{transactionTypes.map((type) => <option key={type} value={type}>{transactionTypeLabels[type]}</option>)}</select></label>
    </div><label className="flex items-center gap-2 text-sm"><input defaultChecked={values ? values.isEnabled === "on" : rule?.isEnabled ?? true} name="isEnabled" type="checkbox" /> Enabled</label>
    <div className="flex flex-wrap gap-3"><Submit edit={Boolean(rule)} /><Button formAction={previewAction} type="submit" variant="outline">Preview matches</Button></div>
    {previewState.preview && <div className="rounded-xl border"><div className="border-b bg-muted p-3 text-sm font-medium">{previewState.preview.totalCount} matching transaction{previewState.preview.totalCount === 1 ? "" : "s"}</div>{previewState.preview.items.length ? <ul className="divide-y">{previewState.preview.items.map((item) => <li className="flex flex-col justify-between gap-1 p-3 text-sm sm:flex-row" key={item.id}><span>{item.description}{item.merchant ? ` · ${item.merchant}` : ""}</span><span className="text-muted-foreground">{item.date} · {item.accountName}</span></li>)}</ul> : <p className="p-4 text-sm text-muted-foreground">No current transactions match.</p>}</div>}
  </form>;
}
