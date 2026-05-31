// Execute SQL via Supabase's query endpoint
const sql = `
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

CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);

CREATE OR REPLACE FUNCTION update_client_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_contacts_updated_at ON client_contacts;
CREATE TRIGGER trigger_update_client_contacts_updated_at
  BEFORE UPDATE ON client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_client_contacts_updated_at();

ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

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
`;

const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ3F2bmNnY2JiZG5wc3V4b25hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcyNzE1MywiZXhwIjoyMDkzMzAzMTUzfQ.fu23uYueYh_i4xzWGT8dZa2O-oYgEfeXXKdlf0rx7D4';

// Execute SQL statements one by one via pg library with IPv4 only
import pg from 'pg';
const { Client } = pg;

const statements = sql.split(';').filter(s => s.trim()).map(s => s.trim() + ';');

async function execute() {
  const client = new Client({
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.ocgqvncgcbbdnpsuxona',
    password: 'Ak892763507',
    ssl: false,
    family: 4 // Force IPv4
  });
  
  try {
    console.log('🔄 Connecting to Supabase (IPv4 only)...');
    await client.connect();
    console.log('✅ Connected!');
    
    let count = 0;
    for (const stmt of statements) {
      count++;
      console.log(`🔄 Executing statement ${count}/${statements.length}...`);
      await client.query(stmt);
    }
    
    console.log('✅ All statements executed successfully!');
    
    // Verify
    const result = await client.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'client_contacts'");
    console.log(`✅ Table verified: ${result.rows[0].count === '1' ? 'EXISTS' : 'NOT FOUND'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

execute();
