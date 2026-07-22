import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createTransactionAction } from "@/features/transactions/actions";
import { getTransactionRepository } from "@/features/transactions/server-repository";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { localDateString } from "@/lib/dates";

export const dynamic = "force-dynamic";
export default function NewTransactionPage() {
  const options = getTransactionRepository().listOptions();
  return <section className="mx-auto max-w-3xl space-y-6"><div><Link className="text-sm text-muted-foreground hover:text-foreground" href="/transactions">← Transactions</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Add transaction</h1></div>
    {options.accounts.length ? <TransactionForm accounts={options.accounts} action={createTransactionAction} categories={options.categories} defaultDate={localDateString()} /> : <div className="rounded-xl border border-dashed bg-card p-10 text-center"><h2 className="font-semibold">An account is required</h2><p className="mt-2 text-sm text-muted-foreground">Create an active account before recording transactions.</p><Button asChild className="mt-5"><Link href="/accounts/new">Add account</Link></Button></div>}
  </section>;
}
