'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { t, formatCurrency, formatDate } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Phone, MapPin, Calendar, Wallet } from 'lucide-react';
import Link from 'next/link';

interface Worker { id: number; name: string; marathiName: string; phone: string; address: string; village: string; workType: string; skill: string; dailyWage: number; overtimeRate: number; joiningDate: string; isActive: boolean; outstandingBalance: number; totalAdvance: number; totalPayment: number; }

export default function WorkerDetailPage() {
  const params = useParams();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/workers/${params.id}`).then(res => setWorker(res.data)).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" /></div>;
  if (!worker) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/workers"><Button variant="ghost" size="sm" icon={<ArrowLeft size={18} />}>Back</Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{worker.name}</h1>
          {worker.marathiName && <p className="text-gray-500">{worker.marathiName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h3 className="font-semibold">Personal Information</h3></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3"><Phone size={16} className="text-gray-400" /><span>{worker.phone || '-'}</span></div>
            <div className="flex items-center gap-3"><MapPin size={16} className="text-gray-400" /><span>{worker.village || worker.address || '-'}</span></div>
            <div className="flex items-center gap-3"><Calendar size={16} className="text-gray-400" /><span>{worker.joiningDate ? formatDate(worker.joiningDate) : '-'}</span></div>
            <Badge variant={worker.isActive ? 'success' : 'danger'}>{worker.isActive ? t('active') : t('inactive')}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="font-semibold">Financial Summary</h3></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">{t('dailyWage')}</span><span className="font-medium">{formatCurrency(worker.dailyWage)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('totalAdvances')}</span><span className="font-medium text-amber-500">{formatCurrency(worker.totalAdvance)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('totalPayments')}</span><span className="font-medium text-emerald-500">{formatCurrency(worker.totalPayment)}</span></div>
            <div className="border-t pt-3 flex justify-between"><span className="font-semibold">{t('balance')}</span><span className={`font-bold ${(worker.outstandingBalance || 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(worker.outstandingBalance || 0)}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
