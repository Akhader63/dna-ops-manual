-- Enable real-time replication for the modules table
-- This allows cross-tab synchronization

-- Step 1: Enable real-time for the modules table
ALTER PUBLICATION supabase_realtime ADD TABLE modules;

-- Step 2: Verify real-time is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'modules';
