-- Grant permissions to ensure INSERT works
GRANT ALL ON public.modules TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Add RLS policy to allow service_role to insert/update
DROP POLICY IF EXISTS "Service role can manage modules" ON modules;
CREATE POLICY "Service role can manage modules" ON modules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add depends_on column if it doesn't exist
ALTER TABLE modules ADD COLUMN IF NOT EXISTS depends_on text[] DEFAULT '{}';
COMMENT ON COLUMN modules.depends_on IS 'Array of module codes that this module depends on';

-- Insert all 10 modules with their dependencies
INSERT INTO modules (code, name, category, description, icon, color, sort_order, is_active, depends_on) VALUES
('dashboard', 'Dashboard', 'Core', 'Overview of key metrics and activities', 'LayoutDashboard', '#3B82F6', 1, true, '{}'),
('clients', 'Clients', 'Core', 'Manage client accounts and information', 'Building2', '#10B981', 2, true, '{}'),
('manual_builder', 'Manual Builder', 'Content', 'Create and edit operational manuals', 'FileText', '#8B5CF6', 3, true, '{}'),
('module_library', 'Module Library', 'Content', 'Browse ERP modules, transactions, and use cases', 'Library', '#F59E0B', 4, true, '{}'),
('approval_gateways', 'Approval Gateways', 'Workflow', 'Configure approval workflows', 'CheckCircle2', '#EF4444', 5, true, '{}'),
('role_setup', 'Role Setup', 'Configuration', 'Define user roles and permissions', 'Users', '#EC4899', 6, true, '{}'),
('roadmap_generator', 'Roadmap Generator', 'Planning', 'Generate implementation roadmaps based on client needs', 'Map', '#6366F1', 7, true, '{module_library,clients,role_setup}'),
('manual_preview', 'Manual Preview', 'Content', 'Preview manuals before sharing with clients', 'Eye', '#14B8A6', 8, true, '{manual_builder}'),
('project_tracker', 'Project Tracker', 'Management', 'Track project progress and milestones', 'ListTodo', '#F97316', 9, true, '{clients}'),
('issues_tracker', 'Issues Tracker', 'Management', 'Log and track issues during implementation', 'AlertCircle', '#DC2626', 10, true, '{project_tracker}')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  depends_on = EXCLUDED.depends_on;

-- Verify the data
SELECT code, name, is_active, depends_on FROM modules ORDER BY sort_order;
