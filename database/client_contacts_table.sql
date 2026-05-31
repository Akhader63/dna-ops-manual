-- ============================================
-- Client Contacts Table
-- ============================================
-- This table stores additional contacts for each client
-- The primary contact is stored directly in the clients table

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

-- Create index on client_id for faster queries
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_contacts_updated_at
  BEFORE UPDATE ON client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_client_contacts_updated_at();

-- Enable Row Level Security
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth setup)
-- Allow authenticated users to read all contacts
CREATE POLICY "Allow authenticated users to read client contacts"
  ON client_contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert contacts
CREATE POLICY "Allow authenticated users to insert client contacts"
  ON client_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update contacts
CREATE POLICY "Allow authenticated users to update client contacts"
  ON client_contacts
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete contacts
CREATE POLICY "Allow authenticated users to delete client contacts"
  ON client_contacts
  FOR DELETE
  TO authenticated
  USING (true);
