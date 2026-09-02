import { ArrowDownRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatCurrency } from "@/features/accounts/money";
import type { ForecastResult } from "@/features/forecasting/model";

function calculation(forecast: ForecastResult) {
  const money = formatCurrency;
  return `${money(forecast.availableCashCents)} available cash\n+ ${money(forecast.monthExpectedIncomeCents + forecast.monthRecurringIncomeCents)} expected income\n− ${money(forecast.monthRecurringExpensesCents)} recurring payments\n− ${money(forecast.monthPlannedExpensesCents)} planned expenses\n− ${money(forecast.monthSavingsAllocationCents)} required savings\n− ${money(forecast.minimumCashBufferCents)} cash buffer\n= ${money(forecast.safeToSpendMonthCents)}`;
}

export function SafeToSpendHero({ forecast, monthLabel }: { forecast: ForecastResult; monthLabel: string }) {
  const isNegative = forecast.safeToSpendMonthCents < 0;
  const positiveSafe = Math.max(0, forecast.safeToSpendMonthCents);
  const chartPath = isNegative
    ? "M0 50 C180 48 320 55 480 52 S760 58 1000 54 L1000 100 L0 100 Z"
    : "M0 8 C160 15 280 22 400 37 S640 58 760 70 S900 88 1000 96 L1000 100 L0 100 Z";
  const linePath = chartPath.slice(0, chartPath.indexOf(" L1000"));
  const tone = isNegative ? "text-red-700 dark:text-red-300" : "text-emerald-800 dark:text-emerald-300";
  const stroke = isNegative ? "hsl(0 68% 48%)" : "hsl(var(--primary))";

  return <section className="relative isolate -mx-4 min-h-[24rem] w-auto overflow-hidden bg-gradient-to-b from-card/25 via-primary/[0.055] to-background px-5 py-7 sm:-mx-5 sm:min-h-[26rem] sm:px-8 sm:py-9 lg:-mx-7 lg:px-10" aria-labelledby="safe-to-spend-heading">
    <div className="relative z-10 max-w-2xl">
      <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
        <h1 id="safe-to-spend-heading">Safe to spend for the rest of {monthLabel}</h1>
        <InfoTooltip calculation={calculation(forecast)} />
      </div>
      <p className={`mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-6xl ${tone}`}>{formatCurrency(forecast.safeToSpendMonthCents)}</p>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">{isNegative ? "Current assumptions leave a shortfall. Review planned spending, cash, or this month’s savings allocation." : "Your remaining variable-spending allowance after expected payments, savings, and the minimum cash buffer."}</p>
      <div className="mt-6 grid max-w-xl grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-3">
        <div><p className="text-muted-foreground">This week</p><p className="mt-1 text-xl font-semibold tabular-nums">{formatCurrency(forecast.safeToSpendWeekCents)}</p></div>
        <div><p className="text-muted-foreground">Per day</p><p className="mt-1 text-xl font-semibold tabular-nums">{formatCurrency(forecast.safeToSpendDayCents)}</p></div>
        <div><p className="text-muted-foreground">Days remaining</p><p className="mt-1 text-xl font-semibold">{forecast.daysRemainingInMonth}</p></div>
      </div>
      <Link className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" href="#safe-to-spend-calculation">How this is calculated <ArrowRight className="h-4 w-4" /></Link>
    </div>
    <div className="absolute inset-x-0 bottom-0 h-[46%] opacity-80" aria-label={isNegative ? `Projected shortfall of ${formatCurrency(Math.abs(forecast.safeToSpendMonthCents))} through month end` : `Projected remaining allowance from ${formatCurrency(positiveSafe)} today to zero at month end`} role="img">
      <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
        <defs>
          <linearGradient id="safe-spend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={stroke} stopOpacity="0.2" /><stop offset="100%" stopColor={stroke} stopOpacity="0" /></linearGradient>
          <linearGradient id="safe-spend-line" x1="0" x2="1"><stop offset="0%" stopColor={stroke} stopOpacity="0.25" /><stop offset="55%" stopColor={stroke} stopOpacity="0.75" /><stop offset="100%" stopColor={stroke} stopOpacity="0.35" /></linearGradient>
        </defs>
        <path d={chartPath} fill="url(#safe-spend-fill)" />
        <path d={linePath} fill="none" stroke="url(#safe-spend-line)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute inset-x-5 bottom-3 flex items-center justify-between text-[11px] text-muted-foreground sm:inset-x-8 lg:inset-x-10"><span>Today</span><span className="flex items-center gap-1">Allowance guide <ArrowDownRight className="h-3 w-3" /></span><span>Month end</span></div>
    </div>
  </section>;
}
