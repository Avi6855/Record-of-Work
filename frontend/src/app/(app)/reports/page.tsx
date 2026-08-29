'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { t, formatCurrency } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = () => {
    setLoading(true);
    api.get('/reports/financial', { params: { startDate, endDate } }).then(res => setReport(res.data)).catch(() => setReport(null)).finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports')}</h1>

      <Card><CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div><label className="block text-sm font-medium mb-1.5">{t('startDate')}</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t('endDate')}</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" /></div>
          <Button onClick={generateReport} loading={loading} icon={<BarChart3 size={16} />}>Generate</Button>
        </div>
      </CardContent></Card>

      {report && (
        <Card>
          <CardHeader><h3 className="font-semibold">Financial Report</h3></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(report.summary || {}).map(([key, value]) => (
                <div key={key} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(value as number)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}