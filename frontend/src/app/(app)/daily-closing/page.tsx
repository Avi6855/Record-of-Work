'use client';
import { useState } from 'react';
import { useDailyClosingQuery } from '@/lib/hooks';
import api from '@/lib/api';
import { t, formatCurrency } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, Loader2, CheckCircle } from 'lucide-react';

interface DailyClosing { id: number; closingDate: string; totalWorkers: number; presentCount: number; absentCount: number; halfDayCount: number; totalWages: number; totalAdvances: number; totalPayments: number; totalExpenses: number; totalIncome: number; openingCash: number; closingCash: number; isClosed: boolean; notes: string; overtimeCount?: number; }

export default function DailyClosingPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const qc = useQueryClient();
  const { data, isLoading, isFetching, isError, isPlaceholderData } = useDailyClosingQuery(date);
  const [closing, setClosing] = useState(false);

  const future = date > new Date().toISOString().split('T')[0];
  const showStale = isFetching && isPlaceholderData;

  const closeDay = async () => {
    if (future) {
      toast.error('भविष्यातील तारीख बंद करता येणार नाही');
      return;
    }
    if (data?.isClosed) {
      toast.error('हा दिवस आधीच बंद आहे');
      return;
    }
    setClosing(true);
    try {
      const res = await api.post(`/daily-closing/${date}/close`);
      qc.setQueryData(['daily-closing', date], res.data);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('दिवस बंद झाला ✓ / Day closed successfully');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || 'त्रुटी आली';
      if (err.response?.status === 400 && String(msg).includes('already closed')) {
        toast.error('हा दिवस आधीच बंद आहे');
      } else {
        toast.error(String(msg));
      }
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar size={22} className="text-indigo-600" />
          {t('dailyClosing')}
          {isFetching && !showStale && <Loader2 size={16} className="animate-spin text-indigo-500" />}
        </h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500"
            disabled={closing}
          />
          {data && !data.isClosed ? (
            <Button onClick={closeDay} loading={closing} disabled={future || closing}>
              {future ? 'भविष्यातील तारीख' : 'Close Day / दिवस बंद करा'}
            </Button>
          ) : data?.isClosed ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle size={14} /> बंद आहे / Closed
            </span>
          ) : null}
        </div>
      </div>

      {future && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30"><CardContent className="p-4 text-sm text-amber-700 dark:text-amber-300">भविष्यातील तारीख बंद करता येणार नाही / Cannot close a future date.</CardContent></Card>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}
          </div>
        </div>
      ) : isError ? (
        <Card><CardContent className="p-8 text-center text-rose-500">डेटा लोड करण्यात त्रुटी — कृपया पुन्हा प्रयत्न करा</CardContent></Card>
      ) : !data ? (
        <Card><CardContent className="p-8 text-center text-gray-500">डेटा उपलब्ध नाही</CardContent></Card>
      ) : (
        <>
          <div className={`flex items-center gap-3 ${showStale ? 'opacity-60' : ''}`}>
            <Badge variant={data.isClosed ? 'success' : 'warning'}>{data.isClosed ? 'बंद / Closed' : 'खुला / Open'}</Badge>
            <span className="text-sm text-gray-500">{data.closingDate}</span>
            {showStale && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> अपडेट होत आहे...</span>}
          </div>

          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${showStale ? 'opacity-60' : ''} transition-opacity`}>
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

          <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${showStale ? 'opacity-60' : ''} transition-opacity`}>
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

          {data.isClosed && (
            <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
              <CardContent className="p-4 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle size={16} /> हा दिवस लॉक आहे — आता बदल करता येणार नाही / This day is locked and cannot be edited.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
