'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { t, formatCurrency } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';

interface DailyClosing { id: number; closingDate: string; totalWorkers: number; presentCount: number; absentCount: number; halfDayCount: number; totalWages: number; totalAdvances: number; totalPayments: number; totalExpenses: number; totalIncome: number; openingCash: number; closingCash: number; isClosed: boolean; notes: string; }

export default function DailyClosingPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<DailyClosing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/daily-closing', { params: { date } }).then(res => setData(res.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [date]);

  const closeDay = async () => {
    try {
      await api.post('/daily-closing/close', null, { params: { date } });
      toast.success('Day closed');
      const res = await api.get('/daily-closing', { params: { date } });
      setData(res.data);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dailyClosing')}</h1>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
          {data && !data.isClosed && <Button onClick={closeDay}>Close Day</Button>}
        </div>
      </div>

      {loading ? <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" /> : data && (
        <>
          <div className="flex items-center gap-3">
            <Badge variant={data.isClosed ? 'success' : 'warning'}>{data.isClosed ? 'Closed' : 'Open'}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('totalWorkers'), value: data.totalWorkers },
              { label: t('present'), value: data.presentCount },
              { label: t('absent'), value: data.absentCount },
              { label: t('halfDay'), value: data.halfDayCount },
            ].map((s, i) => (
              <Card key={i}><CardContent className="text-center p-4">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              </CardContent></Card>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: t('todayWages'), value: data.totalWages, color: 'text-blue-500' },
              { label: t('todayAdvances'), value: data.totalAdvances, color: 'text-amber-500' },
              { label: t('todayPayments'), value: data.totalPayments, color: 'text-emerald-500' },
              { label: t('todayExpenses'), value: data.totalExpenses, color: 'text-rose-500' },
              { label: t('todayIncome'), value: data.totalIncome, color: 'text-green-500' },
              { label: t('closingCash'), value: data.closingCash, color: 'text-indigo-500' },
            ].map((s, i) => (
              <Card key={i}><CardContent className="p-4">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
              </CardContent></Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}