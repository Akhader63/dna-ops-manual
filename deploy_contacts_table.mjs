import pg from 'pg';
const { Client } = pg;

// Read SQL from file
import fs from 'fs';
const sql = fs.readFileSync('database/client_contacts_table.sql', 'utf8');

// Supabase direct connection
const client = new Client({
  connectionString: 'postgresql://postgres:Ak892763507@db.ocgqvncgcbbdnpsuxona.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function deploy() {
  try {
    console.log('🔄 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!');
    
    console.log('🔄 Executing migration...');
    await client.query(sql);
    console.log('✅ Migration complete!');
    
    // Verify
    const result = await client.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'client_contacts'");
    console.log(`✅ Table exists: ${result.rows[0].count === '1'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

deploy();
