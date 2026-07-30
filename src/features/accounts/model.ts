export const accountTypes = ["current", "savings", "cash", "credit", "investment"] as const;
export type AccountType = (typeof accountTypes)[number];
export const balanceModes = ["manual", "calculated"] as const;
export type BalanceMode = (typeof balanceModes)[number];

export interface Account {
  id: string;
  name: string;
  institution: string | null;
  accountType: AccountType;
  currency: string;
  currentBalanceCents: number;
  manualBalanceCents: number;
  balanceMode: BalanceMode;
  openingBalanceCents: number;
  openingBalanceDate: string;
  includedInAvailableCash: boolean;
  includedInNetWorth: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSummary {
  availableCashCents: number;
  netWorthCents: number;
  activeAccountCount: number;
}

export interface BalanceSnapshot { id: string; date: string; balanceCents: number; source: string; createdAt: string; }

export const accountTypeLabels: Record<AccountType, string> = {
  current: "Current account", savings: "Savings", cash: "Cash", credit: "Credit card", investment: "Investment"
};
