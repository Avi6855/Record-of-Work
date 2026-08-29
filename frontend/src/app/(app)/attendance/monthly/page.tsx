'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { t } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { getStatusSymbol, getStatusColor } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';

interface Worker { id: number; name: string; marathiName: string; }

export default function MonthlyAttendancePage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [projectId, setProjectId] = useState(1);
  const [projects, setProjects] = useState<any[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [notebook, setNotebook] = useState<Record<string, Record<number, string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects', { params: { page: 0, size: 50 } }).then(res => setProjects(res.data.content)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/workers', { params: { page: 0, size: 100 } }).then(wRes => {
      setWorkers(wRes.data.content);
      return api.get('/attendance/notebook', { params: { projectId, year, month } });
    }).then(aRes => setNotebook(aRes.data)).catch(() => setNotebook({})).finally(() => setLoading(false));
  }, [projectId, year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('monthlyAttendance')}</h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></Button>
          <span className="font-medium">{new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <Button variant="ghost" size="sm" onClick={() => changeMonth(1)}><ChevronRight size={16} /></Button>
          <select value={projectId} onChange={(e) => setProjectId(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" /> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="sticky left-0 bg-white dark:bg-gray-900 p-3 text-left text-sm font-medium text-gray-500 z-10">{t('workers')}</th>
                {days.map((d) => {
                  const day = new Date(d).getDate();
                  const dayName = new Date(d).toLocaleDateString('en', { weekday: 'short' });
                  return <th key={d} className="p-2 text-center text-xs text-gray-500 min-w-[40px]"><div>{dayName}</div><div className="font-bold">{day}</div></th>;
                })}
              </tr></thead>
              <tbody>
                {workers.map((w, idx) => (
                  <motion.tr key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="sticky left-0 bg-white dark:bg-gray-900 p-3 z-10">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{w.name}</div>
                      {w.marathiName && <div className="text-xs text-gray-500">{w.marathiName}</div>}
                    </td>
                    {days.map((d) => {
                      const status = notebook[d]?.[w.id] || '';
                      return (
                        <td key={d} className="p-1 text-center">
                          <span className={`inline-block w-8 h-8 rounded-lg text-xs font-bold leading-8 ${
                            status === '✓' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : status === 'X' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                            : status === '½' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : status === 'OT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : status === 'L' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : ''
                          }`}>{status}</span>
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
