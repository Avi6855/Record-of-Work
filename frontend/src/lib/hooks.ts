import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PageResponse } from './api';

// Debounced value hook - prevents API spam on every keystroke
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Debounced callback
export function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay = 400) {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]);
}

// Master data hooks with aggressive caching - staleTime 5min
export function useWorkersQuery(page = 0, size = 20, search?: string) {
  const debouncedSearch = useDebouncedValue(search || '', 400);
  return useQuery({
    queryKey: ['workers', page, size, debouncedSearch],
    queryFn: async () => {
      const res = await api.get<PageResponse<any>>('/workers', { params: { page, size, search: debouncedSearch || undefined } });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useAllWorkersQuery(enabled = true) {
  return useQuery({
    queryKey: ['workers', 'all'],
    queryFn: async () => {
      const res = await api.get<PageResponse<any>>('/workers', { params: { page: 0, size: 100 } });
      return res.data.content || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useProjectsQuery(page = 0, size = 50, search?: string) {
  const debouncedSearch = useDebouncedValue(search || '', 400);
  return useQuery({
    queryKey: ['projects', page, size, debouncedSearch],
    queryFn: async () => {
      const res = await api.get<PageResponse<any>>('/projects', { params: { page, size, search: debouncedSearch || undefined } });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useAllProjectsQuery(enabled = true) {
  return useQuery({
    queryKey: ['projects', 'all'],
    queryFn: async () => {
      const res = await api.get<PageResponse<any>>('/projects', { params: { page: 0, size: 100 } });
      return res.data.content || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useDailyAttendanceQuery(projectId: number, date: string, enabled = true) {
  return useQuery({
    queryKey: ['attendance', 'daily', projectId, date],
    queryFn: async () => {
      const res = await api.get('/attendance/daily', { params: { projectId, date } });
      return res.data as any[];
    },
    enabled: enabled && !!projectId && !!date,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useNotebookQuery(projectId: number, year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: ['attendance', 'notebook', projectId, year, month],
    queryFn: async () => {
      const res = await api.get('/attendance/notebook', { params: { projectId, year, month } });
      return res.data as Record<string, Record<string, string>>;
    },
    enabled: enabled && !!projectId && !!year && !!month,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export interface WageRow {
  workerId: number;
  workerName: string;
  marathiName?: string;
  workType?: string;
  village?: string;
  dailyWage: number;
  overtimeRate: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  overtimeHours: number;
  grossWage: number;
  totalAdvance: number;
  totalPayment: number;
  remainingBalance: number;
}

export function useLedgerQuery(workerId: number | null) {
  return useQuery({
    queryKey: ['ledger', 'worker', workerId],
    queryFn: async () => {
      const res = await api.get(`/ledger/worker/${workerId}`);
      return res.data as { entries: any[]; totalDebit: number; totalCredit: number; currentBalance: number };
    },
    enabled: !!workerId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useDailyClosingQuery(closingDate: string | null) {
  return useQuery({
    queryKey: ['daily-closing', closingDate],
    queryFn: async () => {
      const res = await api.get(`/daily-closing/${closingDate}`);
      return res.data;
    },
    enabled: !!closingDate,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useReportsSummaryQuery(startDate: string | null, endDate: string | null, enabled = false) {
  return useQuery({
    queryKey: ['reports', 'summary', startDate, endDate],
    queryFn: async () => {
      const res = await api.get('/reports/summary', { params: { startDate, endDate } });
      return res.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useWagesQuery(year: number, month: number) {
  return useQuery({
    queryKey: ['wages', year, month],
    queryFn: async () => {
      // Prefer bulk /wages, fallback to /reports/monthly-settlement for compat
      try {
        const res = await api.get('/wages', { params: { year, month } });
        // /wages returns { year, month, wages: [...] }
        if (res.data?.wages) return res.data.wages as WageRow[];
        if (Array.isArray(res.data)) return res.data as WageRow[];
        return res.data.wages as WageRow[];
      } catch {
        const res = await api.get('/reports/monthly-settlement', { params: { year, month } });
        const settlements = res.data?.settlements || res.data?.content || [];
        // normalize settlements -> WageRow
        return settlements.map((s: any) => ({
          workerId: s.workerId,
          workerName: s.workerName,
          marathiName: s.marathiName,
          workType: s.workType,
          village: s.village,
          dailyWage: s.dailyWage ?? 0,
          overtimeRate: s.overtimeRate ?? 0,
          presentDays: s.presentDays ?? 0,
          halfDays: s.halfDays ?? 0,
          absentDays: s.absentDays ?? 0,
          overtimeHours: s.overtimeHours ?? 0,
          grossWage: s.grossWage ?? 0,
          totalAdvance: s.totalAdvance ?? 0,
          totalPayment: s.totalPayment ?? 0,
          remainingBalance: s.remainingBalance ?? 0,
        })) as WageRow[];
      }
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
