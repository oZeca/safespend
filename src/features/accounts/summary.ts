import type { Account, AccountSummary } from "./model";

export function calculateAccountSummary(accounts: Account[]): AccountSummary {
  return accounts.reduce<AccountSummary>((summary, account) => {
    if (account.isArchived) return summary;
    summary.activeAccountCount += 1;
    if (account.includedInAvailableCash) summary.availableCashCents += account.currentBalanceCents;
    if (account.includedInNetWorth) summary.netWorthCents += account.currentBalanceCents;
    return summary;
  }, { availableCashCents: 0, netWorthCents: 0, activeAccountCount: 0 });
}
