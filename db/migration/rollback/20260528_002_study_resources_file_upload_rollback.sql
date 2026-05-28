UPDATE study_resources SET url = '' WHERE url IS NULL;

ALTER TABLE study_resources
  ALTER COLUMN url SET NOT NULL,
  DROP COLUMN IF EXISTS file_path;
