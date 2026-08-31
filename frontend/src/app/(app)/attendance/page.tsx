'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { t } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAllWorkersQuery, useAllProjectsQuery, useDailyAttendanceQuery } from '@/lib/hooks';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'HALF_DAY', 'OVERTIME', 'LEAVE', 'HOLIDAY'] as const;

interface Attendance { id: number; workerId: number; workerName: string; workerMarathiName: string; status: string; }
interface Worker { id: number; name: string; marathiName: string; dailyWage: number; }

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState<number>(1);
  const [attendance, setAttendance] = useState<Map<number, string>>(new Map());
  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const { data: projectsData } = useAllProjectsQuery(true);
  const { data: workersData } = useAllWorkersQuery(true);
  const projects: any[] = (projectsData as any) || [];
  const workers: Worker[] = (workersData as any) || [];

  const { data: dailyData, isLoading: dailyLoading, isFetching: dailyFetching } = useDailyAttendanceQuery(projectId, date, true);

  // Sync server data into local optimistic Map when query resolves (placeholderData keeps previous)
  useEffect(() => {
    if (dailyData) {
      const map = new Map<number, string>();
      (dailyData as Attendance[]).forEach((a: Attendance) => map.set(a.workerId, a.status));
      // Only overwrite if not currently saving that worker (avoid clobbering optimistic)
      setAttendance((prev) => {
        // If user has optimistic changes pending (saving not empty), merge conservatively:
        // keep optimistic values for saving workers, update others from server
        if (saving.size > 0) {
          const merged = new Map(map);
          saving.forEach((wid) => {
            if (prev.has(wid)) merged.set(wid, prev.get(wid)!);
          });
          return merged;
        }
        return map;
      });
    }
  }, [dailyData]);

  // Initialize projectId from first project if available
  useEffect(() => {
    if (projects.length > 0 && !projects.find((p) => p.id === projectId)) {
      setProjectId(projects[0].id);
    }
  }, [projects]);

  const markAttendance = useCallback((workerId: number, status: string) => {
    const prevStatus = attendance.get(workerId);
    // Instant optimistic UI
    setAttendance((prev) => new Map(prev).set(workerId, status));
    setSaving((prev) => new Set(prev).add(workerId));
    setSaved((prev) => { const n = new Set(prev); n.delete(workerId); return n; });

    api.post('/attendance', { workerId, projectId, attendanceDate: date, status })
      .then(() => {
        // small Saved indicator
        setSaved((prev) => new Set(prev).add(workerId));
        setTimeout(() => {
          setSaved((prev) => { const n = new Set(prev); n.delete(workerId); return n; });
        }, 1500);
        // Invalidate shared attendance queries so monthly notebook reflects immediately (single source of truth)
        queryClient.invalidateQueries({ queryKey: ['attendance', 'notebook'] });
        queryClient.invalidateQueries({ queryKey: ['attendance', 'daily'] });
        // optional batch where safe: we keep single but query invalidation batches
      })
      .catch(() => {
        // Rollback on fail
        setAttendance((prev) => {
          const next = new Map(prev);
          if (prevStatus === undefined) next.delete(workerId);
          else next.set(workerId, prevStatus);
          return next;
        });
        toast.error(t('attendanceSaveError'));
      })
      .finally(() => {
        setSaving((prev) => { const n = new Set(prev); n.delete(workerId); return n; });
      });
  }, [attendance, projectId, date, queryClient]);

  const markAllPresent = useCallback(() => {
    const prevMap = new Map(attendance);
    // Optimistic: set all to PRESENT immediately
    const optimistic = new Map<number, string>();
    workers.forEach((w) => optimistic.set(w.id, 'PRESENT'));
    setAttendance(optimistic);
    // Mark all as saving for subtle indication but not blocking
    const allIds = new Set(workers.map((w) => w.id));
    setSaving(allIds);

    api.post('/attendance/all-present', null, { params: { projectId, date } })
      .then(() => {
        // Saved state for all
        setSaved(new Set(workers.map((w) => w.id)));
        setTimeout(() => setSaved(new Set()), 1500);
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        toast.success(t('allPresentSaved'));
      })
      .catch(() => {
        setAttendance(prevMap);
        toast.error(t('attendanceSaveError'));
      })
      .finally(() => {
        setSaving(new Set());
      });
  }, [attendance, workers, projectId, date, queryClient]);

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  };

  const presentCount = Array.from(attendance.values()).filter((s) => s === 'PRESENT' || s === 'OVERTIME').length;
  const absentCount = Array.from(attendance.values()).filter((s) => s === 'ABSENT').length;
  const halfDayCount = Array.from(attendance.values()).filter((s) => s === 'HALF_DAY').length;

  const isInitialLoading = (!workersData || !projectsData) && dailyLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('todayAttendance')}</h1>
          <p className="text-gray-500 text-sm">
            {workers.length} {t('totalWorkers')} | {presentCount} {t('present')} | {absentCount} {t('absent')} | {halfDayCount} {t('halfDay')}
            {dailyFetching && <span className="ml-2 inline-flex items-center text-xs text-indigo-500">● syncing</span>}
          </p>
        </div>
        <Button onClick={markAllPresent} variant="secondary" size="sm" icon={<CheckCircle size={16} />}>{t('markAllPresent')}</Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => changeDate(-1)}><ChevronLeft size={16} /></Button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
          <Button variant="ghost" size="sm" onClick={() => changeDate(1)}><ChevronRight size={16} /></Button>
        </div>
        <select value={projectId} onChange={(e) => setProjectId(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {isInitialLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {workers.length === 0 && <p className="text-sm text-gray-500 text-center py-8">{t('noWorkers')}</p>}
          {workers.map((worker, idx) => (
            <motion.div key={worker.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Card className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                      {worker.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate flex items-center gap-2">
                        {worker.name}
                        {saved.has(worker.id) && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-normal">{t('saved')}</span>}
                        {saving.has(worker.id) && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-normal animate-pulse">{t('saving')}</span>}
                      </p>
                      {worker.marathiName && <p className="text-sm text-gray-500 truncate">{worker.marathiName}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {STATUS_OPTIONS.map((status) => {
                      const isActive = attendance.get(worker.id) === status;
                      const isSaving = saving.has(worker.id);
                      return (
                        <button key={status} onClick={() => markAttendance(worker.id, status)}
                          aria-label={`${worker.name} ${status}`}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-150 ${
                            isActive
                              ? status === 'PRESENT' ? 'bg-emerald-500 text-white shadow-lg scale-105'
                                : status === 'ABSENT' ? 'bg-rose-500 text-white shadow-lg scale-105'
                                : status === 'HALF_DAY' ? 'bg-amber-500 text-white shadow-lg scale-105'
                                : status === 'OVERTIME' ? 'bg-blue-500 text-white shadow-lg scale-105'
                                : status === 'LEAVE' ? 'bg-purple-500 text-white shadow-lg scale-105'
                                : 'bg-indigo-500 text-white shadow-lg scale-105'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                          } ${isSaving ? 'opacity-90' : ''}`}>
                          {status === 'PRESENT' ? '✓' : status === 'ABSENT' ? 'X' : status === 'HALF_DAY' ? '½' : status === 'OVERTIME' ? 'OT' : status === 'LEAVE' ? 'L' : 'H'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
