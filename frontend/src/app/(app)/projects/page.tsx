'use client';
import { useState, useEffect } from 'react';
import api, { PageResponse } from '@/lib/api';
import { t, formatCurrency } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { FolderKanban, Plus } from 'lucide-react';
import Link from 'next/link';

interface Project { id: number; name: string; contractAmount: number; totalExpense: number; totalClientPayment: number; pendingAmount: number; status: string; startDate: string; }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects', { params: { page: 0, size: 50 } })
      .then(res => setProjects(res.data.content || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('projects')}</h1></div>
        <Link href="/projects/new"><Button icon={<Plus size={18} />}>{t('addProject')}</Button></Link>
      </div>
      {loading ? <TableSkeleton rows={3} cols={5} /> : projects.length === 0 ? (
        <EmptyState icon={<FolderKanban size={48} />} title={t('noProjects')} actionLabel={t('addProject')} onAction={() => window.location.href = '/projects/new'} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card hover className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                  <Badge variant={p.status === 'ACTIVE' ? 'success' : p.status === 'COMPLETED' ? 'info' : 'warning'}>{p.status}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">{t('contractAmount')}</span><span className="font-medium">{formatCurrency(p.contractAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('todayExpenses')}</span><span className="font-medium">{formatCurrency(p.totalExpense)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('clientPending')}</span><span className="font-medium text-rose-500">{formatCurrency(p.pendingAmount)}</span></div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
