import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Module } from '@/types/database';

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

export default function SettingsModules() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

  // Dependency warning dialog state
  const [showDependencyWarning, setShowDependencyWarning] = useState(false);
  const [pendingModule, setPendingModule] = useState<{ id: string; code: string; name: string } | null>(null);
  const [affectedModules, setAffectedModules] = useState<string[]>([]);

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
      modules.forEach((m) => { map[m.id] = m.is_active; });
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

  // Find modules that depend on the given module code
  const findDependentModules = (moduleCode: string): Module[] => {
    return modules.filter(m =>
      m.depends_on &&
      m.depends_on.includes(moduleCode) &&
      m.is_active
    );
  };

  const handleToggleModule = async (moduleId: string, checked: boolean) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    // If deactivating, check for dependent modules
    if (!checked) {
      const dependents = findDependentModules(module.code);

      if (dependents.length > 0) {
        // Show warning dialog
        setPendingModule({ id: module.id, code: module.code, name: module.name });
        setAffectedModules(dependents.map(m => m.name));
        setShowDependencyWarning(true);
        return;
      }
    }

    // Proceed with toggle
    await performToggle(moduleId, checked);
  };

  const performToggle = async (moduleId: string, checked: boolean) => {
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
          m.id === moduleId
            ? { ...m, is_active: checked }
            : m
        )
      );

      // Trigger immediate sidebar update via custom event
      window.dispatchEvent(new CustomEvent('dna-module-changed'));

      toast.success(
        checked ? 'Module enabled' : 'Module disabled',
        {
          description: `${modules.find(m => m.id === moduleId)?.name || 'Module'} has been ${checked ? 'enabled' : 'disabled'}.`,
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

  const handleConfirmDeactivation = async () => {
    if (!pendingModule) return;

    setShowDependencyWarning(false);
    await performToggle(pendingModule.id, false);

    // Reset pending state
    setPendingModule(null);
    setAffectedModules([]);
  };

  const handleCancelDeactivation = () => {
    setShowDependencyWarning(false);
    setPendingModule(null);
    setAffectedModules([]);
  };

  return (
    <div className="space-y-6">
      {/* Back Button + Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings')}
          className="shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-dna-black dark:text-white">Modules</h1>
          <p className="text-sm text-dna-tundora dark:text-dna-text-secondary mt-1">
            Activate or deactivate available app modules.
          </p>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
      >
        {loading && <SettingsSkeleton />}
        {error && <ErrorMessage message={error} onRetry={fetchModules} />}
        {!loading && !error && (
          <div className="space-y-3">
            {modules.length === 0 ? (
              <div className="text-center py-12 text-dna-tundora text-sm">No modules found.</div>
            ) : (
              modules.map((mod) => {
                const dependents = findDependentModules(mod.code);
                const hasDependents = dependents.length > 0;

                return (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-dna-surface-dark border border-dna-alto dark:border-dna-alto rounded-lg hover:border-dna-silver dark:hover:border-dna-border-soft transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-dna-black dark:text-white">{mod.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {mod.category}
                        </Badge>
                        {hasDependents && mod.is_active && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                            Required by {dependents.length}
                          </Badge>
                        )}
                        {savingMap[mod.id] && (
                          <RefreshCw size={12} className="animate-spin text-dna-silver" />
                        )}
                      </div>
                      <p className="text-xs text-dna-tundora dark:text-dna-text-secondary mt-0.5 truncate">{mod.description ?? 'No description'}</p>
                      {mod.depends_on && mod.depends_on.length > 0 && (
                        <p className="text-xs text-dna-silver dark:text-dna-text-muted mt-1">
                          Depends on: {mod.depends_on.map(code =>
                            modules.find(m => m.code === code)?.name || code
                          ).join(', ')}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={enabledMap[mod.id] ?? mod.is_active}
                      onCheckedChange={(checked) => handleToggleModule(mod.id, checked)}
                      disabled={savingMap[mod.id]}
                    />
                  </div>
                );
              })
            )}
          </div>
        )}
      </motion.div>

      {/* Dependency Warning Dialog */}
      <Dialog open={showDependencyWarning} onOpenChange={setShowDependencyWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Module Dependency Warning
            </DialogTitle>
            <DialogDescription>
              This module is required by other modules. Deactivating it may affect their functionality.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-dna-tundora dark:text-dna-text-secondary mb-3">
              The following modules depend on <span className="font-semibold text-dna-black dark:text-white">{pendingModule?.name}</span>:
            </p>
            <ul className="space-y-2">
              {affectedModules.map((moduleName, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-dna-tundora dark:text-dna-text-secondary">
                    <span className="font-medium text-dna-black dark:text-white">{moduleName}</span> may no longer receive or display updated information
                  </span>
                </li>
              ))}
            </ul>
            <Alert className="mt-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                Affected modules will continue to function but may not show current data from {pendingModule?.name}.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDeactivation}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeactivation}
            >
              Deactivate Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
