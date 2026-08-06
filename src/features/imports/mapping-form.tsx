"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { mapImportAction, type ImportActionState } from "./actions";

function Submit() { const { pending } = useFormStatus(); return <Button disabled={pending} type="submit">{pending ? "Validating rows…" : "Preview import"}</Button>; }
export function MappingForm({ importId, headers, delimiter }: { importId: string; headers: string[]; delimiter: string }) {
  const [state, action] = useActionState<ImportActionState, FormData>(mapImportAction.bind(null, importId), {}); const select = "h-10 w-full rounded-md border bg-background px-3 text-sm";
  const column = (name: string, label: string, optional = false) => <label className="space-y-2"><span className="text-sm font-medium">{label}</span><select className={select} name={name}><option value="">{optional ? "Not mapped" : "Select column"}</option>{headers.map((header) => <option key={header} value={header}>{header}</option>)}</select>{state.errors?.[name] && <p className="text-sm text-red-700">{state.errors[name][0]}</p>}</label>;
  return <form action={action} className="space-y-6 rounded-xl border bg-card p-5 shadow-sm sm:p-7"><input name="delimiter" type="hidden" value={delimiter} />
    {state.message && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{state.message}</div>}
    <div className="grid gap-5 sm:grid-cols-2">{column("dateColumn", "Date column")}{column("descriptionColumn", "Description column")}{column("amountColumn", "Amount column")}{column("merchantColumn", "Merchant column (optional)", true)}
      <label className="space-y-2"><span className="text-sm font-medium">Date format</span><select className={select} name="dateFormat"><option value="YYYY-MM-DD">YYYY-MM-DD</option><option value="YYYY-MM-DD hh:mm:ss">YYYY-MM-DD hh:mm:ss</option><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="DD-MM-YYYY">DD-MM-YYYY</option></select></label>
      <label className="space-y-2"><span className="text-sm font-medium">Number format</span><select className={select} name="decimalFormat"><option value="decimal_dot">1,234.56</option><option value="decimal_comma">1.234,56</option></select></label>
    </div><div className="rounded-md bg-muted p-4"><label className="flex items-center gap-2 text-sm"><input name="saveProfile" type="checkbox" /> Save this mapping as a profile</label><label className="mt-3 block space-y-2"><span className="text-sm font-medium">Profile name</span><input className={select} name="profileName" placeholder="My bank export" />{state.errors?.profileName && <p className="text-sm text-red-700">{state.errors.profileName[0]}</p>}</label></div><Submit />
  </form>;
}
