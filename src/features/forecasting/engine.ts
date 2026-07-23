import type { ForecastOccurrence, ForecastResult, IncomeExpectation, PlannedExpense, RecurringItem, SavingsGoal } from "./model";

interface ForecastEngineInput {
  asOf: string;
  goal: SavingsGoal;
  minimumCashBufferCents: number;
  availableCashCents: number;
  actualSavingsCents: number;
  investmentContributionsCents: number;
  historicalMonthlyBaselineCents: number;
  incomeExpectations: IncomeExpectation[];
  plannedExpenses: PlannedExpense[];
  recurringItems: RecurringItem[];
}

function utcDate(value: string) { return new Date(`${value}T00:00:00.000Z`); }
function dateString(value: Date) { return value.toISOString().slice(0, 10); }
function daysInMonth(year: number, monthIndex: number) { return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate(); }
function addDays(value: string, days: number) { const date = utcDate(value); date.setUTCDate(date.getUTCDate() + days); return dateString(date); }
function addMonths(value: string, months: number) {
  const date = utcDate(value);
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  target.setUTCDate(Math.min(day, daysInMonth(target.getUTCFullYear(), target.getUTCMonth())));
  return dateString(target);
}
function occurrenceAt(value: string, frequency: RecurringItem["frequency"], index: number) {
  if (frequency === "weekly") return addDays(value, 7 * index);
  if (frequency === "monthly") return addMonths(value, index);
  if (frequency === "quarterly") return addMonths(value, 3 * index);
  return addMonths(value, 12 * index);
}
function sum(items: number[]) { return items.reduce((total, value) => total + value, 0); }
function ceilDivide(value: number, divisor: number) {
  if (value <= 0 || divisor <= 0) return 0;
  return Number((BigInt(value) + BigInt(divisor) - 1n) / BigInt(divisor));
}
function prorate(value: number, numerator: number, denominator: number) {
  if (value <= 0 || numerator <= 0 || denominator <= 0) return 0;
  return Number(BigInt(value) * BigInt(numerator) / BigInt(denominator));
}

export function expandRecurringItems(items: RecurringItem[], afterDate: string, throughDate: string): ForecastOccurrence[] {
  const occurrences: ForecastOccurrence[] = [];
  for (const item of items) {
    let index = 0;
    let date = occurrenceAt(item.nextExpectedDate, item.frequency, index);
    while (date <= afterDate) { index += 1; date = occurrenceAt(item.nextExpectedDate, item.frequency, index); }
    const end = item.endDate && item.endDate < throughDate ? item.endDate : throughDate;
    while (date <= end) {
      occurrences.push({ itemId: item.id, name: item.name, date, transactionType: item.transactionType, amountCents: item.expectedAmountCents });
      index += 1;
      date = occurrenceAt(item.nextExpectedDate, item.frequency, index);
    }
  }
  return occurrences.sort((left, right) => left.date.localeCompare(right.date) || left.name.localeCompare(right.name));
}

function remainingMonths(asOf: string, targetDate: string) {
  if (targetDate < asOf) return 0;
  const [asOfYear, asOfMonth] = asOf.split("-").map(Number);
  const [targetYear, targetMonth] = targetDate.split("-").map(Number);
  return (targetYear - asOfYear) * 12 + targetMonth - asOfMonth + 1;
}

function projectedBaseline(baselineCents: number, asOf: string, targetDate: string) {
  if (targetDate <= asOf || baselineCents <= 0) return 0;
  let cursor = utcDate(addDays(asOf, 1));
  const target = utcDate(targetDate);
  let total = 0;
  while (cursor <= target) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    const lastRelevantDay = year === target.getUTCFullYear() && month === target.getUTCMonth() ? target.getUTCDate() : daysInMonth(year, month);
    const relevantDays = lastRelevantDay - cursor.getUTCDate() + 1;
    total += prorate(baselineCents, relevantDays, daysInMonth(year, month));
    cursor = new Date(Date.UTC(year, month + 1, 1));
  }
  return total;
}

export function calculateForecast(input: ForecastEngineInput): ForecastResult {
  const goalHorizon = input.goal.targetDate < input.asOf ? input.asOf : input.goal.targetDate;
  const occurrences = expandRecurringItems(input.recurringItems, input.asOf, goalHorizon);
  const futureIncome = input.incomeExpectations.filter((item) => item.expectedDate > input.asOf && item.expectedDate <= input.goal.targetDate);
  const futurePlanned = input.plannedExpenses.filter((item) => item.expectedDate > input.asOf && item.expectedDate <= input.goal.targetDate);
  const recurringIncome = occurrences.filter((item) => item.transactionType === "income");
  const recurringExpenses = occurrences.filter((item) => item.transactionType === "expense");
  const savingsCreditedCents = input.goal.startingAmountCents + input.actualSavingsCents + (input.goal.includeInvestmentTransfers ? input.investmentContributionsCents : 0);
  const remainingSavingsRequirementCents = Math.max(0, input.goal.targetAmountCents - savingsCreditedCents);
  const remainingGoalMonths = remainingMonths(input.asOf, input.goal.targetDate);
  const requiredMonthlySavingsCents = ceilDivide(remainingSavingsRequirementCents, remainingGoalMonths);
  const expectedRemainingIncomeCents = sum(futureIncome.map((item) => item.amountCents));
  const expectedRemainingRecurringIncomeCents = sum(recurringIncome.map((item) => item.amountCents));
  const expectedRemainingRecurringExpensesCents = sum(recurringExpenses.map((item) => Math.abs(item.amountCents)));
  const plannedRemainingExpensesCents = sum(futurePlanned.map((item) => item.amountCents));
  const projectedVariableExpensesCents = projectedBaseline(input.historicalMonthlyBaselineCents, input.asOf, input.goal.targetDate);
  const forecastedTargetSavingsCents = savingsCreditedCents + expectedRemainingIncomeCents + expectedRemainingRecurringIncomeCents
    - expectedRemainingRecurringExpensesCents - plannedRemainingExpensesCents - projectedVariableExpensesCents;

  const asOfDate = utcDate(input.asOf);
  const monthEnd = dateString(new Date(Date.UTC(asOfDate.getUTCFullYear(), asOfDate.getUTCMonth() + 1, 0)));
  const safeHorizon = input.goal.targetDate < monthEnd ? input.goal.targetDate : monthEnd;
  const monthIncome = futureIncome.filter((item) => item.expectedDate <= safeHorizon);
  const monthOccurrences = occurrences.filter((item) => item.date <= safeHorizon);
  const monthPlanned = futurePlanned.filter((item) => item.expectedDate <= safeHorizon);
  const monthExpectedIncomeCents = sum(monthIncome.map((item) => item.amountCents));
  const monthRecurringIncomeCents = sum(monthOccurrences.filter((item) => item.transactionType === "income").map((item) => item.amountCents));
  const monthRecurringExpensesCents = sum(monthOccurrences.filter((item) => item.transactionType === "expense").map((item) => Math.abs(item.amountCents)));
  const monthPlannedExpensesCents = sum(monthPlanned.map((item) => item.amountCents));
  const monthSavingsAllocationCents = Math.min(remainingSavingsRequirementCents, requiredMonthlySavingsCents);
  const safeToSpendMonthCents = input.availableCashCents + monthExpectedIncomeCents + monthRecurringIncomeCents - monthRecurringExpensesCents
    - monthPlannedExpensesCents - monthSavingsAllocationCents - input.minimumCashBufferCents;
  const daysRemainingInMonth = Math.max(1, utcDate(monthEnd).getUTCDate() - asOfDate.getUTCDate() + 1);
  const positiveSafe = Math.max(0, safeToSpendMonthCents);
  const safeToSpendDayCents = Math.floor(positiveSafe / daysRemainingInMonth);
  const safeToSpendWeekCents = Math.floor(positiveSafe * Math.min(7, daysRemainingInMonth) / daysRemainingInMonth);
  return {
    asOf: input.asOf,
    goal: input.goal,
    minimumCashBufferCents: input.minimumCashBufferCents,
    availableCashCents: input.availableCashCents,
    actualSavingsCents: input.actualSavingsCents,
    investmentContributionsCents: input.goal.includeInvestmentTransfers ? input.investmentContributionsCents : 0,
    savingsCreditedCents,
    remainingSavingsRequirementCents,
    remainingGoalMonths,
    requiredMonthlySavingsCents,
    expectedRemainingIncomeCents,
    expectedRemainingRecurringIncomeCents,
    expectedRemainingRecurringExpensesCents,
    plannedRemainingExpensesCents,
    historicalMonthlyBaselineCents: input.historicalMonthlyBaselineCents,
    projectedVariableExpensesCents,
    forecastedTargetSavingsCents,
    safeToSpendMonthCents,
    safeToSpendWeekCents,
    safeToSpendDayCents,
    daysRemainingInMonth,
    monthExpectedIncomeCents,
    monthRecurringIncomeCents,
    monthRecurringExpensesCents,
    monthPlannedExpensesCents,
    monthSavingsAllocationCents,
    onTrack: forecastedTargetSavingsCents >= input.goal.targetAmountCents,
    upcomingRecurringExpenses: monthOccurrences.filter((item) => item.transactionType === "expense").slice(0, 5)
  };
}
