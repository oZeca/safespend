import Link from "next/link";
import { createAccountAction } from "@/features/accounts/actions";
import { AccountForm } from "@/features/accounts/account-form";

export default function NewAccountPage() {
  return <section className="mx-auto max-w-3xl space-y-6"><div><Link className="text-sm text-muted-foreground hover:text-foreground" href="/accounts">← Accounts</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Add account</h1><p className="mt-2 text-sm text-muted-foreground">Balances are stored exactly in cents and can be changed later.</p></div><AccountForm action={createAccountAction} /></section>;
}
