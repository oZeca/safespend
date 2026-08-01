import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/db/connection";
import { runMigrations } from "@/db/migrate";
import { createAccountRepository } from "@/features/accounts/repository";
import { createTransactionRepository, type TransactionWrite } from "@/features/transactions/repository";
import { calculateForecast, expandRecurringItems } from "./engine";
import type { SavingsGoal } from "./model";
import { createForecastRepository } from "./repository";
import { goalInputSchema, recurringInputSchema } from "./validation";

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

const goal: SavingsGoal = {
  id: "goal-1", name: "Annual savings", startDate: "2026-01-01", targetDate: "2026-12-31",
  targetAmountCents: 1200000, startingAmountCents: 0, includeInvestmentTransfers: false,
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z"
};

function engineInput(availableCashCents: number) {
  return {
    asOf: "2026-07-23", goal, minimumCashBufferCents: 100000, availableCashCents,
    actualSavingsCents: 0, investmentContributionsCents: 0, historicalMonthlyBaselineCents: 0, includeProjectedVariableExpenses: true,
    incomeExpectations: [{ id: "income-1", name: "Bonus", expectedDate: "2026-07-25", amountCents: 100000 }],
    plannedExpenses: [{ id: "expense-1", name: "Repair", expectedDate: "2026-07-26", amountCents: 50000 }],
    recurringItems: [{ id: "recurring-1", name: "Rent", transactionType: "expense" as const, expectedAmountCents: -50000, frequency: "monthly" as const, nextExpectedDate: "2026-07-28", endDate: null }]
  };
}

describe("forecast engine", () => {
  it("returns positive, zero, and negative safe-to-spend outcomes without hiding negatives", () => {
    const positive = calculateForecast(engineInput(500000));
    expect(positive).toMatchObject({
      remainingSavingsRequirementCents: 1200000,
      remainingGoalMonths: 6,
      requiredMonthlySavingsCents: 200000,
      safeToSpendMonthCents: 200000,
      safeToSpendWeekCents: 155555,
      safeToSpendDayCents: 22222,
      daysRemainingInMonth: 9
    });
    expect(calculateForecast(engineInput(300000)).safeToSpendMonthCents).toBe(0);
    expect(calculateForecast(engineInput(200000))).toMatchObject({ safeToSpendMonthCents: -100000, safeToSpendWeekCents: 0, safeToSpendDayCents: 0 });
  });

  it("expands recurrence deterministically and preserves an end-of-month anchor", () => {
    expect(expandRecurringItems([{
      id: "month-end", name: "Month end", transactionType: "expense", expectedAmountCents: -1000,
      frequency: "monthly", nextExpectedDate: "2026-01-31", endDate: "2026-04-30"
    }], "2026-01-01", "2026-12-31").map((item) => item.date)).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
  });

  it("consistently applies or excludes projected variable expenses", () => {
    const included = calculateForecast({ ...engineInput(500000), historicalMonthlyBaselineCents: 30000 });
    const excluded = calculateForecast({ ...engineInput(500000), historicalMonthlyBaselineCents: 30000, includeProjectedVariableExpenses: false });
    expect(included.appliedProjectedVariableExpensesCents).toBe(included.projectedVariableExpensesCents);
    expect(excluded).toMatchObject({ includeProjectedVariableExpenses: false, appliedProjectedVariableExpensesCents: 0 });
    expect(excluded.forecastedTargetSavingsCents).toBe(included.forecastedTargetSavingsCents + included.projectedVariableExpensesCents);
  });
});

describe("forecast repository and validation", () => {
  it("persists assumptions and credits actual savings and optional investment transfers", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "safespend-forecast-")); directories.push(directory);
    const database = openDatabase(path.join(directory, "test.db")); runMigrations(database);
    try {
      let accountId = 0;
      const accounts = createAccountRepository(database, { id: () => `forecast-account-${++accountId}`, now: () => new Date("2026-07-23T09:00:00.000Z") });
      const current = accounts.create({ name: "Current", institution: null, accountType: "current", currency: "EUR", currentBalanceCents: 500000, includedInAvailableCash: true, includedInNetWorth: true });
      const investment = accounts.create({ name: "Investment", institution: null, accountType: "investment", currency: "EUR", currentBalanceCents: 0, includedInAvailableCash: false, includedInNetWorth: true });
      let transactionId = 0;
      const transactions = createTransactionRepository(database, { id: () => `forecast-transaction-${++transactionId}`, now: () => new Date("2026-07-23T10:00:00.000Z") });
      const write = (accountIdValue: string, date: string, amountCents: number, transactionType: TransactionWrite["transactionType"]): TransactionWrite =>
        ({ accountId: accountIdValue, date, description: `${date} ${transactionType}`, merchant: null, amountCents, transactionType, categoryId: null, notes: null });
      transactions.create(write(current.id, "2026-07-05", 100000, "income"));
      transactions.create(write(current.id, "2026-07-06", -40000, "expense"));
      transactions.create(write(investment.id, "2026-07-07", 20000, "transfer"));
      transactions.create(write(current.id, "2026-04-10", -30000, "expense"));
      const exceptional = transactions.create(write(current.id, "2026-05-10", -30000, "expense"));
      transactions.update(exceptional.id, { ...write(current.id, "2026-05-10", -30000, "expense"), isExceptional: true });
      transactions.create(write(current.id, "2026-06-10", -30000, "expense"));
      let id = 0;
      const repository = createForecastRepository(database, { id: () => `forecast-${++id}`, now: () => new Date("2026-07-23T11:00:00.000Z") });
      repository.saveGoal({ name: "2026 goal", startDate: "2026-01-01", targetDate: "2026-12-31", targetAmountCents: 1000000, startingAmountCents: 10000, includeInvestmentTransfers: true, minimumCashBufferCents: 150000 });
      const income = repository.createIncome({ name: "Bonus", expectedDate: "2026-08-01", amountCents: 50000 });
      const plannedExpense = repository.createPlannedExpense({ name: "Holiday", expectedDate: "2026-09-01", amountCents: 25000 });
      const recurring = repository.createRecurring({ name: "Rent", transactionType: "expense", expectedAmountCents: -50000, frequency: "monthly", nextExpectedDate: "2026-07-28", endDate: null });
      expect(repository.getConfiguration()).toMatchObject({ minimumCashBufferCents: 150000, includeProjectedVariableExpenses: true, incomeExpectations: [{ name: "Bonus" }], plannedExpenses: [{ name: "Holiday" }], recurringItems: [{ name: "Rent" }] });
      repository.setIncludeProjectedVariableExpenses(false);
      expect(repository.getConfiguration().includeProjectedVariableExpenses).toBe(false);
      expect(repository.forecast("2026-07-23")).toMatchObject({ includeProjectedVariableExpenses: false, appliedProjectedVariableExpensesCents: 0 });
      expect(repository.updateRecurring(recurring.id, { name: "Salary", transactionType: "income", expectedAmountCents: 250000, frequency: "weekly", nextExpectedDate: "2026-08-01", endDate: "2026-10-01" })).toMatchObject({ name: "Salary", transactionType: "income", expectedAmountCents: 250000, frequency: "weekly", nextExpectedDate: "2026-08-01", endDate: "2026-10-01" });
      expect(repository.findRecurringById(recurring.id)).toMatchObject({ name: "Salary" });
      expect(repository.updateIncome(income.id, { name: "Updated bonus", expectedDate: "2026-08-02", amountCents: 75000 })).toMatchObject({ name: "Updated bonus", expectedDate: "2026-08-02", amountCents: 75000 });
      expect(repository.findIncomeById(income.id)).toMatchObject({ name: "Updated bonus" });
      expect(repository.updatePlannedExpense(plannedExpense.id, { name: "Updated holiday", expectedDate: "2026-09-02", amountCents: 30000 })).toMatchObject({ name: "Updated holiday", expectedDate: "2026-09-02", amountCents: 30000 });
      expect(repository.findPlannedExpenseById(plannedExpense.id)).toMatchObject({ name: "Updated holiday" });
      expect(repository.forecast("2026-07-23")).toMatchObject({
        availableCashCents: 500000,
        actualSavingsCents: -30000,
        investmentContributionsCents: 20000,
        savingsCreditedCents: 0,
        historicalMonthlyBaselineCents: 20000
      });
      expect(repository.monthlyForecast("2026-07-23")).toEqual([
        { month: "2026-08", incomeCents: 1325000, expenseCents: 20000, savingsCents: 1305000 },
        { month: "2026-09", incomeCents: 1000000, expenseCents: 50000, savingsCents: 950000 },
        { month: "2026-10", incomeCents: 0, expenseCents: 20000, savingsCents: -20000 },
        { month: "2026-11", incomeCents: 0, expenseCents: 20000, savingsCents: -20000 },
        { month: "2026-12", incomeCents: 0, expenseCents: 20000, savingsCents: -20000 }
      ]);
      repository.saveGoal({ name: "Updated goal", startDate: "2026-01-01", targetDate: "2026-12-31", targetAmountCents: 900000, startingAmountCents: 10000, includeInvestmentTransfers: false, minimumCashBufferCents: 100000 });
      expect((database.prepare("SELECT COUNT(*) FROM savings_goals WHERE is_active = 1").pluck().get() as number)).toBe(1);
      expect(repository.forecast("2026-07-23")?.investmentContributionsCents).toBe(0);
    } finally { database.close(); }
  });

  it("validates annual goal dates, money, and recurring ranges", () => {
    const validGoal = { name: "Goal", startDate: "2026-01-01", targetDate: "2026-12-31", targetAmount: "1000.00", startingAmount: "0.00", minimumCashBuffer: "100.00", includeInvestmentTransfers: false };
    expect(goalInputSchema.safeParse(validGoal).success).toBe(true);
    expect(goalInputSchema.safeParse({ ...validGoal, targetDate: "2027-01-01" }).success).toBe(false);
    expect(goalInputSchema.safeParse({ ...validGoal, targetAmount: "0.00" }).success).toBe(false);
    expect(recurringInputSchema.safeParse({ name: "Rent", transactionType: "expense", amount: "100.00", frequency: "monthly", nextExpectedDate: "2026-08-01", endDate: "2026-07-31" }).success).toBe(false);
  });
});
