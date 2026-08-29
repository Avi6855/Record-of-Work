'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { t, formatCurrency } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Users } from 'lucide-react';

interface Worker { id: number; name: string; marathiName: string; dailyWage: number; totalAdvance: number; totalPayment: number; outstandingBalance: number; }

export default function WorkerAccountsPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/workers', { params: { page: 0, size: 200 } }).then(res => setWorkers(res.data.content)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('workerAccounts')}</h1>

      {loading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div> : (
        <div className="space-y-4">
          {workers.map((w) => (
            <Link key={w.id} href={`/workers/${w.id}`}>
              <Card hover className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">{w.name[0]}</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{w.name}</p>
                      {w.marathiName && <p className="text-sm text-gray-500">{w.marathiName}</p>}
                      <p className="text-xs text-gray-400">Daily: {formatCurrency(w.dailyWage)}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm"><span className="text-gray-500">Advance:</span> <span className="font-medium text-amber-500">{formatCurrency(w.totalAdvance)}</span></div>
                    <div className="text-sm"><span className="text-gray-500">Paid:</span> <span className="font-medium text-emerald-500">{formatCurrency(w.totalPayment)}</span></div>
                    <div className="text-sm"><span className="text-gray-500">Balance:</span> <span className={`font-bold ${(w.outstandingBalance || 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(w.outstandingBalance || 0)}</span></div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
