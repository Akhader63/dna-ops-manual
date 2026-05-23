-- Fix RLS policies for clients table to allow CRUD operations

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to view clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON clients;

-- Create comprehensive RLS policies for clients table

-- 1. SELECT policy - Allow authenticated users to view all clients
CREATE POLICY "Allow authenticated users to view clients"
ON clients
FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT policy - Allow authenticated users to create clients
CREATE POLICY "Allow authenticated users to insert clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. UPDATE policy - Allow authenticated users to update clients
CREATE POLICY "Allow authenticated users to update clients"
ON clients
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. DELETE policy - Allow authenticated users to delete clients
CREATE POLICY "Allow authenticated users to delete clients"
ON clients
FOR DELETE
TO authenticated
USING (true);

-- Verify RLS is enabled on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;
