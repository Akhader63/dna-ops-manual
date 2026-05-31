-- ============================================
-- ADD is_active FIELD TO client_contacts
-- ============================================
-- This adds the active/inactive toggle functionality
-- ============================================

-- Add is_active column (defaults to true for existing records)
ALTER TABLE client_contacts
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update any existing NULL values to true
UPDATE client_contacts SET is_active = TRUE WHERE is_active IS NULL;

-- Make the column NOT NULL
ALTER TABLE client_contacts
ALTER COLUMN is_active SET NOT NULL;

-- ============================================
-- COMPLETE!
-- ============================================
