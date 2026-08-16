import type { ForecastConfiguration, ForecastOccurrence, ForecastResult, IncomeExpectation, MonthlyAssumptionPoint, MonthlyForecastPoint, PlannedExpense, RecurringItem, SavingsGoal, YearOutlook } from "./model";

interface ForecastEngineInput {
  asOf: string;
  goal: SavingsGoal;
  minimumCashBufferCents: number;
  availableCashCents: number;
  actualSavingsCents: number;
  investmentContributionsCents: number;
  historicalMonthlyBaselineCents: number;
  includeProjectedVariableExpenses: boolean;
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

export function calculateMonthlyAssumptions(asOf: string, throughDate: string, configuration: ForecastConfiguration): MonthlyAssumptionPoint[] {
  const horizon = throughDate < asOf ? asOf : throughDate;
  const occurrences = expandRecurringItems(configuration.recurringItems, asOf, horizon);
  const points: MonthlyAssumptionPoint[] = [];
  let cursor = `${asOf.slice(0, 7)}-01`;
  const lastMonth = horizon.slice(0, 7);
  while (cursor.slice(0, 7) <= lastMonth) {
    const month = cursor.slice(0, 7);
    const monthOccurrences = occurrences.filter((item) => item.date.startsWith(month));
    points.push({
      month,
      label: new Intl.DateTimeFormat("en", { month: "short", year: month.slice(0, 4) === asOf.slice(0, 4) ? undefined : "2-digit", timeZone: "UTC" }).format(utcDate(cursor)),
      expectedIncomeCents: sum(configuration.incomeExpectations.filter((item) => item.expectedDate > asOf && item.expectedDate <= horizon && item.expectedDate.startsWith(month)).map((item) => item.amountCents)),
      recurringIncomeCents: sum(monthOccurrences.filter((item) => item.transactionType === "income").map((item) => item.amountCents)),
      plannedExpenseCents: sum(configuration.plannedExpenses.filter((item) => item.expectedDate > asOf && item.expectedDate <= horizon && item.expectedDate.startsWith(month)).map((item) => item.amountCents)),
      recurringExpenseCents: sum(monthOccurrences.filter((item) => item.transactionType === "expense").map((item) => Math.abs(item.amountCents)))
    });
    cursor = addMonths(cursor, 1);
  }
  return points;
}

export function calculateMonthlyForecast(asOf: string, configuration: ForecastConfiguration, historicalMonthlyBaselineCents: number): MonthlyForecastPoint[] {
  const year = asOf.slice(0, 4);
  const currentMonth = asOf.slice(0, 7);
  const yearEnd = `${year}-12-31`;
  const occurrences = expandRecurringItems(configuration.recurringItems, asOf, yearEnd);
  const points: MonthlyForecastPoint[] = [];
  for (let monthNumber = Number(currentMonth.slice(5, 7)) + 1; monthNumber <= 12; monthNumber += 1) {
    const month = `${year}-${String(monthNumber).padStart(2, "0")}`;
    const incomeCents = sum(configuration.incomeExpectations.filter((item) => item.expectedDate.startsWith(month)).map((item) => item.amountCents))
      + sum(occurrences.filter((item) => item.date.startsWith(month) && item.transactionType === "income").map((item) => item.amountCents));
    const expenseCents = historicalMonthlyBaselineCents
      + sum(configuration.plannedExpenses.filter((item) => item.expectedDate.startsWith(month)).map((item) => item.amountCents))
      + sum(occurrences.filter((item) => item.date.startsWith(month) && item.transactionType === "expense").map((item) => Math.abs(item.amountCents)));
    points.push({ month, incomeCents, expenseCents, savingsCents: incomeCents - expenseCents });
  }
  return points;
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

export function calculateYearOutlook(asOf: string, currentNetWorthCents: number, configuration: ForecastConfiguration, historicalMonthlyBaselineCents: number): YearOutlook {
  const yearEnd = `${asOf.slice(0, 4)}-12-31`;
  const occurrences = expandRecurringItems(configuration.recurringItems, asOf, yearEnd);
  const futureIncomeCents = sum(configuration.incomeExpectations.filter((item) => item.expectedDate > asOf && item.expectedDate <= yearEnd).map((item) => item.amountCents))
    + sum(occurrences.filter((item) => item.transactionType === "income").map((item) => item.amountCents));
  const recurringExpensesCents = sum(occurrences.filter((item) => item.transactionType === "expense").map((item) => Math.abs(item.amountCents)));
  const plannedExpensesCents = sum(configuration.plannedExpenses.filter((item) => item.expectedDate > asOf && item.expectedDate <= yearEnd).map((item) => item.amountCents));
  const variableExpensesCents = configuration.includeProjectedVariableExpenses ? projectedBaseline(historicalMonthlyBaselineCents, asOf, yearEnd) : 0;
  const projectedRemainingSpendingCents = recurringExpensesCents + plannedExpensesCents + variableExpensesCents;
  const projectedNetWorthChangeCents = futureIncomeCents - projectedRemainingSpendingCents;
  const monthlyForecast = calculateMonthlyForecast(asOf, configuration, configuration.includeProjectedVariableExpenses ? historicalMonthlyBaselineCents : 0);
  const currentMonthEnd = dateString(new Date(Date.UTC(Number(asOf.slice(0, 4)), Number(asOf.slice(5, 7)), 0)));
  const currentMonthIncome = sum(configuration.incomeExpectations.filter((item) => item.expectedDate > asOf && item.expectedDate <= currentMonthEnd).map((item) => item.amountCents))
    + sum(occurrences.filter((item) => item.date <= currentMonthEnd && item.transactionType === "income").map((item) => item.amountCents));
  const currentMonthExpenses = sum(configuration.plannedExpenses.filter((item) => item.expectedDate > asOf && item.expectedDate <= currentMonthEnd).map((item) => item.amountCents))
    + sum(occurrences.filter((item) => item.date <= currentMonthEnd && item.transactionType === "expense").map((item) => Math.abs(item.amountCents)))
    + (configuration.includeProjectedVariableExpenses ? projectedBaseline(historicalMonthlyBaselineCents, asOf, currentMonthEnd) : 0);
  const remainingMonthCount = 13 - Number(asOf.slice(5, 7));
  return {
    includeProjectedVariableExpenses: configuration.includeProjectedVariableExpenses,
    currentNetWorthCents,
    projectedYearEndNetWorthCents: currentNetWorthCents + projectedNetWorthChangeCents,
    projectedNetWorthChangeCents,
    projectedRemainingSpendingCents,
    projectedAverageMonthlySpendingCents: remainingMonthCount > 0 ? Math.trunc(projectedRemainingSpendingCents / remainingMonthCount) : 0,
    remainingMonthCount,
    currentMonthRemainingSavingsCents: currentMonthIncome - currentMonthExpenses,
    monthlyForecast
  };
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
  const appliedProjectedVariableExpensesCents = input.includeProjectedVariableExpenses ? projectedVariableExpensesCents : 0;
  const forecastedTargetSavingsCents = savingsCreditedCents + expectedRemainingIncomeCents + expectedRemainingRecurringIncomeCents
    - expectedRemainingRecurringExpensesCents - plannedRemainingExpensesCents - appliedProjectedVariableExpensesCents;

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
    appliedProjectedVariableExpensesCents,
    includeProjectedVariableExpenses: input.includeProjectedVariableExpenses,
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
