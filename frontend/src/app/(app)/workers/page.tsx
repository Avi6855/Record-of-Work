'use client';
import { useState, useMemo } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useWorkersQuery } from '@/lib/hooks';
import { t, formatCurrency, getWorkTypeLabel } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { Users, Plus, Search, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api, { PageResponse } from '@/lib/api';

interface Worker { id: number; name: string; marathiName: string; phone: string; dailyWage: number; isActive: boolean; outstandingBalance: number; workType: string; village: string; }

export default function WorkersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching, isError } = useWorkersQuery(page, 20, search);
  const queryClient = useQueryClient();

  const workers: Worker[] = useMemo(() => data?.content || [], [data]);
  const totalPages = data?.totalPages || 0;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/workers/${id}`);
      return id;
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['workers'] });
      const previous = new Map();
      // snapshot all workers queries
      const cache = queryClient.getQueriesData<PageResponse<Worker>>({ queryKey: ['workers'] });
      cache.forEach(([key, val]) => {
        if (val) {
          previous.set(JSON.stringify(key), val);
          queryClient.setQueryData<PageResponse<Worker>>(key, (old) => {
            if (!old) return old;
            return { ...old, content: old.content.filter((w: Worker) => w.id !== id), totalElements: Math.max(0, old.totalElements - 1), empty: old.content.length === 1 };
          });
        }
      });
      return { previous };
    },
    onError: (_err, _id, context: any) => {
      if (context?.previous) {
        context.previous.forEach((val: any, keyStr: string) => {
          const key = JSON.parse(keyStr);
          queryClient.setQueryData(key, val);
        });
      }
      toast.error('हटवण्यात त्रुटी / Delete failed');
    },
    onSuccess: () => {
      toast.success(t('saved'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`${name} - ${t('delete')}? ${t('confirm')}`)) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('workers')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{data?.totalElements ?? workers.length} {t('workers').toLowerCase()} {isFetching && <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full animate-pulse ml-2" />}</p>
        </div>
        <Link href="/workers/new">
          <Button icon={<Plus size={18} />}>{t('addWorker')}</Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder={`${t('search')}...`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
      ) : isError ? (
        <div className="text-center py-8 text-rose-500">डेटा लोड करण्यात त्रुटी</div>
      ) : workers.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title={t('noWorkers')} description="Start by adding your first worker" actionLabel={t('addWorker')} onAction={() => window.location.href = '/workers/new'} />
      ) : (
        <Card>
          <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''} transition-opacity`}>
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left p-4 text-sm font-medium text-gray-500">{t('workerName')}</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">{t('phone')}</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">{t('workType')}</th>
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
                    <td className="p-4 text-sm"><span className="inline-flex px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">{getWorkTypeLabel(w.workType)}</span></td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(w.dailyWage)}</td>
                    <td className="p-4"><span className={`text-sm font-medium ${(w.outstandingBalance || 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(w.outstandingBalance || 0)}</span></td>
                    <td className="p-4"><Badge variant={w.isActive ? 'success' : 'danger'}>{w.isActive ? t('active') : t('inactive')}</Badge></td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/workers/${w.id}`} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20">{t('view')}</Link>
                        <Link href={`/workers/${w.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-indigo-600" title={t('edit')}><Edit size={16} /></Link>
                        <button onClick={() => handleDelete(w.id, w.name)} disabled={deleteMutation.isPending} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-600 disabled:opacity-50" title={t('delete')}><Trash2 size={16} /></button>
                      </div>
                    </td>
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
