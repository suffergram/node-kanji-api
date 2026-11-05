-- Up Migration

ALTER TABLE vocab ALTER COLUMN jlpt DROP NOT NULL;

-- Down Migration

ALTER TABLE vocab ALTER COLUMN jlpt SET NOT NULL;
