import { AlertTriangle, ArrowRight, Landmark, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/features/accounts/money";
import { getDashboardRepository } from "@/features/dashboard/server-repository";
import { MonthlyTrendChart } from "@/features/dashboard/monthly-trend-chart";
import { getForecastRepository } from "@/features/forecasting/server-repository";
import { localDateString } from "@/lib/dates";

export const dynamic = "force-dynamic";

function transactionLink(parameters: Record<string, string>) {
  return `/transactions?${new URLSearchParams(parameters)}`;
}

function MetricCard({ label, value, href, tone = "default" }: { label: string; value: string; href: string; tone?: "default" | "positive" | "negative" }) {
  return <Link className="group rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/50" href={href}>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className={`mt-2 text-2xl font-semibold tabular-nums ${tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-red-700" : ""}`}>{value}</p>
    <p className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">View transactions <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></p>
  </Link>;
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
  const largestCategory = Math.max(1, ...data.categorySpending.map((category) => Math.max(0, category.spendingCents)));

  return <section className="mx-auto max-w-6xl space-y-7">
    <div><p className="text-sm font-medium text-primary">Dashboard</p><h1 className="text-3xl font-semibold tracking-tight">Your financial overview</h1><p className="mt-2 text-sm text-muted-foreground">Actual balances and transactions as of {data.asOf}.</p></div>

    {forecast ? <div className={`rounded-xl border-2 bg-card p-6 shadow-sm sm:p-8 ${forecast.safeToSpendMonthCents >= 0 ? "border-emerald-300" : "border-red-300"}`}>
      <p className="text-sm font-medium text-primary">Safe to spend for the rest of this month</p>
      <p className={`mt-2 text-4xl font-bold tracking-tight sm:text-5xl ${forecast.safeToSpendMonthCents < 0 ? "text-red-700" : "text-emerald-700"}`}>{formatCurrency(forecast.safeToSpendMonthCents)}</p>
      <div className="mt-5 grid max-w-xl grid-cols-2 gap-4 text-sm sm:grid-cols-3"><div><p className="text-muted-foreground">This week</p><p className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(forecast.safeToSpendWeekCents)}</p></div><div><p className="text-muted-foreground">Per day</p><p className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(forecast.safeToSpendDayCents)}</p></div><div className="col-span-2 sm:col-span-1"><p className="text-muted-foreground">Days remaining</p><p className="mt-1 text-lg font-semibold">{forecast.daysRemainingInMonth}</p></div></div>
      <p className="mt-5 max-w-2xl text-sm text-muted-foreground">{forecast.safeToSpendMonthCents < 0 ? "The negative result is intentional: current assumptions require more cash, less planned spending, or a lower savings allocation." : "This is the maximum remaining variable spending under the current expected assumptions."}</p>
    </div> : <div className="rounded-xl border-2 border-primary/20 bg-card p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium text-primary">Safe to spend this month</p><p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Goal required</p><p className="mt-4 max-w-xl text-sm text-muted-foreground">Create an annual savings goal and minimum cash buffer before safe-to-spend can be calculated.</p><Button asChild className="mt-5"><Link href="/forecast">Configure forecast</Link></Button>
    </div>}

    {forecast && <div className="grid gap-4 sm:grid-cols-3">
      <section className="rounded-xl border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">Savings credited</p><p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(forecast.savingsCreditedCents)}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, forecast.savingsCreditedCents * 100 / forecast.goal.targetAmountCents))}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">Target {formatCurrency(forecast.goal.targetAmountCents)} by {forecast.goal.targetDate}</p></section>
      <section className="rounded-xl border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">Forecasted target-date savings</p><p className={`mt-2 text-2xl font-semibold tabular-nums ${forecast.onTrack ? "text-emerald-700" : "text-red-700"}`}>{formatCurrency(forecast.forecastedTargetSavingsCents)}</p><p className="mt-3 text-xs text-muted-foreground">{forecast.onTrack ? "Expected scenario is on track." : `Expected scenario is ${formatCurrency(forecast.goal.targetAmountCents - forecast.forecastedTargetSavingsCents)} below target.`}</p></section>
      <section className="rounded-xl border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">Required average savings</p><p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(forecast.requiredMonthlySavingsCents)}</p><p className="mt-3 text-xs text-muted-foreground">Per remaining goal month · {formatCurrency(forecast.remainingSavingsRequirementCents)} still required</p></section>
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
        <Link className="rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/50" href="/accounts"><p className="text-sm text-muted-foreground">Available cash</p><p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(data.availableCashCents)}</p><p className="mt-3 text-xs text-muted-foreground">{data.includedAccountCount} included account{data.includedAccountCount === 1 ? "" : "s"}</p></Link>
        <MetricCard href={transactionLink({ ...monthDates, type: "income" })} label={`${monthLabel} income`} tone="positive" value={formatCurrency(data.currentMonthTotals.incomeCents)} />
        <MetricCard href={transactionLink({ ...monthDates, type: "spending" })} label={`${monthLabel} expenses`} value={formatCurrency(data.currentMonthTotals.expenseCents)} />
        <MetricCard href={transactionLink({ ...monthDates, type: "actual" })} label={`${monthLabel} savings`} tone={data.currentMonthTotals.savingsCents >= 0 ? "positive" : "negative"} value={formatCurrency(data.currentMonthTotals.savingsCents)} />
        <MetricCard href={transactionLink({ ...yearDates, type: "actual" })} label="Year-to-date savings" tone={data.yearToDateSavingsCents >= 0 ? "positive" : "negative"} value={formatCurrency(data.yearToDateSavingsCents)} />
      </div>

      {data.activeAccountCount > 0 && data.includedAccountCount === 0 && <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>No active account is included in available cash, so the available-cash total is zero. <Link className="font-medium underline" href="/accounts">Review accounts</Link>.</p></div>}
      {data.transactionCount === 0 ? <div className="rounded-xl border border-dashed bg-card p-8 text-center"><h2 className="font-semibold">No transactions yet</h2><p className="mt-2 text-sm text-muted-foreground">Add a transaction or import a CSV to populate monthly actuals and category spending.</p><div className="mt-5 flex justify-center gap-3"><Button asChild><Link href="/transactions/new">Add transaction</Link></Button><Button asChild variant="outline"><Link href="/imports">Import CSV</Link></Button></div></div> : <>
        {data.currentMonthTransactionCount === 0 && <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">Transactions exist, but none are dated in {monthLabel}. The monthly cards and category breakdown therefore show zero or no data.</div>}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
          <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6"><div className="mb-5"><h2 className="text-xl font-semibold">Monthly trend</h2><p className="mt-1 text-sm text-muted-foreground">Income, expenses, and savings from January through {monthLabel}.</p></div><MonthlyTrendChart data={data.monthlyTrend} /></section>
          <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6"><div><h2 className="text-xl font-semibold">Category spending</h2><p className="mt-1 text-sm text-muted-foreground">Net expenses after refunds in {monthLabel}.</p></div>
            {data.categorySpending.length ? <div className="mt-5 space-y-4">{data.categorySpending.map((category) => <Link className="group block" href={transactionLink({ ...monthDates, type: "spending", category: category.categoryId ?? "uncategorized" })} key={category.categoryId ?? "uncategorized"}>
              <div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium group-hover:text-primary">{category.categoryName}</span><span className={`tabular-nums ${category.spendingCents < 0 ? "text-emerald-700" : ""}`}>{formatCurrency(category.spendingCents)}</span></div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, category.spendingCents) * 100 / largestCategory}%` }} /></div>
            </Link>)}</div> : <div className="mt-5 rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">No categorized expenses or refunds this month.</div>}
          </section>
        </div>
        {data.uncategorizedSpendingCents !== 0 && <div className="flex flex-col items-start justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center"><span>{formatCurrency(data.uncategorizedSpendingCents)} of this month’s net spending is uncategorized.</span><Button asChild size="sm" variant="outline"><Link href={transactionLink({ ...monthDates, type: "spending", category: "uncategorized" })}>Review transactions</Link></Button></div>}
      </>}
  </section>;
}
