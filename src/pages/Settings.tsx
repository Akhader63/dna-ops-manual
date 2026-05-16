import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  Users,
  Layers,
  Bell,
  ClipboardList,
  Sliders,
  AlertTriangle,
  RefreshCw,
  Check,
  Shield,
  Mail,
  Settings2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { Module, UserAccount, ChangeLog } from '@/types/database';

import UsersTab from '@/components/UsersTab';
import SMTPTab from '@/components/SMTPTab';
import VariablesTab from '@/components/VariablesTab';
const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ──────────── Loading Skeleton ──────────── */
function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

/* ──────────── Error State ──────────── */
function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle size={24} className="text-red-500" />
      </div>
      <p className="text-sm text-dna-tundora mb-2">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw size={14} />
        Retry
      </Button>
    </div>
  );
}

/* ──────────── Tab: General ──────────── */
function GeneralTab() {
  const [companyName, setCompanyName] = useState('DNA Advisory');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('dna_general_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setCompanyName(settings.companyName || 'DNA Advisory');
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
  }, []);

  // Track changes
  useEffect(() => {
    const savedSettings = localStorage.getItem('dna_general_settings');

    if (!savedSettings) {
      setHasChanges(true);
      return;
    }

    try {
      const saved = JSON.parse(savedSettings);
      const changed = saved.companyName !== companyName;
      setHasChanges(changed);

      // Reset justSaved flag when user makes changes after saving
      if (changed) {
        setJustSaved(false);
      }
    } catch {
      setHasChanges(true);
    }
  }, [companyName]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Simulate brief save delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const settings = { companyName };
      localStorage.setItem('dna_general_settings', JSON.stringify(settings));

      setHasChanges(false);
      setJustSaved(true);

      toast.success('Settings saved successfully', {
        description: 'Your preferences have been updated.',
      });

      // Reset justSaved after 2 seconds
      setTimeout(() => {
        setJustSaved(false);
      }, 2000);
    } catch {
      toast.error('Failed to save settings', {
        description: 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className="space-y-6 max-w-lg"
    >
      <div>
        <label className="block text-sm font-medium text-dna-black mb-1.5">Company Name</label>
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Enter company name"
        />
        <p className="text-xs text-dna-tundora mt-1">This will be displayed across the application.</p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          className="bg-dna-black text-white hover:bg-dna-tundora transition-colors disabled:opacity-50"
          onClick={handleSave}
          disabled={isSaving || !hasChanges || justSaved}
        >
          {isSaving ? (
            <>
              <RefreshCw size={16} className="mr-2 animate-spin" />
              Saving...
            </>
          ) : justSaved ? (
            <>
              <Check size={16} className="mr-2" />
              Saved!
            </>
          ) : (
            <>Save Changes</>
          )}
        </Button>
        {hasChanges && !justSaved && (
          <span className="text-xs text-dna-silver">You have unsaved changes</span>
        )}
        {justSaved && (
          <span className="text-xs text-green-600">Settings saved successfully</span>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────── Tab: Modules ──────────── */
function ModulesTab() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

  const fetchModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      const modules = (data || []) as Module[];
      setModules(modules);
      const map: Record<string, boolean> = {};
      modules.forEach((m) => { map[(m as {id: string, is_active: boolean}).id] = (m as {id: string, is_active: boolean}).is_active; });
      setEnabledMap(map);
    } catch (err) {
      setError((err as Error).message || 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleToggleModule = async (moduleId: string, checked: boolean) => {
    // Optimistically update UI
    setEnabledMap((prev) => ({ ...prev, [moduleId]: checked }));
    setSavingMap((prev) => ({ ...prev, [moduleId]: true }));

    try {
      const { error } = await supabase
        .from('modules')
        .update({ is_active: checked } as never)
        .eq('id', moduleId);

      if (error) throw error;

      // Update local modules state
      setModules((prev) =>
        prev.map((m) =>
          (m as { id: string }).id === moduleId
            ? { ...m, is_active: checked }
            : m
        )
      );

      toast.success(
        checked ? 'Module enabled' : 'Module disabled',
        {
          description: `${modules.find(m => (m as {id: string}).id === moduleId)?.name || 'Module'} has been ${checked ? 'enabled' : 'disabled'}.`,
        }
      );
    } catch (err) {
      // Revert on error
      setEnabledMap((prev) => ({ ...prev, [moduleId]: !checked }));
      toast.error('Failed to update module', {
        description: (err as Error).message || 'Please try again.',
      });
    } finally {
      setSavingMap((prev) => ({ ...prev, [moduleId]: false }));
    }
  };

  if (loading) return <SettingsSkeleton />;
  if (error) return <ErrorMessage message={error} onRetry={fetchModules} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className="space-y-3"
    >
      {modules.length === 0 ? (
        <div className="text-center py-12 text-dna-tundora text-sm">No modules found.</div>
      ) : (
        modules.map((mod) => {
          const moduleId = (mod as { id: string }).id;
          return (
            <div
              key={moduleId}
              className="flex items-center justify-between p-4 bg-white border border-dna-alto rounded-lg hover:border-dna-silver transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-dna-black">{mod.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {mod.category}
                  </Badge>
                  {savingMap[moduleId] && (
                    <RefreshCw size={12} className="animate-spin text-dna-silver" />
                  )}
                </div>
                <p className="text-xs text-dna-tundora mt-0.5 truncate">{mod.description ?? 'No description'}</p>
              </div>
              <Switch
                checked={enabledMap[moduleId] ?? (mod as { is_active: boolean }).is_active}
                onCheckedChange={(checked) => handleToggleModule(moduleId, checked)}
                disabled={savingMap[moduleId]}
              />
            </div>
          );
        })
      )}
    </motion.div>
  );
}

/* ──────────── Tab: Notifications ──────────── */
function NotificationsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className="space-y-5 max-w-lg"
    >
      {/* Coming Soon Banner */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Notification System Coming Soon</strong>
          <p className="mt-1 text-sm">
            The notification system is currently in development. These settings will be available in a future release.
          </p>
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between p-4 bg-white border border-dna-alto rounded-lg opacity-60">
        <div>
          <p className="text-sm font-medium text-dna-black">Email Notifications</p>
          <p className="text-xs text-dna-tundora">Receive email updates for important events</p>
        </div>
        <Switch checked={false} disabled />
      </div>

      <div className="flex items-center justify-between p-4 bg-white border border-dna-alto rounded-lg opacity-60">
        <div>
          <p className="text-sm font-medium text-dna-black">New Client Alerts</p>
          <p className="text-xs text-dna-tundora">Get notified when a new client is added</p>
        </div>
        <Switch checked={false} disabled />
      </div>

      <div className="flex items-center justify-between p-4 bg-white border border-dna-alto rounded-lg opacity-60">
        <div>
          <p className="text-sm font-medium text-dna-black">Manual Completion Alerts</p>
          <p className="text-xs text-dna-tundora">Get notified when a manual is completed</p>
        </div>
        <Switch checked={false} disabled />
      </div>

      <div className="flex items-center justify-between p-4 bg-white border border-dna-alto rounded-lg opacity-60">
        <div>
          <p className="text-sm font-medium text-dna-black">Issue Assignment Alerts</p>
          <p className="text-xs text-dna-tundora">Get notified when an issue is assigned to you</p>
        </div>
        <Switch checked={false} disabled />
      </div>
    </motion.div>
  );
}

/* ──────────── Tab: Audit Log ──────────── */
function AuditLogTab() {
  const [logs, setLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('change_logs')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data || []) as ChangeLog[]);
    } catch (err) {
      setError((err as Error).message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) return <SettingsSkeleton />;
  if (error) return <ErrorMessage message={error} onRetry={fetchLogs} />;

  const actionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge className="bg-[#D1FAE5] text-[#059669] border-0 hover:bg-[#D1FAE5]">Insert</Badge>;
      case 'UPDATE':
        return <Badge className="bg-[#DBEAFE] text-[#2563EB] border-0 hover:bg-[#DBEAFE]">Update</Badge>;
      case 'DELETE':
        return <Badge className="bg-[#FEE2E2] text-[#DC2626] border-0 hover:bg-[#FEE2E2]">Delete</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
    >
      {logs.length === 0 ? (
        <div className="text-center py-12 text-dna-tundora text-sm">No audit log entries found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-dna-tundora text-xs whitespace-nowrap">
                  {formatTimestamp(log.changed_at)}
                </TableCell>
                <TableCell className="text-sm font-medium text-dna-black">{log.table_name}</TableCell>
                <TableCell>{actionBadge(log.action)}</TableCell>
                <TableCell className="text-dna-tundora text-xs">
                  {log.changed_by ?? 'System'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </motion.div>
  );
}

/* ──────────── Main Settings Page ──────────── */
export default function Settings() {
  const { userAccount } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  const isSuperAdmin = userAccount?.is_super_admin || false;

  const tabItems = [
    { value: 'general', label: 'General', icon: Sliders },
    { value: 'users', label: 'Users', icon: Users },
    { value: 'variables', label: 'Variables', icon: Settings2 },
    { value: 'modules', label: 'Modules', icon: Layers },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'audit', label: 'Audit Log', icon: ClipboardList },
    { value: 'smtp', label: 'SMTP', icon: Mail }, // Always show tab, content is protected
  ];

  return (
    <div className="py-2">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="mb-6"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-dna-black">Settings</h1>
        <p className="mt-1 text-sm text-dna-tundora">Configure the DNA Ops platform</p>
      </motion.div>

      {/* Tabs Layout - Horizontal at Top */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Horizontal Tab Navigation */}
        <div className="border-b border-dna-alto">
          <TabsList className="h-auto w-full bg-transparent p-0 gap-0 flex justify-start">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`relative gap-2 px-6 py-3.5 rounded-none text-sm font-medium border-b-2 transition-all ${
                    isActive
                      ? 'border-dna-pomegranate text-dna-pomegranate bg-transparent'
                      : 'border-transparent text-dna-tundora hover:text-dna-black hover:border-dna-alto'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Full Width Content */}
        <div>
          <TabsContent value="general" className="mt-0">
            <GeneralTab />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <UsersTab />
          </TabsContent>

          <TabsContent value="variables" className="mt-0">
            <VariablesTab />
          </TabsContent>

          <TabsContent value="modules" className="mt-0">
            <ModulesTab />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <AuditLogTab />
          </TabsContent>

          <TabsContent value="smtp" className="mt-0">
            {isSuperAdmin ? (
              <SMTPTab />
            ) : (
              <div className="py-12 text-center">
                <p className="text-dna-tundora">SMTP configuration is only available to Super Administrators.</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
