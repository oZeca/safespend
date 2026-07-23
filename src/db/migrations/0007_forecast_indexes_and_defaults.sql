UPDATE savings_goals
SET is_active = 0
WHERE is_active = 1
  AND id NOT IN (
    SELECT id FROM savings_goals
    WHERE is_active = 1
    ORDER BY updated_at DESC, id DESC
    LIMIT 1
  );

CREATE UNIQUE INDEX idx_savings_goals_one_active
  ON savings_goals(is_active)
  WHERE is_active = 1;

CREATE INDEX idx_savings_goals_target_date
  ON savings_goals(target_date);

CREATE INDEX idx_income_expectations_expected_date
  ON income_expectations(expected_date);

CREATE INDEX idx_planned_expenses_expected_date
  ON planned_expenses(expected_date);

CREATE INDEX idx_recurring_items_enabled_next_date
  ON recurring_items(is_enabled, next_expected_date);

INSERT OR IGNORE INTO settings (key, value_json, updated_at)
VALUES ('minimum_cash_buffer_cents', '0', '2026-07-23T00:00:00.000Z');
