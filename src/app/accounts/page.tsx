import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { archiveAccountAction, updateAccountBalanceAction } from "@/features/accounts/actions";
import { ArchiveButton } from "@/features/accounts/archive-button";
import { InlineBalanceInput } from "@/features/accounts/inline-balance-input";
import { formatCurrency } from "@/features/accounts/money";
import { accountTypeLabels, type Account } from "@/features/accounts/model";
import { getAccountRepository } from "@/features/accounts/server-repository";
import { calculateAccountSummary } from "@/features/accounts/summary";

export const dynamic = "force-dynamic";

const statusMessages: Record<string, string> = { created: "Account created.", updated: "Account updated.", archived: "Account archived.", "archive-error": "The account could not be archived." };

function AccountCard({ account }: { account: Account }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{account.name}</h2>{account.isArchived && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Archived</span>}</div>
        <p className="mt-1 text-sm text-muted-foreground">{accountTypeLabels[account.accountType]}{account.institution ? ` · ${account.institution}` : ""}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">{account.includedInAvailableCash && <span>Available cash</span>}{account.includedInNetWorth && <span>Net worth</span>}</div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">{account.isArchived || account.balanceMode === "calculated" ? <div className="text-right"><p className="text-xl font-semibold tabular-nums">{formatCurrency(account.currentBalanceCents, account.currency)}</p>{account.balanceMode === "calculated" && <p className="text-xs text-muted-foreground">{formatCurrency(account.openingBalanceCents, account.currency)} opening + {formatCurrency(account.currentBalanceCents - account.openingBalanceCents, account.currency)} transactions since {account.openingBalanceDate}</p>}</div> : <InlineBalanceInput accountName={account.name} action={updateAccountBalanceAction.bind(null, account.id)} balanceCents={account.currentBalanceCents} currency={account.currency} />}
        {!account.isArchived && <div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href={`/accounts/${account.id}/edit`}>Edit</Link></Button><form action={archiveAccountAction}><input name="id" type="hidden" value={account.id} /><ArchiveButton accountName={account.name} /></form></div>}
      </div>
    </article>
  );
}

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const accounts = getAccountRepository().list();
  const active = accounts.filter((account) => !account.isArchived); const archived = accounts.filter((account) => account.isArchived);
  const summary = calculateAccountSummary(accounts);
  return (
    <section className="mx-auto max-w-5xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Accounts</p><h1 className="text-3xl font-semibold tracking-tight">Balances and accounts</h1><p className="mt-2 text-sm text-muted-foreground">Control which balances contribute to available cash and net worth.</p></div><Button asChild><Link href="/accounts/new"><Plus className="mr-2 h-4 w-4" />Add account</Link></Button></div>
      {status && statusMessages[status] && <div className={`rounded-md border p-3 text-sm ${status === "archive-error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`} role="status">{statusMessages[status]}</div>}
      <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Available cash</p><p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(summary.availableCashCents)}</p></div><div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Net worth</p><p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(summary.netWorthCents)}</p></div><div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">Active accounts</p><p className="mt-2 text-2xl font-semibold">{summary.activeAccountCount}</p></div></div>
      {active.length ? <div className="space-y-3">{active.map((account) => <AccountCard account={account} key={account.id} />)}</div> : <div className="rounded-xl border border-dashed bg-card p-10 text-center"><h2 className="font-semibold">No active accounts yet</h2><p className="mt-2 text-sm text-muted-foreground">Add an account to begin tracking balances.</p><Button asChild className="mt-5"><Link href="/accounts/new">Add your first account</Link></Button></div>}
      {archived.length > 0 && <details className="rounded-xl border bg-card p-5"><summary className="cursor-pointer font-medium">Archived accounts ({archived.length})</summary><div className="mt-4 space-y-3">{archived.map((account) => <AccountCard account={account} key={account.id} />)}</div></details>}
    </section>
  );
}
