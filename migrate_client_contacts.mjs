import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.ocgqvncgcbbdnpsuxona',
  password: 'Ak892763507',
  ssl: {
    rejectUnauthorized: false,
    servername: 'ocgqvncgcbbdnpsuxona.aws-0-eu-central-1.pooler.supabase.com'
  }
});

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

async function runMigration() {
  try {
    console.log('🔄 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('🔄 Creating client_contacts table...');
    await client.query(sql);
    console.log('✅ Table created successfully!');

    // Verify the table
    const result = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'client_contacts'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Check RLS policies
    const policies = await client.query(`
      SELECT policyname FROM pg_policies WHERE tablename = 'client_contacts';
    `);

    console.log('\n🔒 RLS Policies:');
    policies.rows.forEach(row => {
      console.log(`  - ${row.policyname}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\n🎉 You can now add contacts to clients!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
