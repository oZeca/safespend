import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/features/accounts/money";
import { createIncomeAction, createPlannedExpenseAction, createRecurringAction, deleteAssumptionAction, saveGoalAction } from "@/features/forecasting/actions";
import { GoalForm, IncomeForm, PlannedExpenseForm, RecurringForm } from "@/features/forecasting/forecast-forms";
import { getForecastRepository } from "@/features/forecasting/server-repository";
import { localDateString } from "@/lib/dates";

export const dynamic = "force-dynamic";
const statuses: Record<string, string> = {
  "goal-saved": "Savings goal and cash buffer saved.",
  "income-added": "Expected income added.",
  "expense-added": "Planned expense added.",
  "recurring-added": "Recurring item added.",
  "recurring-updated": "Recurring item updated.",
  "assumption-deleted": "Forecast assumption removed."
};

function DeleteForm({ id, kind }: { id: string; kind: "income" | "expense" | "recurring" }) {
  return <form action={deleteAssumptionAction}><input name="id" type="hidden" value={id} /><input name="kind" type="hidden" value={kind} /><Button aria-label="Remove assumption" size="sm" type="submit" variant="outline"><Trash2 className="h-4 w-4" /></Button></form>;
}

export default async function ForecastPage({ searchParams }: { searchParams: Promise<{ status?: string; frequency?: string }> }) {
  const { status, frequency: frequencyParam } = await searchParams;
  const repository = getForecastRepository();
  const configuration = repository.getConfiguration();
  const frequency = frequencyParam === "monthly" || frequencyParam === "yearly" ? frequencyParam : "all";
  const recurringItems = frequency === "all" ? configuration.recurringItems : configuration.recurringItems.filter((item) => item.frequency === frequency);
  const today = localDateString();
  const tomorrowDate = new Date(`${today}T00:00:00.000Z`); tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  const defaultStart = `${today.slice(0, 4)}-01-01`;
  const defaultTarget = `${today.slice(0, 4)}-12-31`;
  const forecast = repository.forecast(today);
  return <section className="mx-auto max-w-5xl space-y-7">
    <div><p className="text-sm font-medium text-primary">Forecast</p><h1 className="text-3xl font-semibold tracking-tight">Savings goal and assumptions</h1><p className="mt-2 text-sm text-muted-foreground">Define the expected scenario behind safe-to-spend. All values remain editable and local.</p></div>
    {status && statuses[status] && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{statuses[status]}</div>}

    <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-7"><div className="mb-5"><h2 className="text-xl font-semibold">Annual savings goal</h2><p className="mt-1 text-sm text-muted-foreground">Only one annual goal is active in the MVP.</p></div><GoalForm action={saveGoalAction} defaultStartDate={defaultStart} defaultTargetDate={defaultTarget} goal={configuration.goal} minimumBufferCents={configuration.minimumCashBufferCents} /></section>

    {forecast && <section className={`rounded-xl border p-5 shadow-sm sm:p-7 ${forecast.safeToSpendMonthCents >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
      <p className="text-sm font-medium">Current expected result</p><p className={`mt-2 text-3xl font-bold tabular-nums ${forecast.safeToSpendMonthCents >= 0 ? "text-emerald-800" : "text-red-800"}`}>{formatCurrency(forecast.safeToSpendMonthCents)} safe this month</p><p className="mt-2 text-sm">Forecasted target-date savings: {formatCurrency(forecast.forecastedTargetSavingsCents)} against {formatCurrency(forecast.goal.targetAmountCents)}.</p>
    </section>}

    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"><div><h2 className="text-lg font-semibold">Expected income</h2><p className="text-sm text-muted-foreground">One-time income not already recorded as a transaction.</p></div><IncomeForm action={createIncomeAction} defaultDate={tomorrow} />
        {configuration.incomeExpectations.length ? <div className="space-y-2">{configuration.incomeExpectations.map((item) => <div className="flex items-center justify-between gap-3 rounded-md bg-muted p-3 text-sm" key={item.id}><span><span className="font-medium">{item.name}</span><span className="block text-xs text-muted-foreground">{item.expectedDate}</span></span><span className="ml-auto font-medium tabular-nums text-emerald-700">{formatCurrency(item.amountCents)}</span><DeleteForm id={item.id} kind="income" /></div>)}</div> : <p className="text-sm text-muted-foreground">No expected income assumptions.</p>}
      </section>
      <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"><div><h2 className="text-lg font-semibold">Planned expenses</h2><p className="text-sm text-muted-foreground">Known one-time commitments not already recorded.</p></div><PlannedExpenseForm action={createPlannedExpenseAction} defaultDate={tomorrow} />
        {configuration.plannedExpenses.length ? <div className="space-y-2">{configuration.plannedExpenses.map((item) => <div className="flex items-center justify-between gap-3 rounded-md bg-muted p-3 text-sm" key={item.id}><span><span className="font-medium">{item.name}</span><span className="block text-xs text-muted-foreground">{item.expectedDate}</span></span><span className="ml-auto font-medium tabular-nums">{formatCurrency(item.amountCents)}</span><DeleteForm id={item.id} kind="expense" /></div>)}</div> : <p className="text-sm text-muted-foreground">No planned expense assumptions.</p>}
      </section>
    </div>

    <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm sm:p-7"><div><h2 className="text-xl font-semibold">Recurring items</h2><p className="mt-1 text-sm text-muted-foreground">Expected fixed income and payments generated from the next date through the optional end date or goal date.</p></div><RecurringForm action={createRecurringAction} defaultDate={tomorrow} />
      <nav aria-label="Filter recurring items by frequency" className="flex flex-wrap gap-2">
        {(["all", "monthly", "yearly"] as const).map((option) => <Button asChild key={option} size="sm" variant={frequency === option ? "default" : "outline"}><Link aria-current={frequency === option ? "page" : undefined} href={option === "all" ? "/forecast" : `/forecast?frequency=${option}`}>{option === "all" ? "All" : option === "monthly" ? "Monthly" : "Yearly"}</Link></Button>)}
      </nav>
      {recurringItems.length ? <div className="grid gap-3 sm:grid-cols-2">{recurringItems.map((item) => <div className="flex items-center gap-3 rounded-md bg-muted p-3 text-sm" key={item.id}><span><span className="font-medium">{item.name}</span><span className="block text-xs capitalize text-muted-foreground">{item.frequency} {item.transactionType} · next {item.nextExpectedDate}{item.endDate ? ` · ends ${item.endDate}` : ""}</span></span><span className={`ml-auto font-medium tabular-nums ${item.transactionType === "income" ? "text-emerald-700" : ""}`}>{formatCurrency(Math.abs(item.expectedAmountCents))}</span><Button asChild aria-label={`Edit ${item.name}`} size="sm" variant="outline"><Link href={`/forecast/recurring/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button><DeleteForm id={item.id} kind="recurring" /></div>)}</div> : <p className="text-sm text-muted-foreground">No {frequency === "all" ? "" : `${frequency} `}recurring assumptions.</p>}
    </section>
  </section>;
}
