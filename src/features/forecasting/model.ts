export type RecurrenceFrequency = "weekly" | "monthly" | "quarterly" | "yearly";
export type ForecastTransactionType = "income" | "expense";

export interface SavingsGoal {
  id: string;
  name: string;
  startDate: string;
  targetDate: string;
  targetAmountCents: number;
  startingAmountCents: number;
  includeInvestmentTransfers: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeExpectation {
  id: string;
  name: string;
  expectedDate: string;
  amountCents: number;
}

export interface PlannedExpense {
  id: string;
  name: string;
  expectedDate: string;
  amountCents: number;
}

export interface RecurringItem {
  id: string;
  name: string;
  transactionType: ForecastTransactionType;
  expectedAmountCents: number;
  frequency: RecurrenceFrequency;
  nextExpectedDate: string;
  endDate: string | null;
}

export interface ForecastOccurrence {
  itemId: string;
  name: string;
  date: string;
  transactionType: ForecastTransactionType;
  amountCents: number;
}

export interface GoalWrite {
  name: string;
  startDate: string;
  targetDate: string;
  targetAmountCents: number;
  startingAmountCents: number;
  includeInvestmentTransfers: boolean;
  minimumCashBufferCents: number;
}

export interface ForecastResult {
  asOf: string;
  goal: SavingsGoal;
  minimumCashBufferCents: number;
  availableCashCents: number;
  actualSavingsCents: number;
  investmentContributionsCents: number;
  savingsCreditedCents: number;
  remainingSavingsRequirementCents: number;
  remainingGoalMonths: number;
  requiredMonthlySavingsCents: number;
  expectedRemainingIncomeCents: number;
  expectedRemainingRecurringIncomeCents: number;
  expectedRemainingRecurringExpensesCents: number;
  plannedRemainingExpensesCents: number;
  historicalMonthlyBaselineCents: number;
  projectedVariableExpensesCents: number;
  appliedProjectedVariableExpensesCents: number;
  includeProjectedVariableExpenses: boolean;
  forecastedTargetSavingsCents: number;
  safeToSpendMonthCents: number;
  safeToSpendWeekCents: number;
  safeToSpendDayCents: number;
  daysRemainingInMonth: number;
  monthExpectedIncomeCents: number;
  monthRecurringIncomeCents: number;
  monthRecurringExpensesCents: number;
  monthPlannedExpensesCents: number;
  monthSavingsAllocationCents: number;
  onTrack: boolean;
  upcomingRecurringExpenses: ForecastOccurrence[];
}

export interface ForecastConfiguration {
  goal: SavingsGoal | null;
  minimumCashBufferCents: number;
  includeProjectedVariableExpenses: boolean;
  incomeExpectations: IncomeExpectation[];
  plannedExpenses: PlannedExpense[];
  recurringItems: RecurringItem[];
}
