-- Add description column to models table
ALTER TABLE models ADD COLUMN IF NOT EXISTS description TEXT;

-- Notify PostgREST to reload schema (if running in SQL Editor this happens automatically, 
-- but good to know: NOTIFY pgrst, 'reload schema';)
