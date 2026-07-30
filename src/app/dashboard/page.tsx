import { AlertTriangle, ArrowRight, Landmark, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatCurrency } from "@/features/accounts/money";
import { getDashboardRepository } from "@/features/dashboard/server-repository";
import { MonthlyTrendChart } from "@/features/dashboard/monthly-trend-chart";
import { monthAfter } from "@/features/dashboard/calculations";
import { getForecastRepository } from "@/features/forecasting/server-repository";
import { localDateString } from "@/lib/dates";

export const dynamic = "force-dynamic";

function transactionLink(parameters: Record<string, string>) {
  return `/transactions?${new URLSearchParams(parameters)}`;
}

function CalculationLabel({ children, calculation, className = "text-sm text-muted-foreground" }: { children: React.ReactNode; calculation: string; className?: string }) {
  return <span className={`flex items-center gap-1.5 ${className}`}><span>{children}</span><InfoTooltip calculation={calculation} /></span>;
}

function MetricCard({ label, value, href, calculation, tone = "default" }: { label: string; value: string; href: string; calculation: string; tone?: "default" | "positive" | "negative" }) {
  return <section className="rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/50">
    <CalculationLabel calculation={calculation}>{label}</CalculationLabel>
    <Link className="group block" href={href}><span className="sr-only">{label}. </span>
      <span className={`mt-2 block text-2xl font-semibold tabular-nums ${tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-red-700" : ""}`}>{value}</span>
      <span className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">View transactions <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
    </Link>
  </section>;
}

export default function DashboardPage() {
  const data = getDashboardRepository().get(localDateString());
  const forecast = getForecastRepository().forecast(data.asOf);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${data.monthStart}T00:00:00.000Z`));
  const monthDates = { from: data.monthStart, to: data.nextMonthStart };
  const monthEnd = new Date(`${data.nextMonthStart}T00:00:00.000Z`);
  monthEnd.setUTCDate(monthEnd.getUTCDate() - 1);
  monthDates.to = monthEnd.toISOString().slice(0, 10);
  const yearDates = { from: data.yearStart, to: data.asOf };
  const categoryYearDates = { from: data.yearStart, to: monthDates.to };
  const categoryMonths = data.monthlyTrend.map(({ month, label }) => ({ month, label }));
  const money = formatCurrency;
  const savingsSinceGoalStartCents = forecast ? forecast.savingsCreditedCents - forecast.goal.startingAmountCents : 0;
  const savingsNeededSinceGoalStartCents = forecast ? Math.max(0, forecast.goal.targetAmountCents - forecast.goal.startingAmountCents) : 0;
  const savingsBeforeVariableSpendingCents = forecast ? forecast.forecastedTargetSavingsCents + forecast.projectedVariableExpensesCents : 0;

  return <section className="mx-auto max-w-6xl space-y-7">
    <div><p className="text-sm font-medium text-primary">Dashboard</p><h1 className="text-3xl font-semibold tracking-tight">Your financial overview</h1><p className="mt-2 text-sm text-muted-foreground">Actual balances and transactions as of {data.asOf}.</p></div>

    {forecast ? <div className={`rounded-xl border-2 bg-card p-6 shadow-sm sm:p-8 ${forecast.safeToSpendMonthCents >= 0 ? "border-emerald-300" : "border-red-300"}`}>
      <CalculationLabel className="text-sm font-medium text-primary" calculation={`${money(forecast.availableCashCents)} available cash\n+ ${money(forecast.monthExpectedIncomeCents + forecast.monthRecurringIncomeCents)} expected income\n− ${money(forecast.monthRecurringExpensesCents)} recurring payments\n− ${money(forecast.monthPlannedExpensesCents)} planned expenses\n− ${money(forecast.monthSavingsAllocationCents)} required savings\n− ${money(forecast.minimumCashBufferCents)} cash buffer\n= ${money(forecast.safeToSpendMonthCents)}`}>Safe to spend for the rest of this month</CalculationLabel>
      <p className={`mt-2 text-4xl font-bold tracking-tight sm:text-5xl ${forecast.safeToSpendMonthCents < 0 ? "text-red-700" : "text-emerald-700"}`}>{formatCurrency(forecast.safeToSpendMonthCents)}</p>
      <div className="mt-5 grid max-w-xl grid-cols-2 gap-4 text-sm sm:grid-cols-3"><div><CalculationLabel calculation={`max(0, ${money(forecast.safeToSpendMonthCents)}) × ${Math.min(7, forecast.daysRemainingInMonth)} ÷ ${forecast.daysRemainingInMonth} days\n= ${money(forecast.safeToSpendWeekCents)} (rounded down)`}>This week</CalculationLabel><p className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(forecast.safeToSpendWeekCents)}</p></div><div><CalculationLabel calculation={`max(0, ${money(forecast.safeToSpendMonthCents)}) ÷ ${forecast.daysRemainingInMonth} days\n= ${money(forecast.safeToSpendDayCents)} (rounded down)`}>Per day</CalculationLabel><p className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(forecast.safeToSpendDayCents)}</p></div><div className="col-span-2 sm:col-span-1"><CalculationLabel calculation={`Calendar days from ${forecast.asOf} through month end, including today.\n= ${forecast.daysRemainingInMonth} days`}>Days remaining</CalculationLabel><p className="mt-1 text-lg font-semibold">{forecast.daysRemainingInMonth}</p></div></div>
      <p className="mt-5 max-w-2xl text-sm text-muted-foreground">{forecast.safeToSpendMonthCents < 0 ? "The negative result is intentional: current assumptions require more cash, less planned spending, or a lower savings allocation." : "This is the maximum remaining variable spending under the current expected assumptions."}</p>
    </div> : <div className="rounded-xl border-2 border-primary/20 bg-card p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium text-primary">Safe to spend this month</p><p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Goal required</p><p className="mt-4 max-w-xl text-sm text-muted-foreground">Create an annual savings goal and minimum cash buffer before safe-to-spend can be calculated.</p><Button asChild className="mt-5"><Link href="/forecast">Configure forecast</Link></Button>
    </div>}

    {forecast && <div className="grid gap-4 sm:grid-cols-3">
      <section className="rounded-xl border bg-card p-5 shadow-sm"><CalculationLabel calculation={`${money(forecast.goal.startingAmountCents)} saved at goal start\n+ ${money(forecast.actualSavingsCents)} actual income minus expenses\n+ ${money(forecast.investmentContributionsCents)} qualifying investment transfers\n= ${money(forecast.savingsCreditedCents)}`}>Savings credited</CalculationLabel><p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(forecast.savingsCreditedCents)}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, forecast.savingsCreditedCents * 100 / forecast.goal.targetAmountCents))}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">Target {formatCurrency(forecast.goal.targetAmountCents)} by {forecast.goal.targetDate}</p><CalculationLabel className="mt-1 text-xs text-muted-foreground" calculation={`${money(forecast.savingsCreditedCents)} savings credited\n− ${money(forecast.goal.startingAmountCents)} already saved at start\n= ${money(savingsSinceGoalStartCents)} saved since start`}>Saved since start: <span className="tabular-nums">{formatCurrency(savingsSinceGoalStartCents)}</span> of <span className="tabular-nums">{formatCurrency(savingsNeededSinceGoalStartCents)}</span></CalculationLabel></section>
      <section className="rounded-xl border bg-card p-5 shadow-sm"><CalculationLabel calculation={`${money(forecast.savingsCreditedCents)} savings credited\n+ ${money(forecast.expectedRemainingIncomeCents)} expected income\n+ ${money(forecast.expectedRemainingRecurringIncomeCents)} recurring income\n− ${money(forecast.expectedRemainingRecurringExpensesCents)} recurring expenses\n− ${money(forecast.plannedRemainingExpensesCents)} planned expenses\n− ${money(forecast.projectedVariableExpensesCents)} projected variable expenses\n= ${money(forecast.forecastedTargetSavingsCents)}`}>Forecasted target-date savings</CalculationLabel><p className={`mt-2 text-2xl font-semibold tabular-nums ${forecast.onTrack ? "text-emerald-700" : "text-red-700"}`}>{formatCurrency(forecast.forecastedTargetSavingsCents)}</p><div className="mt-3 border-t pt-3"><CalculationLabel className="text-xs text-muted-foreground" calculation={`${money(forecast.forecastedTargetSavingsCents)} forecasted savings\n+ ${money(forecast.projectedVariableExpensesCents)} projected variable expenses\n= ${money(savingsBeforeVariableSpendingCents)}`}>Savings before variable spending</CalculationLabel><p className="mt-1 text-sm font-semibold tabular-nums">{formatCurrency(savingsBeforeVariableSpendingCents)}</p></div>{forecast.onTrack ? <p className="mt-3 text-xs text-muted-foreground">Expected scenario is on track.</p> : <CalculationLabel className="mt-3 text-xs text-muted-foreground" calculation={`${money(forecast.goal.targetAmountCents)} target − ${money(forecast.forecastedTargetSavingsCents)} forecast\n= ${money(forecast.goal.targetAmountCents - forecast.forecastedTargetSavingsCents)} shortfall`}>Expected scenario is {formatCurrency(forecast.goal.targetAmountCents - forecast.forecastedTargetSavingsCents)} below target.</CalculationLabel>}</section>
      <section className="rounded-xl border bg-card p-5 shadow-sm"><CalculationLabel calculation={`${money(forecast.remainingSavingsRequirementCents)} remaining target ÷ ${forecast.remainingGoalMonths} remaining goal months\n= ${money(forecast.requiredMonthlySavingsCents)} (rounded up)`}>Required average savings</CalculationLabel><p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(forecast.requiredMonthlySavingsCents)}</p><p className="mt-3 text-xs text-muted-foreground">Per remaining goal month · {formatCurrency(forecast.remainingSavingsRequirementCents)} still required</p></section>
    </div>}

    {forecast && !forecast.onTrack && <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-950"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>The expected forecast is off track for “{forecast.goal.name}”. <Link className="font-medium underline" href="/forecast">Review assumptions</Link>.</p></div>}

    {forecast && <details className="rounded-xl border bg-card p-5 shadow-sm"><summary className="cursor-pointer font-semibold">How safe-to-spend was calculated</summary><div className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
      <p className="flex justify-between gap-4"><span>Available cash</span><span className="tabular-nums">{formatCurrency(forecast.availableCashCents)}</span></p>
      <p className="flex justify-between gap-4"><span>Expected income before month end</span><span className="tabular-nums">{formatCurrency(forecast.monthExpectedIncomeCents + forecast.monthRecurringIncomeCents)}</span></p>
      <p className="flex justify-between gap-4"><span>Recurring payments before month end</span><span className="tabular-nums">−{formatCurrency(forecast.monthRecurringExpensesCents)}</span></p>
      <p className="flex justify-between gap-4"><span>Planned expenses before month end</span><span className="tabular-nums">−{formatCurrency(forecast.monthPlannedExpensesCents)}</span></p>
      <p className="flex justify-between gap-4"><span>Required savings allocation</span><span className="tabular-nums">−{formatCurrency(forecast.monthSavingsAllocationCents)}</span></p>
      <p className="flex justify-between gap-4"><span>Minimum cash buffer</span><span className="tabular-nums">−{formatCurrency(forecast.minimumCashBufferCents)}</span></p>
    </div><div className="mt-5 border-t pt-4 text-sm text-muted-foreground"><p>Target forecast also subtracts {formatCurrency(forecast.plannedRemainingExpensesCents)} planned expenses, {formatCurrency(forecast.expectedRemainingRecurringExpensesCents)} recurring expenses, and {formatCurrency(forecast.projectedVariableExpensesCents)} projected variable spending based on a {formatCurrency(forecast.historicalMonthlyBaselineCents)} three-month baseline.</p><Link className="mt-3 inline-block font-medium text-primary underline" href="/forecast">Edit assumptions</Link></div></details>}

    {forecast && <section className="rounded-xl border bg-card p-5 shadow-sm"><h2 className="text-lg font-semibold">Upcoming recurring expenses</h2>{forecast.upcomingRecurringExpenses.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{forecast.upcomingRecurringExpenses.map((item) => <div className="rounded-md bg-muted p-3 text-sm" key={`${item.itemId}-${item.date}`}><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.date}</p><p className="mt-2 font-semibold tabular-nums">{formatCurrency(Math.abs(item.amountCents))}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No recurring expenses remain this month.</p>}</section>}

    {data.activeAccountCount === 0 && <div className="rounded-xl border border-dashed bg-card p-8 text-center">
      <Landmark className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">Add an account to start your dashboard</h2><p className="mt-2 text-sm text-muted-foreground">Available cash comes from active accounts included in available cash.</p><Button asChild className="mt-5"><Link href="/accounts/new"><Plus className="mr-2 h-4 w-4" />Add account</Link></Button>
    </div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <section className="rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/50"><CalculationLabel calculation={`Sum of current balances for ${data.includedAccountCount} active account${data.includedAccountCount === 1 ? "" : "s"} included in available cash.\n= ${money(data.availableCashCents)}`}>Available cash</CalculationLabel><Link className="block" href="/accounts"><span className="sr-only">Available cash. </span><span className="mt-2 block text-2xl font-semibold tabular-nums">{formatCurrency(data.availableCashCents)}</span><span className="mt-3 block text-xs text-muted-foreground">{data.includedAccountCount} included account{data.includedAccountCount === 1 ? "" : "s"}</span></Link></section>
        <MetricCard calculation={`Sum of active income transactions dated ${monthDates.from} through ${monthDates.to}.\n= ${money(data.currentMonthTotals.incomeCents)}`} href={transactionLink({ ...monthDates, type: "income" })} label={`${monthLabel} income`} tone="positive" value={formatCurrency(data.currentMonthTotals.incomeCents)} />
        <MetricCard calculation={`Expenses minus refunds dated ${monthDates.from} through ${monthDates.to}. Transfers are excluded.\n= ${money(data.currentMonthTotals.expenseCents)}`} href={transactionLink({ ...monthDates, type: "spending" })} label={`${monthLabel} expenses`} value={formatCurrency(data.currentMonthTotals.expenseCents)} />
        <MetricCard calculation={`${money(data.currentMonthTotals.incomeCents)} income − ${money(data.currentMonthTotals.expenseCents)} net expenses\n= ${money(data.currentMonthTotals.savingsCents)}`} href={transactionLink({ ...monthDates, type: "actual" })} label={`${monthLabel} savings`} tone={data.currentMonthTotals.savingsCents >= 0 ? "positive" : "negative"} value={formatCurrency(data.currentMonthTotals.savingsCents)} />
        <MetricCard calculation={`Income − net expenses from ${data.yearStart} through ${data.asOf}. Transfers are excluded.\n= ${money(data.yearToDateSavingsCents)}`} href={transactionLink({ ...yearDates, type: "actual" })} label="Year-to-date savings" tone={data.yearToDateSavingsCents >= 0 ? "positive" : "negative"} value={formatCurrency(data.yearToDateSavingsCents)} />
      </div>

      {data.activeAccountCount > 0 && data.includedAccountCount === 0 && <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>No active account is included in available cash, so the available-cash total is zero. <Link className="font-medium underline" href="/accounts">Review accounts</Link>.</p></div>}
      {data.transactionCount === 0 ? <div className="rounded-xl border border-dashed bg-card p-8 text-center"><h2 className="font-semibold">No transactions yet</h2><p className="mt-2 text-sm text-muted-foreground">Add a transaction or import a CSV to populate monthly actuals and category spending.</p><div className="mt-5 flex justify-center gap-3"><Button asChild><Link href="/transactions/new">Add transaction</Link></Button><Button asChild variant="outline"><Link href="/imports">Import CSV</Link></Button></div></div> : <>
        {data.currentMonthTransactionCount === 0 && <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">Transactions exist, but none are dated in {monthLabel}. The monthly cards and category breakdown therefore show zero or no data.</div>}
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6"><div className="mb-5"><CalculationLabel className="text-xl font-semibold" calculation="For each calendar month: savings = income − net expenses. Transfers and deleted transactions are excluded.">Monthly trend</CalculationLabel><p className="mt-1 text-sm text-muted-foreground">Income, expenses, and savings from January through {monthLabel}.</p></div><MonthlyTrendChart data={data.monthlyTrend} /></section>
          <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6"><div><h2><CalculationLabel className="text-xl font-semibold" calculation="Each category is the sum of expense amounts minus refunds. Transaction splits replace the parent category amount.">Category spending for {data.asOf.slice(0, 4)}</CalculationLabel></h2><p className="mt-1 text-sm text-muted-foreground">Net expenses after refunds, with totals and each month from January through {monthLabel}.</p></div>
            {data.categorySpending.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-max text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="sticky left-0 bg-card py-3 pr-6 font-medium">Category</th><th className="px-3 py-3 text-right font-medium">Year total</th>{categoryMonths.map(({ month, label }) => <th className="px-3 py-3 text-right font-medium" key={month}><span className="sr-only">{data.asOf.slice(0, 4)} </span>{label}</th>)}</tr></thead><tbody>{data.categorySpending.map((category) => {
              const categoryId = category.categoryId ?? "uncategorized";
              const yearHref = transactionLink({ ...categoryYearDates, type: "spending", category: categoryId });
              return <tr className="border-b last:border-0" key={categoryId}><th className="sticky left-0 bg-card py-3 pr-6 text-left font-medium"><Link className="hover:text-primary" href={yearHref}>{category.categoryName}</Link></th><td className="px-3 py-3 text-right font-semibold"><Link className={`tabular-nums hover:text-primary ${category.spendingCents < 0 ? "text-emerald-700" : ""}`} href={yearHref}>{formatCurrency(category.spendingCents)}</Link></td>{categoryMonths.map(({ month }) => {
                const spendingCents = category.monthlySpending[month] ?? 0;
                const to = new Date(`${monthAfter(month)}-01T00:00:00.000Z`); to.setUTCDate(to.getUTCDate() - 1);
                const href = transactionLink({ from: `${month}-01`, to: to.toISOString().slice(0, 10), type: "spending", category: categoryId });
                return <td className="px-3 py-3 text-right" key={month}>{spendingCents === 0 ? <span className="tabular-nums text-muted-foreground">—</span> : <Link aria-label={`${category.categoryName} spending in ${month}`} className={`tabular-nums hover:text-primary ${spendingCents < 0 ? "text-emerald-700" : ""}`} href={href}>{formatCurrency(spendingCents)}</Link>}</td>;
              })}</tr>;
            })}</tbody></table></div> : <div className="mt-5 rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">No expenses or refunds from January through {monthLabel}.</div>}
          </section>
        </div>
        {data.uncategorizedSpendingCents !== 0 && <div className="flex flex-col items-start justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center"><CalculationLabel className="text-sm" calculation={`Uncategorized expenses minus uncategorized refunds in ${monthLabel}.\n= ${money(data.uncategorizedSpendingCents)}`}>{formatCurrency(data.uncategorizedSpendingCents)} of this month’s net spending is uncategorized.</CalculationLabel><Button asChild size="sm" variant="outline"><Link href={transactionLink({ ...monthDates, type: "spending", category: "uncategorized" })}>Review transactions</Link></Button></div>}
      </>}
  </section>;
}
