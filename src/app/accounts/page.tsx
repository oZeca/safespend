import {
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Plus,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  archiveAccountAction,
  updateAccountBalanceAction,
} from "@/features/accounts/actions";
import { AccountOrderSelect } from "@/features/accounts/account-order-select";
import { ArchiveButton } from "@/features/accounts/archive-button";
import { InlineBalanceInput } from "@/features/accounts/inline-balance-input";
import { AccountTypeIcon } from "@/features/accounts/account-type-icon";
import { formatCurrency } from "@/features/accounts/money";
import {
  accountTypeLabels,
  accountTypes,
  type Account,
  type AccountType,
} from "@/features/accounts/model";
import { accountTypeAccentClasses } from "@/features/accounts/presentation";
import { getAccountRepository } from "@/features/accounts/server-repository";
import { calculateAccountSummary } from "@/features/accounts/summary";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusMessages: Record<string, string> = {
  created: "Account created.",
  updated: "Account updated.",
  archived: "Account archived.",
  "archive-error": "The account could not be archived.",
};

const accountOrderValues = ["name", "balance-desc", "balance-asc"] as const;
type AccountOrder = (typeof accountOrderValues)[number];

function orderAccounts(accounts: Account[], order: AccountOrder) {
  return [...accounts].sort((left, right) => {
    const typeOrder = accountTypes.indexOf(left.accountType) - accountTypes.indexOf(right.accountType);
    if (typeOrder !== 0) return typeOrder;
    if (order === "balance-desc") return right.currentBalanceCents - left.currentBalanceCents || left.name.localeCompare(right.name);
    if (order === "balance-asc") return left.currentBalanceCents - right.currentBalanceCents || left.name.localeCompare(right.name);
    return left.name.localeCompare(right.name);
  });
}

const accountTypePresentation: Record<
  AccountType,
  {
    icon: string;
    eyebrow: string;
  }
> = {
  current: {
    icon: "text-sky-600",
    eyebrow: "Everyday money",
  },
  savings: {
    icon: "text-emerald-600",
    eyebrow: "Savings",
  },
  cash: {
    icon: "text-amber-600",
    eyebrow: "Cash on hand",
  },
  credit: {
    icon: "text-violet-600",
    eyebrow: "Credit",
  },
  investment: {
    icon: "text-rose-600",
    eyebrow: "Long term",
  },
};

function InclusionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function AccountCard({ account }: { account: Account }) {
  const presentation = accountTypePresentation[account.accountType];
  const transactionsHref = `/transactions?account=${encodeURIComponent(account.id)}`;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-visible rounded-xl bg-muted/55 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:bg-muted/75 hover:shadow-md",
        account.isArchived && "opacity-70 hover:translate-y-0 hover:shadow-sm",
      )}
    >
      <span
        className={cn(
          "absolute left-4 top-0 h-1 w-10 -translate-y-1/2 rounded-full",
          accountTypeAccentClasses[account.accountType],
        )}
        aria-hidden="true"
      />
      <AccountTypeIcon
        accountType={account.accountType}
        className={cn(
          "pointer-events-none absolute bottom-10 right-4 h-10 w-10 opacity-25",
          presentation.icon,
        )}
      />
      <div className="min-w-0 pr-9">
        <div className="flex min-w-0 items-center justify-start gap-2">
          <h2 className="max-w-[55%] truncate font-semibold leading-5 tracking-tight">
            {account.name}
          </h2>
          <span className="shrink-0 self-center text-[10px] font-semibold uppercase leading-5 tracking-wider text-muted-foreground">
            {presentation.eyebrow}
          </span>
          {account.isArchived && (
            <span className="shrink-0 rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              Archived
            </span>
          )}
        </div>
        <div className="mt-1 flex min-w-0 items-center justify-start gap-2">
          <p className="max-w-[45%] truncate text-xs leading-4 text-muted-foreground">
            {account.institution ?? accountTypeLabels[account.accountType]}
          </p>
          <div className="flex shrink-0 items-center justify-start gap-2 leading-4">
            {account.includedInAvailableCash && (
              <InclusionBadge>
                <CircleDollarSign className="mr-1 h-3 w-3" />
                Cash
              </InclusionBadge>
            )}
            {account.includedInNetWorth && (
              <InclusionBadge>
                <Landmark className="mr-1 h-3 w-3" />
                Net worth
              </InclusionBadge>
            )}
            {!account.includedInAvailableCash && !account.includedInNetWorth && (
              <InclusionBadge>Excluded</InclusionBadge>
            )}
          </div>
        </div>
      </div>

      {!account.isArchived && (
        <details className="absolute right-3 top-3">
          <summary
            className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden"
            aria-label={`Account actions for ${account.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-40 rounded-lg border bg-card p-1.5 shadow-lg">
            <Link
              className="flex h-9 items-center rounded-md px-3 text-sm font-medium hover:bg-muted"
              href={`/accounts/${account.id}/edit`}
            >
              Edit account
            </Link>
            <form action={archiveAccountAction}>
              <input name="id" type="hidden" value={account.id} />
              <ArchiveButton accountName={account.name} />
            </form>
          </div>
        </details>
      )}

      <div className="mt-5">
        {account.isArchived || account.balanceMode === "calculated" ? (
          <div>
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-medium text-muted-foreground">
                Balance
              </p>
              {account.balanceMode === "calculated" && (
                <InfoTooltip
                  calculation={`From opening balance + transactions\n${formatCurrency(account.openingBalanceCents, account.currency)} opening + ${formatCurrency(account.currentBalanceCents - account.openingBalanceCents, account.currency)} transactions since ${account.openingBalanceDate}`}
                />
              )}
            </div>
            <div className="mt-0.5 flex min-w-0 items-end gap-2">
              <p className="min-w-0 text-2xl font-semibold tracking-tight tabular-nums">
                {formatCurrency(account.currentBalanceCents, account.currency)}
              </p>
              <Link
                className="ml-auto shrink-0 self-end text-xs font-medium text-primary hover:underline"
                href={transactionsHref}
              >
                Transactions <span aria-hidden="true">→</span>
              </Link>
            </div>
            {account.balanceMode === "manual" && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Updated manually
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">
              Balance
            </p>
            <div className="flex items-end gap-2">
              <InlineBalanceInput
                accountName={account.name}
                action={updateAccountBalanceAction.bind(null, account.id)}
                balanceCents={account.currentBalanceCents}
                currency={account.currency}
              />
              <Link
                className="ml-auto shrink-0 self-end text-xs font-medium text-primary hover:underline"
                href={transactionsHref}
              >
                Transactions <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "neutral",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "primary";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5",
        tone === "primary" ? "bg-emerald-950 text-white" : "bg-muted/60",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-4 w-4",
            tone === "primary" ? "text-emerald-300" : "text-muted-foreground",
          )}
        />
        <p
          className={cn(
            "text-sm font-medium",
            tone === "primary" ? "text-emerald-100" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p
        className={cn(
          "mt-1 text-xs",
          tone === "primary" ? "text-emerald-200" : "text-muted-foreground",
        )}
      >
        {detail}
      </p>
    </div>
  );
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; order?: string }>;
}) {
  const { status, order: requestedOrder } = await searchParams;
  const order: AccountOrder = accountOrderValues.includes(requestedOrder as AccountOrder) ? requestedOrder as AccountOrder : "balance-desc";
  const accounts = getAccountRepository().list();
  const active = orderAccounts(accounts.filter((account) => !account.isArchived), order);
  const archived = orderAccounts(accounts.filter((account) => account.isArchived), order);
  const summary = calculateAccountSummary(accounts);
  const investmentBalanceCents = active
    .filter(
      (account) =>
        account.accountType === "investment" && account.includedInNetWorth,
    )
    .reduce((total, account) => total + account.currentBalanceCents, 0);
  const currentAccounts = active.filter(
    (account) =>
      account.accountType === "current" && account.includedInAvailableCash,
  );
  const savingsAccounts = active.filter(
    (account) =>
      account.accountType === "savings" && account.includedInAvailableCash,
  );
  const currentBalanceCents = currentAccounts.reduce(
    (total, account) => total + account.currentBalanceCents,
    0,
  );
  const savingsBalanceCents = savingsAccounts.reduce(
    (total, account) => total + account.currentBalanceCents,
    0,
  );
  const availableAccountCount = active.filter(
    (account) => account.includedInAvailableCash,
  ).length;
  const investmentAccountCount = active.filter(
    (account) =>
      account.accountType === "investment" && account.includedInNetWorth,
  ).length;

  return (
    <section className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Your money</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Your accounts
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            See where your money lives and choose what contributes to the
            numbers that guide your spending.
          </p>
        </div>
        <Button asChild>
          <Link href="/accounts/new">
            <Plus className="mr-2 h-4 w-4" />
            Add account
          </Link>
        </Button>
      </div>
      {status && statusMessages[status] && (
        <div
          className={`rounded-md border p-3 text-sm ${status === "archive-error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
          role="status"
        >
          {statusMessages[status]}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SummaryCard
          detail={`${availableAccountCount} included account${availableAccountCount === 1 ? "" : "s"}`}
          icon={CircleDollarSign}
          label="Ready to spend"
          tone="primary"
          value={formatCurrency(summary.availableCashCents)}
        />
        <SummaryCard
          detail={`${currentAccounts.length} included current account${currentAccounts.length === 1 ? "" : "s"}`}
          icon={WalletCards}
          label="Current accounts"
          value={formatCurrency(currentBalanceCents)}
        />
        <SummaryCard
          detail={`${savingsAccounts.length} included savings account${savingsAccounts.length === 1 ? "" : "s"}`}
          icon={PiggyBank}
          label="Savings"
          value={formatCurrency(savingsBalanceCents)}
        />
        <SummaryCard
          detail={`${investmentAccountCount} included investment account${investmentAccountCount === 1 ? "" : "s"}`}
          icon={ChartNoAxesCombined}
          label="Investments"
          value={formatCurrency(investmentBalanceCents)}
        />
        <SummaryCard
          detail={`${summary.activeAccountCount} active account${summary.activeAccountCount === 1 ? "" : "s"} in total`}
          icon={Building2}
          label="Net worth"
          value={formatCurrency(summary.netWorthCents)}
        />
      </div>
      {active.length ? (
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Account overview</h2>
            <div className="flex items-center gap-3">
              <p className="hidden text-xs text-muted-foreground sm:block">{active.length} active</p>
              <AccountOrderSelect value={order} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {active.map((account) => (
              <AccountCard account={account} key={account.id} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <h2 className="font-semibold">No active accounts yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add an account to begin tracking balances.
          </p>
          <Button asChild className="mt-5">
            <Link href="/accounts/new">Add your first account</Link>
          </Button>
        </div>
      )}
      {archived.length > 0 && (
        <details className="rounded-xl border bg-card p-5">
          <summary className="cursor-pointer font-medium">
            Archived accounts ({archived.length})
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {archived.map((account) => (
              <AccountCard account={account} key={account.id} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
