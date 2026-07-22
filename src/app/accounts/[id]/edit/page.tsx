import Link from "next/link";
import { notFound } from "next/navigation";
import { updateAccountAction } from "@/features/accounts/actions";
import { AccountForm } from "@/features/accounts/account-form";
import { formatCurrency } from "@/features/accounts/money";
import { getAccountRepository } from "@/features/accounts/server-repository";

export const dynamic = "force-dynamic";

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const repository = getAccountRepository(); const account = repository.findById(id); if (!account) notFound();
  const snapshots = repository.listBalanceSnapshots(id); const action = updateAccountAction.bind(null, id);
  return <section className="mx-auto max-w-3xl space-y-7"><div><Link className="text-sm text-muted-foreground hover:text-foreground" href="/accounts">← Accounts</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Edit {account.name}</h1></div><AccountForm account={account} action={action} />
    <div className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Balance history</h2><p className="mt-1 text-sm text-muted-foreground">Manual snapshots are recorded when the balance changes.</p>{snapshots.length ? <ul className="mt-4 divide-y">{snapshots.map((snapshot) => <li className="flex items-center justify-between py-3 text-sm" key={snapshot.id}><span>{snapshot.date}</span><span className="font-medium tabular-nums">{formatCurrency(snapshot.balanceCents, account.currency)}</span></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No balance history yet.</p>}</div>
  </section>;
}
