'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { t, formatCurrency, formatDate } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface Project { id: number; name: string; contractAmount: number; totalExpense: number; totalClientPayment: number; pendingAmount: number; estimatedProfit: number; status: string; siteAddress: string; startDate: string; endDate: string; workers: any[]; }

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get(`/projects/${params.id}`).then(res => setProject(res.data)).finally(() => setLoading(false)); }, [params.id]);

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />;
  if (!project) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects"><Button variant="ghost" size="sm" icon={<ArrowLeft size={18} />}>Back</Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <Badge variant={project.status === 'ACTIVE' ? 'success' : 'warning'}>{project.status}</Badge>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardContent className="space-y-2">
          <p className="text-sm text-gray-500">{t('contractAmount')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(project.contractAmount)}</p>
        </CardContent></Card>
        <Card><CardContent className="space-y-2">
          <p className="text-sm text-gray-500">{t('todayExpenses')}</p>
          <p className="text-2xl font-bold text-rose-500">{formatCurrency(project.totalExpense)}</p>
        </CardContent></Card>
        <Card><CardContent className="space-y-2">
          <p className="text-sm text-gray-500">{t('clientPending')}</p>
          <p className="text-2xl font-bold text-amber-500">{formatCurrency(project.pendingAmount)}</p>
        </CardContent></Card>
      </div>
      {project.workers && project.workers.length > 0 && (
        <Card><CardHeader><h3 className="font-semibold">Assigned Workers</h3></CardHeader>
          <CardContent><div className="flex flex-wrap gap-2">{project.workers.map((w: any) => <Badge key={w.id} variant="info">{w.name}</Badge>)}</div></CardContent>
        </Card>
      )}
    </div>
  );
}
