"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { uploadCsvAction, type ImportActionState } from "./actions";
import type { AccountOption } from "@/features/transactions/model";
import type { ImportProfile } from "./model";

function Submit() { const { pending } = useFormStatus(); return <Button disabled={pending} type="submit">{pending ? "Reading file…" : "Upload and continue"}</Button>; }
export function UploadForm({ accounts, profiles }: { accounts: AccountOption[]; profiles: ImportProfile[] }) {
  const [state, action] = useActionState<ImportActionState, FormData>(uploadCsvAction, {}); const input = "h-10 w-full rounded-md border bg-background px-3 text-sm";
  return <form action={action} className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
    {state.message && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{state.message}</div>}
    <label className="block space-y-2"><span className="text-sm font-medium">CSV or Excel file</span><input accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="block w-full rounded-md border bg-background p-2 text-sm" name="file" required type="file" /><p className="text-xs text-muted-foreground">Excel imports use the first worksheet. Maximum 5 MB and 5,000 data rows.</p>{state.errors?.file && <p className="text-sm text-red-700">{state.errors.file[0]}</p>}</label>
    <label className="block space-y-2"><span className="text-sm font-medium">Account</span><select className={input} name="accountId" required><option value="">Select account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select>{state.errors?.accountId && <p className="text-sm text-red-700">{state.errors.accountId[0]}</p>}</label>
    <label className="block space-y-2"><span className="text-sm font-medium">Saved profile <span className="font-normal text-muted-foreground">(optional)</span></span><select className={input} name="profileId"><option value="">Map columns manually</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select><p className="text-xs text-muted-foreground">A saved profile skips mapping when its headers match.</p></label>
    <Submit />
  </form>;
}
