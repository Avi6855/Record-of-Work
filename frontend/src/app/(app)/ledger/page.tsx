'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { t, formatCurrency, formatDate } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { BookOpen } from 'lucide-react';

interface LedgerEntry { id: number; entryDate: string; entryType: string; description: string; debit: number; credit: number; balance: number; }

export default function LedgerPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);
  const [ledger, setLedger] = useState<{ entries: LedgerEntry[]; totalDebit: number; totalCredit: number; currentBalance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/workers', { params: { page: 0, size: 100 } }).then(res => {
      const list = res.data.content || [];
      setWorkers(list);
      if (list.length > 0) setSelectedWorker(list[0].id);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedWorker) {
      api.get(`/ledger/worker/${selectedWorker}`).then(res => setLedger(res.data)).catch(() => setLedger(null));
    }
  }, [selectedWorker]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('ledger')}</h1>

      <div className="max-w-md">
        <label className="block text-sm font-medium mb-1.5">{t('workers')}</label>
        <select value={selectedWorker || ''} onChange={(e) => setSelectedWorker(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {ledger && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Worker Ledger</h3>
              <div className="flex gap-4 text-sm">
                <span>Debit: <strong className="text-rose-500">{formatCurrency(ledger.totalDebit)}</strong></span>
                <span>Credit: <strong className="text-emerald-500">{formatCurrency(ledger.totalCredit)}</strong></span>
                <span>Balance: <strong className="text-blue-500">{formatCurrency(ledger.currentBalance)}</strong></span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left p-3 text-sm font-medium text-gray-500">{t('date')}</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">{t('description')}</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">Debit</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">Credit</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">{t('balance')}</th>
                </tr></thead>
                <tbody>
                  {(ledger.entries || []).map((e) => (
                    <tr key={e.id} className="border-b border-gray-50 dark:border-gray-800">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}