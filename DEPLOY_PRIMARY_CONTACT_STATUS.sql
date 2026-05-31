-- Add is_active field for primary contact to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS contact_is_active BOOLEAN DEFAULT TRUE;

-- Update any existing NULL values to true
UPDATE clients SET contact_is_active = TRUE WHERE contact_is_active IS NULL;

-- Make the column NOT NULL
ALTER TABLE clients
ALTER COLUMN contact_is_active SET NOT NULL;
