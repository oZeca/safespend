import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTransactionAction } from "@/features/transactions/actions";
import { getTransactionRepository } from "@/features/transactions/server-repository";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { localDateString } from "@/lib/dates";

export const dynamic = "force-dynamic";
export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const repository = getTransactionRepository(); const transaction = repository.findById(id); if (!transaction) notFound(); const options = repository.listOptions(transaction.accountId);
  return <section className="mx-auto max-w-3xl space-y-6"><div><Link className="text-sm text-muted-foreground hover:text-foreground" href="/transactions">← Transactions</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Edit transaction</h1></div><TransactionForm accounts={options.accounts} action={updateTransactionAction.bind(null, id)} categories={options.categories} defaultDate={localDateString()} transaction={transaction} /></section>;
}
