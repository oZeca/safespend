import type Database from "better-sqlite3";
import { effectiveBalanceSql } from "@/features/accounts/balance";
import { randomUUID } from "node:crypto";
import { calculateForecast } from "./engine";
import type { ForecastConfiguration, ForecastResult, GoalWrite, IncomeExpectation, PlannedExpense, RecurringItem, SavingsGoal } from "./model";
import { dashboardDateSchema } from "@/features/dashboard/validation";

interface GoalRow {
  id: string; name: string; startDate: string; targetDate: string; targetAmountCents: number; startingAmountCents: number;
  includeInvestmentTransfers: number; createdAt: string; updatedAt: string;
}

export interface IncomeWrite { name: string; expectedDate: string; amountCents: number; }
export interface PlannedExpenseWrite { name: string; expectedDate: string; amountCents: number; }
export interface RecurringWrite {
  name: string; transactionType: "income" | "expense"; expectedAmountCents: number; frequency: RecurringItem["frequency"]; nextExpectedDate: string; endDate: string | null;
}
export interface ForecastRepositoryOptions { now?: () => Date; id?: () => string; }

function mapGoal(row: GoalRow): SavingsGoal {
  return { ...row, includeInvestmentTransfers: Boolean(row.includeInvestmentTransfers) };
}

function previousThreeMonthStart(asOf: string) {
  const date = new Date(`${asOf.slice(0, 7)}-01T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() - 3);
  return date.toISOString().slice(0, 10);
}

export function createForecastRepository(database: Database.Database, options: ForecastRepositoryOptions = {}) {
  const now = options.now ?? (() => new Date());
  const makeId = options.id ?? randomUUID;

  function getGoal(): SavingsGoal | null {
    const row = database.prepare(`SELECT id, name, start_date AS startDate, target_date AS targetDate, target_amount_cents AS targetAmountCents,
      starting_amount_cents AS startingAmountCents, include_investment_transfers AS includeInvestmentTransfers, created_at AS createdAt, updated_at AS updatedAt
      FROM savings_goals WHERE is_active = 1 LIMIT 1`).get() as GoalRow | undefined;
    return row ? mapGoal(row) : null;
  }

  function getMinimumBuffer(): number {
    const raw = database.prepare("SELECT value_json FROM settings WHERE key = 'minimum_cash_buffer_cents'").pluck().get() as string | undefined;
    if (!raw) return 0;
    const value: unknown = JSON.parse(raw);
    return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
  }

  function getIncludeProjectedVariableExpenses(): boolean {
    const raw = database.prepare("SELECT value_json FROM settings WHERE key = 'include_projected_variable_expenses'").pluck().get() as string | undefined;
    if (!raw) return true;
    const value: unknown = JSON.parse(raw);
    return typeof value === "boolean" ? value : true;
  }

  return {
    getConfiguration(): ForecastConfiguration {
      return {
        goal: getGoal(),
        minimumCashBufferCents: getMinimumBuffer(),
        includeProjectedVariableExpenses: getIncludeProjectedVariableExpenses(),
        incomeExpectations: database.prepare(`SELECT id, name, expected_date AS expectedDate, amount_cents AS amountCents FROM income_expectations
          WHERE scenario = 'expected' ORDER BY expected_date, name COLLATE NOCASE`).all() as IncomeExpectation[],
        plannedExpenses: database.prepare(`SELECT id, name, expected_date AS expectedDate, amount_cents AS amountCents FROM planned_expenses
          WHERE scenario = 'expected' ORDER BY expected_date, name COLLATE NOCASE`).all() as PlannedExpense[],
        recurringItems: database.prepare(`SELECT id, name, transaction_type AS transactionType, expected_amount_cents AS expectedAmountCents,
          frequency, next_expected_date AS nextExpectedDate, end_date AS endDate FROM recurring_items WHERE is_enabled = 1
          AND transaction_type IN ('income', 'expense') ORDER BY next_expected_date, name COLLATE NOCASE`).all() as RecurringItem[]
      };
    },

    setIncludeProjectedVariableExpenses(include: boolean): void {
      database.prepare(`INSERT INTO settings (key, value_json, updated_at) VALUES ('include_projected_variable_expenses', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`)
        .run(JSON.stringify(include), now().toISOString());
    },

    saveGoal(input: GoalWrite): SavingsGoal {
      const timestamp = now().toISOString();
      database.transaction(() => {
        const existing = getGoal();
        if (existing) {
          database.prepare(`UPDATE savings_goals SET name = ?, start_date = ?, target_date = ?, target_amount_cents = ?, starting_amount_cents = ?,
            include_investment_transfers = ?, updated_at = ? WHERE id = ?`)
            .run(input.name, input.startDate, input.targetDate, input.targetAmountCents, input.startingAmountCents, Number(input.includeInvestmentTransfers), timestamp, existing.id);
        } else {
          database.prepare(`INSERT INTO savings_goals (id, name, start_date, target_date, target_amount_cents, starting_amount_cents,
            include_investment_transfers, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
            .run(makeId(), input.name, input.startDate, input.targetDate, input.targetAmountCents, input.startingAmountCents, Number(input.includeInvestmentTransfers), timestamp, timestamp);
        }
        database.prepare(`INSERT INTO settings (key, value_json, updated_at) VALUES ('minimum_cash_buffer_cents', ?, ?)
          ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`)
          .run(JSON.stringify(input.minimumCashBufferCents), timestamp);
      })();
      return getGoal()!;
    },

    createIncome(input: IncomeWrite): IncomeExpectation {
      const id = makeId(); const timestamp = now().toISOString();
      database.prepare(`INSERT INTO income_expectations (id, name, expected_date, amount_cents, account_id, scenario, is_committed, created_at, updated_at)
        VALUES (?, ?, ?, ?, NULL, 'expected', 0, ?, ?)`).run(id, input.name, input.expectedDate, input.amountCents, timestamp, timestamp);
      return database.prepare("SELECT id, name, expected_date AS expectedDate, amount_cents AS amountCents FROM income_expectations WHERE id = ?").get(id) as IncomeExpectation;
    },

    findIncomeById(id: string): IncomeExpectation | null {
      return database.prepare("SELECT id, name, expected_date AS expectedDate, amount_cents AS amountCents FROM income_expectations WHERE id = ?")
        .get(id) as IncomeExpectation | undefined ?? null;
    },

    updateIncome(id: string, input: IncomeWrite): IncomeExpectation | null {
      const result = database.prepare("UPDATE income_expectations SET name = ?, expected_date = ?, amount_cents = ?, updated_at = ? WHERE id = ?")
        .run(input.name, input.expectedDate, input.amountCents, now().toISOString(), id);
      return result.changes === 1 ? this.findIncomeById(id) : null;
    },

    createPlannedExpense(input: PlannedExpenseWrite): PlannedExpense {
      const id = makeId(); const timestamp = now().toISOString();
      database.prepare(`INSERT INTO planned_expenses (id, name, expected_date, amount_cents, category_id, scenario, is_committed, created_at, updated_at)
        VALUES (?, ?, ?, ?, NULL, 'expected', 0, ?, ?)`).run(id, input.name, input.expectedDate, input.amountCents, timestamp, timestamp);
      return database.prepare("SELECT id, name, expected_date AS expectedDate, amount_cents AS amountCents FROM planned_expenses WHERE id = ?").get(id) as PlannedExpense;
    },

    findPlannedExpenseById(id: string): PlannedExpense | null {
      return database.prepare("SELECT id, name, expected_date AS expectedDate, amount_cents AS amountCents FROM planned_expenses WHERE id = ?")
        .get(id) as PlannedExpense | undefined ?? null;
    },

    updatePlannedExpense(id: string, input: PlannedExpenseWrite): PlannedExpense | null {
      const result = database.prepare("UPDATE planned_expenses SET name = ?, expected_date = ?, amount_cents = ?, updated_at = ? WHERE id = ?")
        .run(input.name, input.expectedDate, input.amountCents, now().toISOString(), id);
      return result.changes === 1 ? this.findPlannedExpenseById(id) : null;
    },

    createRecurring(input: RecurringWrite): RecurringItem {
      const id = makeId(); const timestamp = now().toISOString();
      database.prepare(`INSERT INTO recurring_items (id, name, account_id, category_id, transaction_type, expected_amount_cents, amount_tolerance_cents,
        frequency, next_expected_date, end_date, is_enabled, created_at, updated_at) VALUES (?, ?, NULL, NULL, ?, ?, 0, ?, ?, ?, 1, ?, ?)`)
        .run(id, input.name, input.transactionType, input.expectedAmountCents, input.frequency, input.nextExpectedDate, input.endDate, timestamp, timestamp);
      return database.prepare(`SELECT id, name, transaction_type AS transactionType, expected_amount_cents AS expectedAmountCents,
        frequency, next_expected_date AS nextExpectedDate, end_date AS endDate FROM recurring_items WHERE id = ?`).get(id) as RecurringItem;
    },

    findRecurringById(id: string): RecurringItem | null {
      return database.prepare(`SELECT id, name, transaction_type AS transactionType, expected_amount_cents AS expectedAmountCents,
        frequency, next_expected_date AS nextExpectedDate, end_date AS endDate FROM recurring_items WHERE id = ? AND is_enabled = 1`)
        .get(id) as RecurringItem | undefined ?? null;
    },

    updateRecurring(id: string, input: RecurringWrite): RecurringItem | null {
      const timestamp = now().toISOString();
      const result = database.prepare(`UPDATE recurring_items SET name = ?, transaction_type = ?, expected_amount_cents = ?, frequency = ?,
        next_expected_date = ?, end_date = ?, updated_at = ? WHERE id = ? AND is_enabled = 1`)
        .run(input.name, input.transactionType, input.expectedAmountCents, input.frequency, input.nextExpectedDate, input.endDate, timestamp, id);
      return result.changes === 1 ? this.findRecurringById(id) : null;
    },

    deleteAssumption(kind: "income" | "expense" | "recurring", id: string): boolean {
      const table = kind === "income" ? "income_expectations" : kind === "expense" ? "planned_expenses" : "recurring_items";
      return database.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id).changes === 1;
    },

    forecast(asOfInput: string): ForecastResult | null {
      const asOf = dashboardDateSchema.parse(asOfInput);
      const configuration = this.getConfiguration();
      if (!configuration.goal) return null;
      const goal = configuration.goal;
      const actualThrough = goal.targetDate < asOf ? goal.targetDate : asOf;
      const actualRows = database.prepare(`SELECT transaction_type AS transactionType, amount_cents AS amountCents FROM transactions
        WHERE is_deleted = 0 AND date >= ? AND date <= ? AND transaction_type IN ('income', 'expense', 'refund')`)
        .all(goal.startDate, actualThrough) as Array<{ transactionType: string; amountCents: number }>;
      let incomeCents = 0; let expenseNetCents = 0;
      for (const row of actualRows) {
        if (row.transactionType === "income") incomeCents += row.amountCents;
        else expenseNetCents += row.amountCents;
      }
      const actualSavingsCents = incomeCents + expenseNetCents;
      const investmentContributionsCents = database.prepare(`SELECT COALESCE(SUM(t.amount_cents), 0) FROM transactions t JOIN accounts a ON a.id = t.account_id
        WHERE t.is_deleted = 0 AND t.transaction_type = 'transfer' AND t.amount_cents > 0 AND a.account_type = 'investment'
          AND t.date >= ? AND t.date <= ?`).pluck().get(goal.startDate, actualThrough) as number;
      const currentMonthStart = `${asOf.slice(0, 7)}-01`;
      const baselineStart = previousThreeMonthStart(asOf);
      const baselineNet = database.prepare(`SELECT COALESCE(SUM(amount_cents), 0) FROM transactions
        WHERE is_deleted = 0 AND date >= ? AND date < ? AND transaction_type IN ('expense', 'refund')
          AND is_recurring = 0 AND is_exceptional = 0 AND excluded_from_forecast_baseline = 0`).pluck().get(baselineStart, currentMonthStart) as number;
      const historicalMonthlyBaselineCents = Number(BigInt(Math.max(0, -baselineNet)) / 3n);
      const availableCashCents = database.prepare(`SELECT COALESCE(SUM(${effectiveBalanceSql}), 0) FROM accounts a
        WHERE a.is_archived = 0 AND a.included_in_available_cash = 1`).pluck().get() as number;
      return calculateForecast({
        asOf,
        goal,
        minimumCashBufferCents: configuration.minimumCashBufferCents,
        availableCashCents,
        actualSavingsCents,
        investmentContributionsCents,
        historicalMonthlyBaselineCents,
        includeProjectedVariableExpenses: configuration.includeProjectedVariableExpenses,
        incomeExpectations: configuration.incomeExpectations,
        plannedExpenses: configuration.plannedExpenses,
        recurringItems: configuration.recurringItems
      });
    }
  };
}
