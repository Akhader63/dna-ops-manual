// ============================================
// Use Case Detail Page
// Dynamic route: /use-cases/:id
// Shows all use cases for a given transaction
// Fetches live data from Supabase via dataService
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, Zap, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { getUseCases, getTransactions } from '@/services/dataService';
import type { UseCase, Transaction } from '@/services/dataService';

// ─── Complexity Badge ───
function ComplexityBadge({ complexity }: { complexity: string | null }) {
  const styles: Record<string, string> = {
    simple: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    complex: 'bg-red-50 text-red-700 border-red-200',
  };
  const style = complexity ? (styles[complexity] ?? styles.medium) : styles.medium;
  const label = complexity ? complexity.charAt(0).toUpperCase() + complexity.slice(1) : 'Medium';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

// ─── Critical Badge ───
function CriticalBadge({ isCritical }: { isCritical: boolean }) {
  return isCritical ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-white px-2.5 py-0.5 text-xs font-medium text-red-600">
      <Zap className="h-3 w-3" />
      Critical
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-500">
      Standard
    </span>
  );
}

// ─── Skeleton Card ───
function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-5 w-48 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
        </div>
        <div className="h-5 w-20 rounded-full bg-gray-200" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-4 w-16 rounded bg-gray-200" />
        <div className="h-4 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
}

// ─── Use Case Card ───
function UseCaseCard({ useCase }: { useCase: UseCase }) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-dna-silver">
      {/* Top: Name + Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900">{useCase.name}</h3>
            <CriticalBadge isCritical={useCase.is_critical} />
          </div>
          <span className="mt-1.5 inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-dna-tundora">
            {useCase.code}
          </span>
        </div>
        <ComplexityBadge complexity={useCase.complexity} />
      </div>

      {/* Description */}
      {useCase.description && (
        <p className="mt-3 text-sm text-dna-tundora leading-relaxed line-clamp-3">
          {useCase.description}
        </p>
      )}

      {/* Business Scenario */}
      {useCase.business_scenario && (
        <div className="mt-3 rounded-md bg-dna-pampas px-3 py-2.5">
          <p className="text-xs font-medium text-dna-tundora mb-0.5">Business Scenario</p>
          <p className="text-xs text-dna-tundora/80 leading-relaxed line-clamp-2">
            {useCase.business_scenario}
          </p>
        </div>
      )}

      {/* Footer: Duration + Steps count */}
      <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-3">
        {useCase.estimated_duration && (
          <div className="flex items-center gap-1.5 text-xs text-dna-tundora">
            <Clock className="h-3.5 w-3.5" />
            <span>{useCase.estimated_duration}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-dna-tundora">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{useCase.steps?.length ?? 0} steps</span>
        </div>
        {useCase.typical_approver_roles && useCase.typical_approver_roles.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-dna-tundora">
            <Zap className="h-3.5 w-3.5" />
            <span>{useCase.typical_approver_roles.length} approvers</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page Component ───
export default function UseCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    if (!id) {
      setError('No transaction ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch use cases for this transaction
      const ucData = await getUseCases(id);
      setUseCases(ucData);

      // Try to find the transaction to show context
      // getTransactions() without arg returns all; filter by id
      const allTx = await getTransactions();
      const tx = allTx.find((t: Transaction) => t.id === id) ?? null;
      setTransaction(tx);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load use cases');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() =>
          transaction?.module_id
            ? navigate(`/transactions/${transaction.module_id}`)
            : navigate('/module-library')
        }
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-dna-tundora hover:text-dna-pomegranate transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {transaction ? 'Back to Transactions' : 'Back to Module Library'}
      </button>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-dna-tundora mb-1">
          <span>Use Cases</span>
          {transaction && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-mono text-xs">{transaction.code}</span>
            </>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {transaction?.name ?? 'Use Case Detail'}
        </h1>
        <p className="mt-2 text-base text-dna-tundora">
          {transaction?.description ?? 'Detailed view of use cases for this transaction.'}
        </p>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Failed to load use cases</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-dna-tundora">
              {useCases.length} use case{useCases.length !== 1 ? 's' : ''}
            </p>
          </div>

          {useCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-dna-silver bg-white py-16">
              <BookOpen className="h-10 w-10 text-dna-silver" />
              <p className="mt-3 text-sm font-medium text-dna-tundora">No use cases found</p>
              <p className="text-xs text-dna-silver mt-1">
                This transaction has no documented use cases yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {useCases.map((uc) => (
                <UseCaseCard key={uc.id} useCase={uc} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
