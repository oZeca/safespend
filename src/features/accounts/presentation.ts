import type { AccountType } from "./model";

export const accountTypeAccentClasses: Record<AccountType, string> = {
  current: "bg-sky-400",
  savings: "bg-emerald-400",
  cash: "bg-amber-400",
  credit: "bg-violet-400",
  investment: "bg-rose-400",
};
