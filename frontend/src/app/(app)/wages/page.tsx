'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { t, formatCurrency } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Wallet } from 'lucide-react';

interface WageData { workerId: number; workerName: string; presentDays: number; halfDays: number; absentDays: number; overtimeHours: number; grossWage: number; totalAdvance: number; totalPayment: number; remainingBalance: number; }

export default function WagesPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [wages, setWages] = useState<WageData[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/workers', { params: { page: 0, size: 100 } }).then(res => {
      const workerList = res.data.content || [];
      setWorkers(workerList);
      return Promise.all(workerList.map((w: any) =>
        api.get(`/workers/${w.id}/wage`, { params: { year, month } }).then(r => r.data)
      ));
    }).then(wageList => setWages(wageList || [])).catch(() => {}).finally(() => setLoading(false));
  }, [year, month]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('wageCalculation')}</h1>
        <div className="flex items-center gap-3">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2024, m-1).toLocaleString('default', { month: 'long' })}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div> : (
        <div className="space-y-4">
          {wages.map((w) => (
            <Card key={w.workerId}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">{w.workerName?.[0]}</div>
                    <div><p className="font-medium">{w.workerName}</p><p className="text-sm text-gray-500">Present: {w.presentDays} | Half: {w.halfDays} | OT: {w.overtimeHours}hrs</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-500">{formatCurrency(w.grossWage)}</p>
                    <p className={`text-sm font-medium ${w.remainingBalance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>Balance: {formatCurrency(w.remainingBalance)}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Advance: {formatCurrency(w.totalAdvance)}</span>
                  <span>Paid: {formatCurrency(w.totalPayment)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}