ALTER TABLE import_rows ADD COLUMN selected_for_import INTEGER CHECK (selected_for_import IS NULL OR selected_for_import IN (0,1));
