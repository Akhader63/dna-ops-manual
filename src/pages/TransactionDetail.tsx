// ============================================
// Transaction Detail Page
// Dynamic route: /transactions/:id
// Shows module header + all transactions for that module
// Fetches live data from Supabase via dataService
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, FileText, Layers } from 'lucide-react';
import { getModuleById, getTransactions } from '@/services/dataService';
import type { Module, Transaction } from '@/services/dataService';

// ─── Type Badge Styles ───
const typeStyles: Record<string, string> = {
  Master: 'bg-gray-100 text-gray-700 border-gray-200',
  Transactional: 'bg-blue-50 text-blue-700 border-blue-200',
  Reporting: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const defaultTypeStyle = 'bg-gray-100 text-gray-600 border-gray-200';

// ─── Approval Badge ───
function ApprovalBadge({ required }: { required: boolean }) {
  return required ? (
    <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
      Approval Required
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-500">
      No Approval
    </span>
  );
}

// ─── Category Badge Color Map ───
const categoryStyles: Record<string, string> = {
  Financial: 'bg-blue-50 text-blue-700 border-blue-200',
  'Supply Chain': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HR: 'bg-amber-50 text-amber-700 border-amber-200',
  Sales: 'bg-purple-50 text-purple-700 border-purple-200',
  System: 'bg-gray-100 text-gray-600 border-gray-200',
};

const defaultCategoryStyle = 'bg-gray-100 text-gray-600 border-gray-200';


// ─── Main Page Component ───
export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [module, setModule] = useState<Module | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    if (!id) {
      setError('No module ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [modData, txData] = await Promise.all([
        getModuleById(id),
        getTransactions(id),
      ]);
      setModule(modData);
      setTransactions(txData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const categoryBadgeClass = module?.category
    ? (categoryStyles[module.category] ?? defaultCategoryStyle)
    : defaultCategoryStyle;

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/module-library')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-dna-tundora hover:text-dna-pomegranate transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Module Library
      </button>

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Failed to load data</p>
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
        <div className="space-y-6 animate-pulse">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="h-6 w-48 rounded bg-gray-200 mb-2" />
            <div className="h-4 w-32 rounded bg-gray-200 mb-3" />
            <div className="h-4 w-full rounded bg-gray-200" />
          </div>
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="h-10 rounded-t-lg bg-gray-100" />
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex gap-4">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="h-4 w-40 rounded bg-gray-200" />
                  <div className="h-4 w-24 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && module && (
        <div className="space-y-6">
          {/* Module Header Card */}
          <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: module.color ?? '#C7C7C7' }}
            />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                      {module.name}
                    </h1>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryBadgeClass}`}
                    >
                      {module.category}
                    </span>
                  </div>
                  <span className="mt-2 inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-dna-tundora">
                    {module.code}
                  </span>
                  {module.description && (
                    <p className="mt-3 text-sm text-dna-tundora leading-relaxed max-w-2xl">
                      {module.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 text-sm text-dna-tundora">
                    <Layers className="h-4 w-4" />
                    <span className="font-medium">{transactions.length}</span>
                    <span>transactions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b px-6 py-3">
              <FileText className="h-4 w-4 text-dna-tundora" />
              <h2 className="text-sm font-semibold text-gray-900">Transactions</h2>
            </div>

            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-8 w-8 text-dna-silver" />
                <p className="mt-2 text-sm text-dna-tundora">No transactions found</p>
                <p className="text-xs text-dna-silver">This module has no associated transactions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-dna-tundora uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dna-tundora uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dna-tundora uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dna-tundora uppercase tracking-wider">
                        Approval
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((tx) => {
                      const typeClass = typeStyles[tx.type] ?? defaultTypeStyle;
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/use-cases/${tx.id}`)}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-dna-tundora bg-gray-100 px-1.5 py-0.5 rounded">
                              {tx.code}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{tx.name}</p>
                              {tx.description && (
                                <p className="text-xs text-dna-tundora mt-0.5 line-clamp-1">
                                  {tx.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeClass}`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <ApprovalBadge required={tx.requires_approval} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
