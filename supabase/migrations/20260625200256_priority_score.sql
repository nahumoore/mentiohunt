-- Migrate product_pages.priority from the page_priority enum (high/medium/low)
-- to a smallint score in the range 1–5.

-- 1. Add the new integer column (nullable during migration)
ALTER TABLE product_pages
  ADD COLUMN priority_score smallint;

-- 2. Populate from the existing enum values
UPDATE product_pages
SET priority_score = CASE priority::text
  WHEN 'high'   THEN 5
  WHEN 'medium' THEN 3
  WHEN 'low'    THEN 1
  ELSE 3
END;

-- 3. Apply NOT NULL + default + check constraint
ALTER TABLE product_pages
  ALTER COLUMN priority_score SET NOT NULL,
  ALTER COLUMN priority_score SET DEFAULT 3,
  ADD CONSTRAINT product_pages_priority_score_check CHECK (priority_score BETWEEN 1 AND 5);

-- 4. Drop the old enum column
ALTER TABLE product_pages
  DROP COLUMN priority;

-- 5. Rename the new column to priority
ALTER TABLE product_pages
  RENAME COLUMN priority_score TO priority;

-- 6. Drop the now-unused enum type
DROP TYPE page_priority;
