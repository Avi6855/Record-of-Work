'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { t, formatCurrency } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { FolderKanban, Plus, IndianRupee, Wallet, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface Project { id: number; name: string; contractAmount: number; advanceTotal: number; remainingAmount: number; totalExpense?: number; pendingAmount?: number; status: string; startDate: string; }

export default function ProjectsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects', { params: { page: 0, size: 50 } });
      return res.data.content as Project[];
    },
    retry: 2,
    refetchOnMount: 'always',
  });

  const projects = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('projects')}</h1><p className="text-sm text-gray-500">{projects.length} {t('allProjects')}</p></div>
        <Link href="/projects/new"><Button icon={<Plus size={18} />}>{t('addProject')}</Button></Link>
      </div>
      {isFetching && !isLoading && <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse rounded-full" />}
      {isError && !isLoading ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-gray-500">डेटा लोड करण्यात त्रुटी — कृपया रीफ्रेश करा</p>
          <button onClick={() => refetch()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">पुन्हा प्रयत्न करा / Retry</button>
        </div>
      ) : isLoading ? <TableSkeleton rows={3} cols={5} /> : projects.length === 0 ? (
        <EmptyState icon={<FolderKanban size={48} />} title={t('noProjects')} actionLabel={t('addProject')} onAction={() => window.location.href = '/projects/new'} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card hover className="p-6 overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{p.name}</h3>
                  <Badge variant={p.status === 'ACTIVE' ? 'success' : p.status === 'COMPLETED' ? 'info' : 'warning'}>{p.status}</Badge>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center"><span className="text-gray-500 flex items-center gap-1"><IndianRupee size={14} /> {t('contractAmount')}</span><span className="font-semibold">{formatCurrency(p.contractAmount)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500 flex items-center gap-1"><Wallet size={14} className="text-amber-500"/> {t('advancePayment')}</span><span className="font-semibold text-amber-600">{formatCurrency((p as any).advanceTotal ?? 0)}</span></div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800"><span className="text-gray-500 flex items-center gap-1"><TrendingDown size={14} className="text-emerald-500"/> {t('remainingContract')}</span><span className="font-bold text-emerald-600">{formatCurrency((p as any).remainingAmount ?? (Number(p.contractAmount) - Number((p as any).advanceTotal || 0)))}</span></div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
