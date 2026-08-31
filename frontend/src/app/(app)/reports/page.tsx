'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { t, formatCurrency } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BarChart3, TrendingUp, Wallet, Receipt, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      if (!startDate || !endDate) throw new Error('तारीख निवडा / Select dates');
      if (startDate > endDate) throw new Error('सुरुवातीची तारीख शेवटच्या तारखेपेक्षा मोठी असू शकत नाही');
      const res = await api.get('/reports/summary', { params: { startDate, endDate } });
      return res.data;
    },
    onSuccess: (data) => {
      setReport(data);
      const empty = (data.totalPayments ?? 0) === 0 && (data.totalAdvances ?? 0) === 0 && (data.totalExpenses ?? 0) === 0 && (data.totalWages ?? 0) === 0 && (data.totalIncome ?? 0) === 0;
      if (empty) {
        toast('या कालावधीसाठी डेटा नाही / No data for selected period', { description: `${data.startDate} → ${data.endDate}` });
      } else {
        toast.success('अहवाल तयार झाला ✓');
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || 'अहवाल त्रुटी';
      toast.error(String(msg));
      setReport(null);
    },
  });

  const generateReport = () => mutation.mutate({ startDate, endDate });

  const empty = report && (report.totalPayments ?? 0) === 0 && (report.totalAdvances ?? 0) === 0 && (report.totalExpenses ?? 0) === 0 && (report.totalWages ?? 0) === 0 && (report.totalIncome ?? 0) === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <BarChart3 size={22} className="text-indigo-600" />
        {t('reports')}
      </h1>

      <Card><CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div><label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">{t('startDate')}</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">{t('endDate')}</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500" /></div>
          <Button onClick={generateReport} loading={mutation.isPending} icon={<BarChart3 size={16} />}>Generate / तयार करा</Button>
        </div>
      </CardContent></Card>

      {mutation.isPending && (
        <Card><CardContent className="p-8 text-center text-gray-500">लोड होत आहे...</CardContent></Card>
      )}

      {report && !mutation.isPending && (
        <>
          {empty ? (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="p-8 text-center">
              <p className="text-amber-700 dark:text-amber-300 font-medium">या कालावधीसाठी डेटा उपलब्ध नाही</p>
              <p className="text-sm text-gray-500 mt-1">{report.startDate} → {report.endDate} दरम्यान कोणतेही व्यवहार नाहीत / No transactions in selected period.</p>
            </CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><TrendingUp size={18} /> Financial Report / आर्थिक अहवाल <span className="text-xs font-normal text-gray-500">({report.startDate} → {report.endDate})</span></h3></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                      <p className="text-xs text-gray-500">Wages / मजुरी</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(report.totalWages)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                      <p className="text-xs text-gray-500">Advances / उचल</p>
                      <p className="text-lg font-bold text-amber-600">{formatCurrency(report.totalAdvances)}</p>
                      <p className="text-xs text-gray-400">{report.advanceCount ?? 0} entries</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                      <p className="text-xs text-gray-500">Payments / पेमेंट</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(report.totalPayments)}</p>
                      <p className="text-xs text-gray-400">{report.paymentCount ?? 0} entries</p>
                    </div>
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900">
                      <p className="text-xs text-gray-500">Expenses / खर्च</p>
                      <p className="text-lg font-bold text-rose-600">{formatCurrency(report.totalExpenses)}</p>
                      <p className="text-xs text-gray-400">{report.expenseCount ?? 0} entries</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
                      <p className="text-xs text-gray-500">Income / उत्पन्न</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(report.totalIncome)}</p>
                    </div>
                  </div>

                  {(report.netCash !== undefined) && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Net Cash / निव्वळ</span>
                      <span className={`text-lg font-bold ${Number(report.netCash) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(report.netCash)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><h4 className="font-medium text-gray-900 dark:text-white">Summary Details / तपशील</h4></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-500">Present / उपस्थित</p><p className="font-bold">{report.presentCount ?? '-'}</p></div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-500">Half Day / अर्धा दिवस</p><p className="font-bold">{report.halfDayCount ?? '-'}</p></div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-500">Absent / अनुपस्थित</p><p className="font-bold">{report.absentCount ?? '-'}</p></div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-500">Workers with attendance</p><p className="font-bold">{report.workersWithAttendance ?? '-'}</p></div>
                  </div>
                  {report.summary && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(report.summary).map(([key, value]) => (
                        <div key={key} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                          <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{typeof value === 'number' ? formatCurrency(value) : String(value)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {!report && !mutation.isPending && (
        <Card><CardContent className="p-8 text-center text-gray-500">Generate वर क्लिक करून अहवाल पहा / Click Generate to view report.</CardContent></Card>
      )}
    </div>
  );
}
