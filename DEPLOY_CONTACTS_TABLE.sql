-- ============================================
-- CLIENT CONTACTS TABLE - ONE-CLICK DEPLOYMENT
-- ============================================
-- Copy this entire file and paste it into Supabase SQL Editor
-- Then click RUN to create the table
-- ============================================

-- Step 1: Create the client_contacts table
CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  mobile_number TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);

-- Step 3: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_client_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger
DROP TRIGGER IF EXISTS trigger_update_client_contacts_updated_at ON client_contacts;
CREATE TRIGGER trigger_update_client_contacts_updated_at
  BEFORE UPDATE ON client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_client_contacts_updated_at();

-- Step 5: Enable Row Level Security
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies
DROP POLICY IF EXISTS "Allow authenticated users to read client contacts" ON client_contacts;
CREATE POLICY "Allow authenticated users to read client contacts"
  ON client_contacts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert client contacts" ON client_contacts;
CREATE POLICY "Allow authenticated users to insert client contacts"
  ON client_contacts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update client contacts" ON client_contacts;
CREATE POLICY "Allow authenticated users to update client contacts"
  ON client_contacts FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete client contacts" ON client_contacts;
CREATE POLICY "Allow authenticated users to delete client contacts"
  ON client_contacts FOR DELETE TO authenticated USING (true);

-- ============================================
-- DEPLOYMENT COMPLETE!
-- ============================================
-- The client_contacts table is now ready
-- You can close this tab and test adding contacts
-- ============================================
