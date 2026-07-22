CREATE TABLE accounts (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, institution TEXT, account_type TEXT NOT NULL CHECK (account_type IN ('current','savings','cash','credit','investment')),
  currency TEXT NOT NULL, current_balance_cents INTEGER NOT NULL DEFAULT 0, included_in_available_cash INTEGER NOT NULL DEFAULT 1 CHECK (included_in_available_cash IN (0,1)),
  included_in_net_worth INTEGER NOT NULL DEFAULT 1 CHECK (included_in_net_worth IN (0,1)), is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0,1)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE categories (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, parent_category_id TEXT REFERENCES categories(id), kind TEXT NOT NULL CHECK (kind IN ('income','expense','transfer','mixed')),
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0,1)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE import_profiles (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, institution TEXT, file_type TEXT NOT NULL, configuration_json TEXT NOT NULL CHECK (json_valid(configuration_json)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE imports (
  id TEXT PRIMARY KEY, file_name TEXT NOT NULL, file_sha256 TEXT NOT NULL, import_type TEXT NOT NULL, account_id TEXT REFERENCES accounts(id), profile_id TEXT REFERENCES import_profiles(id),
  status TEXT NOT NULL, row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0), imported_count INTEGER NOT NULL DEFAULT 0 CHECK (imported_count >= 0), skipped_count INTEGER NOT NULL DEFAULT 0 CHECK (skipped_count >= 0), error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0), created_at TEXT NOT NULL, completed_at TEXT
);
CREATE TABLE transactions (
  id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), date TEXT NOT NULL, posted_at TEXT, description TEXT NOT NULL, normalized_description TEXT NOT NULL, merchant TEXT,
  amount_cents INTEGER NOT NULL, transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income','expense','transfer','refund')), category_id TEXT REFERENCES categories(id), notes TEXT,
  is_recurring INTEGER NOT NULL DEFAULT 0 CHECK (is_recurring IN (0,1)), is_exceptional INTEGER NOT NULL DEFAULT 0 CHECK (is_exceptional IN (0,1)), excluded_from_forecast_baseline INTEGER NOT NULL DEFAULT 0 CHECK (excluded_from_forecast_baseline IN (0,1)),
  source_import_id TEXT REFERENCES imports(id), source_row_number INTEGER, source_fingerprint TEXT, original_payload_json TEXT CHECK (original_payload_json IS NULL OR json_valid(original_payload_json)), is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0,1)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE transaction_splits (
  id TEXT PRIMARY KEY, transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE, category_id TEXT NOT NULL REFERENCES categories(id), amount_cents INTEGER NOT NULL, notes TEXT, created_at TEXT NOT NULL
);
CREATE TABLE transfer_links (
  id TEXT PRIMARY KEY, source_transaction_id TEXT NOT NULL REFERENCES transactions(id), destination_transaction_id TEXT REFERENCES transactions(id), created_at TEXT NOT NULL,
  CHECK (destination_transaction_id IS NULL OR source_transaction_id <> destination_transaction_id)
);
CREATE TABLE categorization_rules (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, match_field TEXT NOT NULL CHECK (match_field IN ('description','normalized_description','merchant')), match_type TEXT NOT NULL CHECK (match_type IN ('contains','starts_with','exact','regex')),
  pattern TEXT NOT NULL, category_id TEXT REFERENCES categories(id), transaction_type TEXT CHECK (transaction_type IN ('income','expense','transfer','refund')), priority INTEGER NOT NULL DEFAULT 0, is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0,1)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE recurring_items (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, account_id TEXT REFERENCES accounts(id), category_id TEXT REFERENCES categories(id), transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income','expense','transfer','refund')),
  expected_amount_cents INTEGER NOT NULL, amount_tolerance_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_tolerance_cents >= 0), frequency TEXT NOT NULL CHECK (frequency IN ('weekly','monthly','quarterly','yearly')), next_expected_date TEXT NOT NULL, end_date TEXT, is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0,1)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE budgets (
  id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES categories(id), month TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (month, category_id)
);
CREATE TABLE savings_goals (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, start_date TEXT NOT NULL, target_date TEXT NOT NULL, target_amount_cents INTEGER NOT NULL CHECK (target_amount_cents >= 0), starting_amount_cents INTEGER NOT NULL DEFAULT 0,
  include_investment_transfers INTEGER NOT NULL DEFAULT 0 CHECK (include_investment_transfers IN (0,1)), is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE planned_expenses (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, expected_date TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0), category_id TEXT REFERENCES categories(id), scenario TEXT NOT NULL DEFAULT 'expected', is_committed INTEGER NOT NULL DEFAULT 0 CHECK (is_committed IN (0,1)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE income_expectations (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, expected_date TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0), account_id TEXT REFERENCES accounts(id), scenario TEXT NOT NULL DEFAULT 'expected', is_committed INTEGER NOT NULL DEFAULT 0 CHECK (is_committed IN (0,1)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL CHECK (json_valid(value_json)), updated_at TEXT NOT NULL);
CREATE TABLE balance_snapshots (
  id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), date TEXT NOT NULL, balance_cents INTEGER NOT NULL, source TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, date);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_date ON transactions(category_id, date);
CREATE INDEX idx_transactions_source_fingerprint ON transactions(source_fingerprint);
CREATE INDEX idx_transactions_normalized_description ON transactions(normalized_description);
CREATE INDEX idx_imports_file_sha256 ON imports(file_sha256);
CREATE INDEX idx_budgets_month_category ON budgets(month, category_id);
CREATE INDEX idx_recurring_items_next_expected_date ON recurring_items(next_expected_date);
