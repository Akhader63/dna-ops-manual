-- COMPREHENSIVE FIX: Grant privileges AND RLS policies for clients table

-- Step 1: Grant table-level privileges to authenticated role
GRANT ALL ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.clients TO anon;
GRANT ALL ON TABLE public.clients TO service_role;

-- Step 2: Grant sequence access (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Step 3: Drop existing RLS policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON clients;
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON clients;

-- Step 4: Create RLS policies
CREATE POLICY "Allow authenticated users to view clients"
ON clients FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow authenticated users to insert clients"
ON clients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update clients"
ON clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete clients"
ON clients FOR DELETE TO authenticated USING (true);

-- Step 5: Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify everything
SELECT 
  'GRANTS' as check_type,
  grantee, 
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE table_name = 'clients' AND table_schema = 'public'
GROUP BY grantee
UNION ALL
SELECT 
  'RLS POLICIES' as check_type,
  policyname as grantee,
  cmd::text as privileges
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY check_type, grantee;
