-- ============================================
-- FIX CLIENT CONTACTS PERMISSIONS
-- ============================================
-- This grants the necessary permissions to authenticated users
-- Run this in Supabase SQL Editor
-- ============================================

-- Grant all necessary privileges to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_contacts TO authenticated;

-- Grant all necessary privileges to anon role (for public access if needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_contacts TO anon;

-- Grant usage on the sequence (for ID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================
-- PERMISSIONS FIXED!
-- ============================================
-- You can now add contacts to clients
-- ============================================
