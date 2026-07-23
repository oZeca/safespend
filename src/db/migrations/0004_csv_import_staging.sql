ALTER TABLE imports ADD COLUMN detected_delimiter TEXT;

CREATE TABLE import_rows (
  id TEXT PRIMARY KEY,
  import_id TEXT NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL CHECK (row_number > 0),
  original_payload_json TEXT NOT NULL CHECK (json_valid(original_payload_json)),
  normalized_date TEXT,
  normalized_description TEXT,
  normalized_merchant TEXT,
  normalized_amount_cents INTEGER,
  source_fingerprint TEXT,
  validation_error TEXT,
  is_exact_duplicate INTEGER NOT NULL DEFAULT 0 CHECK (is_exact_duplicate IN (0,1)),
  created_at TEXT NOT NULL,
  UNIQUE(import_id, row_number)
);

CREATE INDEX idx_import_rows_import_row ON import_rows(import_id, row_number);
CREATE UNIQUE INDEX idx_transactions_unique_source_fingerprint ON transactions(source_fingerprint) WHERE source_fingerprint IS NOT NULL;
