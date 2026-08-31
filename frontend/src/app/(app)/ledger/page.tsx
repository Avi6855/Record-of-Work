'use client';
import { useState, useEffect } from 'react';
import { useAllWorkersQuery, useLedgerQuery } from '@/lib/hooks';
import { t, formatCurrency, formatDate } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { BookOpen, Loader2 } from 'lucide-react';

interface LedgerEntry { id: number; entryDate: string; entryType: string; description: string; debit: number; credit: number; balance: number; }

export default function LedgerPage() {
  const { data: workers = [], isLoading: workersLoading } = useAllWorkersQuery(true);
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);

  useEffect(() => {
    if (workers.length > 0 && selectedWorker === null) {
      setSelectedWorker(workers[0].id);
    }
  }, [workers, selectedWorker]);

  const { data: ledger, isFetching, isPlaceholderData } = useLedgerQuery(selectedWorker);

  const showStale = isFetching && isPlaceholderData;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <BookOpen size={22} className="text-indigo-600" />
        {t('ledger')}
        {isFetching && !showStale && <Loader2 size={16} className="animate-spin text-indigo-500" />}
        {showStale && <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> लोड होत आहे...</span>}
      </h1>

      <div className="max-w-md">
        <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">{t('workers')}</label>
        {workersLoading ? (
          <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        ) : workers.length === 0 ? (
          <p className="text-sm text-gray-500">{t('noWorkers')}</p>
        ) : (
          <select
            value={selectedWorker || ''}
            onChange={(e) => setSelectedWorker(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            {workers.map((w: any) => <option key={w.id} value={w.id}>{w.name}{w.marathiName ? ` (${w.marathiName})` : ''}</option>)}
          </select>
        )}
      </div>

      {!selectedWorker ? (
        <Card><CardContent className="p-8 text-center text-gray-500">{t('noWorkers')}</CardContent></Card>
      ) : !ledger && !isFetching ? (
        <Card><CardContent className="p-8 text-center text-gray-500">डेटा उपलब्ध नाही / No ledger data</CardContent></Card>
      ) : (
        <Card className={showStale ? 'opacity-80' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Worker Ledger
                {showStale && <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" title="जुना डेटा — नवीन लोड होत आहे" />}
              </h3>
              {ledger && (
                <div className="flex gap-4 text-sm flex-wrap">
                  <span>Debit: <strong className="text-rose-500">{formatCurrency(ledger.totalDebit)}</strong></span>
                  <span>Credit: <strong className="text-emerald-500">{formatCurrency(ledger.totalCredit)}</strong></span>
                  <span>Balance: <strong className="text-blue-500">{formatCurrency(ledger.currentBalance)}</strong></span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!ledger ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            ) : (ledger.entries || []).length === 0 ? (
              <p className="text-center py-8 text-gray-500">या कामगारासाठी नोंदी नाहीत / No entries</p>
            ) : (
              <div className={`overflow-x-auto transition-opacity ${isFetching && !showStale ? 'opacity-60' : ''}`}>
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left p-3 text-sm font-medium text-gray-500">{t('date')}</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">{t('description')}</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">Debit</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">Credit</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">{t('balance')}</th>
                  </tr></thead>
                  <tbody>
                    {(ledger.entries || []).map((e: LedgerEntry) => (
                      <tr key={e.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-3 text-sm">{formatDate(e.entryDate)}</td>
                        <td className="p-3 text-sm">{e.description} <Badge variant="info" className="ml-1">{e.entryType}</Badge></td>
                        <td className="p-3 text-sm text-right text-rose-500">{e.debit > 0 ? formatCurrency(e.debit) : '-'}</td>
                        <td className="p-3 text-sm text-right text-emerald-500">{e.credit > 0 ? formatCurrency(e.credit) : '-'}</td>
                        <td className="p-3 text-sm text-right font-medium">{formatCurrency(e.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
