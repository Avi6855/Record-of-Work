'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { t } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getStatusSymbol, getStatusColor } from '@/lib/utils';
import { CalendarCheck, Users, CheckCircle, XCircle, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'HALF_DAY', 'OVERTIME', 'LEAVE', 'HOLIDAY'] as const;

interface Attendance { id: number; workerId: number; workerName: string; workerMarathiName: string; status: string; }
interface Worker { id: number; name: string; marathiName: string; dailyWage: number; }

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState<number>(1);
  const [projects, setProjects] = useState<any[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Map<number, string>>(new Map());
  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/projects', { params: { page: 0, size: 50 } }),
      api.get('/workers', { params: { page: 0, size: 100 } })
    ]).then(([pRes, wRes]) => {
      setProjects(pRes.data.content);
      setWorkers(wRes.data.content);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (projectId && date) {
      api.get('/attendance/daily', { params: { projectId, date } })
        .then(res => {
          const map = new Map<number, string>();
          res.data.forEach((a: Attendance) => map.set(a.workerId, a.status));
          setAttendance(map);
        }).catch(() => {});
    }
  }, [projectId, date]);

  const markAttendance = async (workerId: number, status: string) => {
    setSaving(prev => new Set(prev).add(workerId));
    try {
      await api.post('/attendance', { workerId, projectId, attendanceDate: date, status });
      setAttendance(prev => new Map(prev).set(workerId, status));
      toast.success('Saved ✓');
    } catch { toast.error('Error'); }
    finally { setSaving(prev => { const next = new Set(prev); next.delete(workerId); return next; }); }
  };

  const markAllPresent = async () => {
    try {
      await api.post('/attendance/all-present', null, { params: { projectId, date } });
      const map = new Map<number, string>();
      workers.forEach(w => map.set(w.id, 'PRESENT'));
      setAttendance(map);
      toast.success('All present');
    } catch { toast.error('Error'); }
  };

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  };

  const presentCount = Array.from(attendance.values()).filter(s => s === 'PRESENT' || s === 'OVERTIME').length;
  const absentCount = Array.from(attendance.values()).filter(s => s === 'ABSENT').length;
  const halfDayCount = Array.from(attendance.values()).filter(s => s === 'HALF_DAY').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('todayAttendance')}</h1>
          <p className="text-gray-500">{workers.length} {t('totalWorkers')} | {presentCount} {t('present')} | {absentCount} {t('absent')} | {halfDayCount} {t('halfDay')}</p>
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

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {workers.map((worker, idx) => (
            <motion.div key={worker.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {worker.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{worker.name}</p>
                      {worker.marathiName && <p className="text-sm text-gray-500">{worker.marathiName}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button key={status} onClick={() => markAttendance(worker.id, status)}
                        disabled={saving.has(worker.id)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                          attendance.get(worker.id) === status
                            ? status === 'PRESENT' ? 'bg-emerald-500 text-white shadow-lg'
                              : status === 'ABSENT' ? 'bg-rose-500 text-white shadow-lg'
                              : status === 'HALF_DAY' ? 'bg-amber-500 text-white shadow-lg'
                              : status === 'OVERTIME' ? 'bg-blue-500 text-white shadow-lg'
                              : status === 'LEAVE' ? 'bg-purple-500 text-white shadow-lg'
                              : 'bg-indigo-500 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}>
                        {status === 'PRESENT' ? '✓' : status === 'ABSENT' ? 'X' : status === 'HALF_DAY' ? '½' : status === 'OVERTIME' ? 'OT' : status === 'LEAVE' ? 'L' : 'H'}
                      </button>
                    ))}
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