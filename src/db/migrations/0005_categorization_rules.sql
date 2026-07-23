ALTER TABLE import_rows ADD COLUMN matched_rule_id TEXT REFERENCES categorization_rules(id) ON DELETE SET NULL;
ALTER TABLE import_rows ADD COLUMN suggested_category_id TEXT REFERENCES categories(id);
ALTER TABLE import_rows ADD COLUMN suggested_transaction_type TEXT CHECK (suggested_transaction_type IS NULL OR suggested_transaction_type IN ('income','expense','transfer','refund'));

CREATE INDEX idx_categorization_rules_enabled_priority ON categorization_rules(is_enabled, priority, created_at, id);
CREATE INDEX idx_transactions_uncategorized ON transactions(category_id, is_deleted) WHERE category_id IS NULL AND is_deleted = 0;
