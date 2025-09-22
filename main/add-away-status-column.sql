-- Add away_status column to calendar_events table
-- Run this SQL command in your Supabase SQL Editor

ALTER TABLE calendar_events 
ADD COLUMN away_status BOOLEAN DEFAULT FALSE;

-- Add a comment to explain the column
COMMENT ON COLUMN calendar_events.away_status IS 'Indicates if the admin is away (true) or just busy (false)';

-- Update existing records to have away_status = false by default
UPDATE calendar_events 
SET away_status = FALSE 
WHERE away_status IS NULL;
