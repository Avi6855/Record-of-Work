'use client';
import { useState } from 'react';
import { t } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { useAllProjectsQuery, useAllWorkersQuery, useNotebookQuery } from '@/lib/hooks';

export default function MonthlyAttendancePage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [projectId, setProjectId] = useState(1);

  const { data: projectsData } = useAllProjectsQuery(true);
  const projects: any[] = (projectsData as any) || [];

  const { data: workersData, isLoading: workersLoading } = useAllWorkersQuery(true);
  const workers: any[] = (workersData as any) || [];

  // Single source of truth: notebook derived from same Attendance table as daily
  const { data: notebookData, isLoading: notebookLoading, isFetching } = useNotebookQuery(projectId, year, month, true);
  const notebook: Record<string, Record<string, string>> = (notebookData as any) || {};

  // Thin skeleton only for grid, header always visible - not full page block
  const isGridLoading = workersLoading || notebookLoading;

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('monthlyAttendance')}</h1>
          {isFetching && <span className="text-xs text-indigo-500 animate-pulse">{t('saving')}</span>}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></Button>
          <span className="font-medium text-sm bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">{new Date(year, month - 1).toLocaleString('mr-IN', { month: 'long', year: 'numeric' })}</span>
          <Button variant="ghost" size="sm" onClick={() => changeMonth(1)}><ChevronRight size={16} /></Button>
          <select value={projectId} onChange={(e) => setProjectId(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="sticky left-0 bg-white dark:bg-gray-900 p-3 text-left text-sm font-medium text-gray-500 z-10 min-w-[160px]">{t('workers')}</th>
              {days.map((d) => {
                const day = new Date(d).getDate();
                const dayName = new Date(d).toLocaleDateString('mr-IN', { weekday: 'short' });
                return <th key={d} className="p-2 text-center text-xs text-gray-500 min-w-[40px]"><div>{dayName}</div><div className="font-bold">{day}</div></th>;
              })}
            </tr></thead>
            <tbody>
              {isGridLoading ? (
                // Thin skeleton rows - not full page block
                [...Array(4)].map((_, idx) => (
                  <tr key={idx} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="sticky left-0 bg-white dark:bg-gray-900 p-3"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                    {days.map((d) => <td key={d} className="p-1 text-center"><div className="w-8 h-8 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" /></td>)}
                  </tr>
                ))
              ) : workers.length === 0 ? (
                <tr><td colSpan={days.length + 1} className="p-8 text-center text-sm text-gray-500">{t('noWorkers')}</td></tr>
              ) : (
                workers.map((w: any, idx: number) => (
                  <motion.tr key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.015 }} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="sticky left-0 bg-white dark:bg-gray-900 p-3 z-10">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{w.name}</div>
                      {w.marathiName && <div className="text-xs text-gray-500">{w.marathiName}</div>}
                    </td>
                    {days.map((d) => {
                      // notebook keys are string workerId, support both string and number
                      const status = notebook[d]?.[String(w.id)] ?? notebook[d]?.[w.id] ?? '';
                      return (
                        <td key={d} className="p-1 text-center">
                          <span className={`inline-block w-8 h-8 rounded-lg text-xs font-bold leading-8 transition-all ${
                            status === '✓' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : status === 'X' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                            : status === '½' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : status === 'OT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : status === 'L' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : status === 'H' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                            : 'text-gray-300'
                          }`}>{status}</span>
                        </td>
                      );
                    })}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-gray-400">* मासिक हजेरी ही दैनिक हजेरीच्या त्याच तक्त्यातून (Attendance) तयार होते — दैनिक बदल लगेच मासिकमध्ये दिसतात.</p>
    </div>
  );
}
