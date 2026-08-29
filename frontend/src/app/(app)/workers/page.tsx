'use client';
import { useState, useEffect } from 'react';
import api, { PageResponse } from '@/lib/api';
import { t, formatCurrency } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Users, Plus, Search, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

interface Worker { id: number; name: string; marathiName: string; phone: string; dailyWage: number; isActive: boolean; outstandingBalance: number; totalAdvance: number; totalPayment: number; }

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get('/workers', { params: { page, size: 20, search: search || undefined } })
      .then(res => { setWorkers(res.data.content); setTotalPages(res.data.totalPages); })
      .catch(() => { setWorkers([]); })
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('workers')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{workers.length} {t('workers').toLowerCase()}</p>
        </div>
        <Link href="/workers/new">
          <Button icon={<Plus size={18} />}>{t('addWorker')}</Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder={`${t('search')}...`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500" />
      </div>

      {loading ? <TableSkeleton rows={5} cols={5} /> : workers.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title={t('noWorkers')} description="Start by adding your first worker" actionLabel={t('addWorker')} onAction={() => window.location.href = '/workers/new'} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left p-4 text-sm font-medium text-gray-500">{t('workerName')}</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">{t('phone')}</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">{t('dailyWage')}</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">{t('balance')}</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">{t('status')}</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">{t('view')}</th>
              </tr></thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4"><div><p className="font-medium text-gray-900 dark:text-white">{w.name}</p>{w.marathiName && <p className="text-sm text-gray-500">{w.marathiName}</p>}</div></td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{w.phone || '-'}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(w.dailyWage)}</td>
                    <td className="p-4"><span className={`text-sm font-medium ${(w.outstandingBalance || 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(w.outstandingBalance || 0)}</span></td>
                    <td className="p-4"><Badge variant={w.isActive ? 'success' : 'danger'}>{w.isActive ? t('active') : t('inactive')}</Badge></td>
                    <td className="p-4 text-right"><Link href={`/workers/${w.id}`} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">{t('view')}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-800">
              <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
              <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
              <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
