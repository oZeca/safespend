import type Database from "better-sqlite3";

function monthOffset(asOf: string, offset: number) {
  const date = new Date(`${asOf.slice(0, 7)}-01T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

export function seedDemoData(database: Database.Database, asOf: string, timestamp = new Date().toISOString()) {
  const year = asOf.slice(0, 4);
  const currentMonth = asOf.slice(0, 7);
  const tomorrowDate = new Date(`${asOf}T00:00:00.000Z`); tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  return database.transaction(() => {
    const accountResult = database.prepare(`INSERT OR IGNORE INTO accounts
      (id, name, institution, account_type, currency, current_balance_cents, included_in_available_cash, included_in_net_worth, is_archived, created_at, updated_at)
      VALUES ('demo-current', 'Demo current account', 'Synthetic Bank', 'current', 'EUR', 850000, 1, 1, 0, ?, ?)`).run(timestamp, timestamp);
    database.prepare(`INSERT OR IGNORE INTO balance_snapshots (id, account_id, date, balance_cents, source, created_at)
      VALUES ('demo-balance', 'demo-current', ?, 850000, 'demo', ?)`).run(asOf, timestamp);
    const insertTransaction = database.prepare(`INSERT OR IGNORE INTO transactions
      (id, account_id, date, posted_at, description, normalized_description, merchant, amount_cents, transaction_type, category_id, notes,
       is_recurring, is_exceptional, excluded_from_forecast_baseline, is_deleted, created_at, updated_at)
      VALUES (?, 'demo-current', ?, NULL, ?, ?, ?, ?, ?, ?, 'Synthetic demo data', ?, 0, 0, 0, ?, ?)`);
    let transactionChanges = 0;
    const rows = [
      ["demo-salary-current", `${currentMonth}-02`, "Demo salary", "demo salary", "Synthetic Employer", 320000, "income", "category-salary", 0],
      ["demo-rent-current", `${currentMonth}-03`, "Demo rent", "demo rent", "Synthetic Landlord", -95000, "expense", "category-housing", 1],
      ["demo-groceries-current", `${currentMonth}-08`, "Demo groceries", "demo groceries", "Synthetic Market", -4250, "expense", "category-groceries", 0],
      ...[-1, -2, -3].flatMap((offset) => {
        const month = monthOffset(asOf, offset);
        return [
          [`demo-salary-${month}`, `${month}-02`, "Demo salary", "demo salary", "Synthetic Employer", 320000, "income", "category-salary", 0],
          [`demo-rent-${month}`, `${month}-03`, "Demo rent", "demo rent", "Synthetic Landlord", -95000, "expense", "category-housing", 1],
          [`demo-variable-${month}`, `${month}-10`, "Demo variable spending", "demo variable spending", "Synthetic Merchant", -35000, "expense", "category-shopping", 0]
        ];
      })
    ] as Array<[string, string, string, string, string, number, string, string, number]>;
    for (const row of rows) transactionChanges += insertTransaction.run(...row, timestamp, timestamp).changes;
    const goalResult = database.prepare(`INSERT OR IGNORE INTO savings_goals
      (id, name, start_date, target_date, target_amount_cents, starting_amount_cents, include_investment_transfers, is_active, created_at, updated_at)
      SELECT 'demo-goal', 'Demo annual savings', ?, ?, 1200000, 100000, 0, 1, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM savings_goals WHERE is_active = 1)`).run(`${year}-01-01`, `${year}-12-31`, timestamp, timestamp);
    database.prepare(`INSERT OR IGNORE INTO income_expectations
      (id, name, expected_date, amount_cents, account_id, scenario, is_committed, created_at, updated_at)
      VALUES ('demo-income', 'Demo bonus', ?, 50000, 'demo-current', 'expected', 0, ?, ?)`).run(tomorrow, timestamp, timestamp);
    database.prepare(`INSERT OR IGNORE INTO planned_expenses
      (id, name, expected_date, amount_cents, category_id, scenario, is_committed, created_at, updated_at)
      VALUES ('demo-planned', 'Demo annual insurance', ?, 30000, 'category-housing', 'expected', 1, ?, ?)`).run(tomorrow, timestamp, timestamp);
    database.prepare(`INSERT OR IGNORE INTO recurring_items
      (id, name, account_id, category_id, transaction_type, expected_amount_cents, amount_tolerance_cents, frequency, next_expected_date, end_date, is_enabled, created_at, updated_at)
      VALUES ('demo-recurring', 'Demo rent', 'demo-current', 'category-housing', 'expense', -95000, 0, 'monthly', ?, NULL, 1, ?, ?)`)
      .run(tomorrow, timestamp, timestamp);
    return { accountCreated: accountResult.changes === 1, transactionsCreated: transactionChanges, goalCreated: goalResult.changes === 1 };
  })();
}
