"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { RestoreState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button disabled={pending} type="submit">{pending ? "Validating and restoring…" : "Restore database"}</Button>;
}

export function RestoreForm({ action }: { action: (state: RestoreState, formData: FormData) => Promise<RestoreState> }) {
  const [state, formAction] = useActionState(action, {});
  return <form action={formAction} className="space-y-4" onSubmit={(event) => { if (!window.confirm("Replace all current SafeSpend data with this backup?")) event.preventDefault(); }}>
    {state.message && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{state.message}</div>}
    <label className="block space-y-2"><span className="text-sm font-medium">SafeSpend database backup</span><input accept=".db,.sqlite,.sqlite3,application/vnd.sqlite3" className="block w-full rounded-md border bg-background p-2 text-sm" name="database" type="file" /><p className="text-xs text-muted-foreground">Maximum 100 MB. The file is integrity-checked and migrated before replacement.</p>{state.errors?.database?.[0] && <p className="text-sm text-red-700">{state.errors.database[0]}</p>}</label>
    <label className="block space-y-2"><span className="text-sm font-medium">Type RESTORE to confirm</span><input autoComplete="off" className="h-10 w-full rounded-md border bg-background px-3 text-sm" name="confirmation" /><p className="text-xs text-muted-foreground">This replaces accounts, transactions, imports, rules, goals, and settings.</p>{state.errors?.confirmation?.[0] && <p className="text-sm text-red-700">{state.errors.confirmation[0]}</p>}</label>
    <SubmitButton />
  </form>;
}
