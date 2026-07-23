import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTransactionAction } from "@/features/transactions/actions";
import { getTransactionRepository } from "@/features/transactions/server-repository";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { clearSplitsAction, markAndLinkTransferAction, replaceSplitsAction, unlinkTransferAction } from "@/features/transfers/actions";
import { getTransferRepository } from "@/features/transfers/server-repository";
import { SplitForm } from "@/features/transfers/split-form";
import { TransferForm } from "@/features/transfers/transfer-form";
import { localDateString } from "@/lib/dates";

export const dynamic = "force-dynamic";
export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repository = getTransactionRepository();
  const transaction = repository.findById(id);
  if (!transaction) notFound();
  const options = repository.listOptions(transaction.accountId);
  const transferRepository = getTransferRepository();
  const splits = transferRepository.listSplits(id);
  const transferLink = transferRepository.findTransferLink(id);
  const candidates = transferRepository.listDestinationCandidates(id);
  if (transferLink?.role === "source" && transferLink.destination && !candidates.some((candidate) => candidate.id === transferLink.destination?.id)) candidates.unshift(transferLink.destination);
  return <section className="mx-auto max-w-3xl space-y-6">
    <div><Link className="text-sm text-muted-foreground hover:text-foreground" href="/transactions">← Transactions</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Edit transaction</h1></div>
    <TransactionForm accounts={options.accounts} action={updateTransactionAction.bind(null, id)} categories={options.categories} defaultDate={localDateString()} transaction={transaction} />
    <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
      <div><h2 className="text-xl font-semibold">Split transaction</h2><p className="mt-1 text-sm text-muted-foreground">Allocate the full signed amount across two or more categories. Saving splits clears the transaction-level category.</p></div>
      <SplitForm action={replaceSplitsAction.bind(null, id)} categories={options.categories} clearAction={clearSplitsAction.bind(null, id)} disabled={transaction.transactionType === "transfer" || Boolean(transferLink)} splits={splits} />
    </section>
    <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
      <div><h2 className="text-xl font-semibold">Transfer</h2><p className="mt-1 text-sm text-muted-foreground">Transfers move money between your accounts and are excluded from income and expense totals.</p></div>
      <div className="rounded-md bg-muted p-4 text-sm"><span className="font-medium">Credit-card payments:</span> when individual card purchases are imported as expenses, mark the bank payment and matching card credit as a transfer so the payment is not counted as a second expense.</div>
      <TransferForm action={markAndLinkTransferAction.bind(null, id)} amountCents={transaction.amountCents} candidates={candidates} link={transferLink} unlinkAction={unlinkTransferAction.bind(null, id)} />
    </section>
  </section>;
}
