ALTER TABLE imports ADD COLUMN excluded_count INTEGER NOT NULL DEFAULT 0 CHECK (excluded_count >= 0);
