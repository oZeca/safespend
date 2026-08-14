import { Banknote, ChartNoAxesCombined, CreditCard, PiggyBank, WalletCards } from "lucide-react";
import type { ComponentType } from "react";
import type { AccountType } from "./model";

const accountTypeIcons: Record<AccountType, ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  current: WalletCards,
  savings: PiggyBank,
  cash: Banknote,
  credit: CreditCard,
  investment: ChartNoAxesCombined,
};

export function AccountTypeIcon({ accountType, className }: { accountType: AccountType; className?: string }) {
  const Icon = accountTypeIcons[accountType];
  return <Icon aria-hidden="true" className={className} />;
}
