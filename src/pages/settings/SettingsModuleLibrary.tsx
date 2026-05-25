// ============================================
// Module Library Settings Page
// Browse DNA ERP modules from live Supabase data
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, RefreshCw, AlertCircle, Package, ArrowLeft } from 'lucide-react';
import { getModules } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Module } from '@/types/database';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ─── Category Badge Color Map ───
const categoryStyles: Record<string, string> = {
  Financial: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'Supply Chain': 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  HR: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Sales: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  System: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

const defaultCategoryStyle = 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';

// ─── Skeleton Card ───
function SkeletonCard() {
  return (
    <div className="rounded-lg border border-dna-alto bg-white dark:bg-dna-surface-darker p-5 shadow-sm animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-1 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center justify-between pt-2">
            <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Module Card ───
function ModuleCard({ module, onClick }: { module: Module; onClick: () => void }) {
  const badgeClass = categoryStyles[module.category] ?? defaultCategoryStyle;
  const transactionCount = (module as Module & { transaction_count?: number }).transaction_count ?? 0;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-lg border border-dna-alto dark:border-dna-alto bg-white dark:bg-dna-surface-darker p-0 shadow-sm transition-all duration-200 hover:shadow-md hover:border-dna-silver dark:hover:border-dna-border-soft focus:outline-none focus:ring-2 focus:ring-dna-pomegranate focus:ring-offset-1 dark:focus:ring-offset-black"
    >
      <div className="flex items-start gap-0">
        {/* Color-coded left border */}
        <div
          className="w-1.5 shrink-0 self-stretch rounded-l-lg"
          style={{ backgroundColor: module.color ?? '#C7C7C7' }}
        />

        <div className="flex-1 p-5">
          {/* Top row: Name + Category badge */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-dna-pomegranate dark:group-hover:text-dna-pomegranate transition-colors">
              {module.name}
            </h3>
            <span
              className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
            >
              {module.category}
            </span>
          </div>

          {/* Code badge */}
          <span className="mt-1.5 inline-flex items-center rounded bg-gray-100 dark:bg-dna-surface-dark px-1.5 py-0.5 text-xs font-mono text-dna-tundora dark:text-dna-text-secondary">
            {module.code}
          </span>

          {/* Description - 2 lines max */}
          {module.description && (
            <p className="mt-3 text-sm text-dna-tundora dark:text-dna-text-secondary line-clamp-2 leading-relaxed">
              {module.description}
            </p>
          )}

          {/* Bottom: Transaction count */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-dna-alto pt-3">
            <span className="text-xs text-dna-tundora dark:text-dna-text-muted">
              {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
            </span>
            <span className="text-xs font-medium text-dna-pomegranate opacity-0 group-hover:opacity-100 transition-opacity">
              View details &rarr;
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Main Page Component ───
export default function SettingsModuleLibrary() {
  const navigate = useNavigate();

  const [modules, setModules] = useState<Module[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadModules() {
    setLoading(true);
    setError(null);
    try {
      const data = await getModules();
      setModules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModules();
  }, []);

  // Filter modules by search
  const filtered = useMemo(() => {
    if (!search.trim()) return modules;
    const q = search.toLowerCase();
    return modules.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q)
    );
  }, [modules, search]);

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
          <h1 className="text-3xl font-semibold tracking-tight text-dna-black dark:text-white">Module Library</h1>
          <p className="text-sm text-dna-tundora dark:text-dna-text-secondary mt-1">
            Configure ERP module references, transactions, and manual-building structure.
          </p>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
        className="max-w-md"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dna-silver dark:text-dna-text-muted" />
          <Input
            type="text"
            placeholder="Search modules by name, code, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Failed to load modules</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
            <button
              onClick={loadModules}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 dark:bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Module Grid */}
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-dna-tundora dark:text-dna-text-secondary">
              {filtered.length} module{filtered.length !== 1 ? 's' : ''}
              {search ? ` matching "${search}"` : ''}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-dna-silver dark:border-dna-alto bg-white dark:bg-dna-surface-darker py-16">
              <Package className="h-10 w-10 text-dna-silver dark:text-dna-text-muted" />
              <p className="mt-3 text-sm font-medium text-dna-tundora dark:text-white">No modules found</p>
              <p className="text-xs text-dna-silver dark:text-dna-text-muted mt-1">
                {search ? 'Try a different search term' : 'Modules will appear here once real library data is added'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onClick={() => navigate(`/transactions/${module.id}`)}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
