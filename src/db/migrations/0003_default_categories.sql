INSERT OR IGNORE INTO categories (id, name, parent_category_id, kind, is_archived, created_at, updated_at) VALUES
  ('category-housing', 'Housing', NULL, 'expense', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-groceries', 'Groceries', NULL, 'expense', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-restaurants', 'Restaurants', NULL, 'expense', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-transport', 'Transport', NULL, 'expense', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-utilities', 'Utilities', NULL, 'expense', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-health', 'Health', NULL, 'expense', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-child', 'Child', NULL, 'expense', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-entertainment', 'Entertainment', NULL, 'expense', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-shopping', 'Shopping', NULL, 'expense', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-travel', 'Travel', NULL, 'expense', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-taxes', 'Taxes', NULL, 'expense', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-salary', 'Salary', NULL, 'income', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-other-income', 'Other income', NULL, 'income', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-investments', 'Investments', NULL, 'transfer', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-transfers', 'Transfers', NULL, 'transfer', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'),
  ('category-uncategorized', 'Uncategorized', NULL, 'mixed', 0, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z');

CREATE INDEX idx_categories_archived_name ON categories(is_archived, name);
CREATE INDEX idx_transactions_deleted_type_date ON transactions(is_deleted, transaction_type, date DESC);
