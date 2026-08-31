'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PageResponse } from '@/lib/api';
import { t, formatCurrency, formatDate, WORK_TYPE_PRESETS, getWorkTypeLabel } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Phone, MapPin, Calendar, Briefcase, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Worker { id: number; name: string; marathiName: string; phone: string; address: string; village: string; workType: string; skill: string; dailyWage: number; overtimeRate: number; joiningDate: string; isActive: boolean; outstandingBalance: number; totalAdvance: number; totalPayment: number; notes: string; }

const WORK_TYPE_VALUES = WORK_TYPE_PRESETS.map(p => p.value);

export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: worker, isLoading } = useQuery({
    queryKey: ['workers', id],
    queryFn: async () => {
      const res = await api.get(`/workers/${id}`);
      return res.data as Worker;
    },
    enabled: !!id,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (worker && !form) {
      const isPreset = worker.workType ? (WORK_TYPE_VALUES as string[]).includes(worker.workType) : true;
      setForm({
        name: worker.name || '',
        marathiName: worker.marathiName || '',
        phone: worker.phone || '',
        address: worker.address || '',
        village: worker.village || '',
        workType: isPreset ? (worker.workType || '') : '__custom',
        customWorkType: isPreset ? (worker.workType === 'Other' ? '' : '') : (worker.workType || ''),
        // If Other with custom, we treat customWorkType separate; but when workType is custom free text, workType=__custom
        skill: worker.skill || '',
        dailyWage: String(worker.dailyWage ?? ''),
        overtimeRate: String(worker.overtimeRate ?? ''),
        joiningDate: worker.joiningDate ? worker.joiningDate.split('T')[0] : '',
        isActive: worker.isActive,
        notes: worker.notes || '',
      });
      // Handle case where workType is Other but custom hidden: fallback
      if (worker.workType && !isPreset) {
        setForm((prev: any) => ({ ...prev, workType: '__custom', customWorkType: worker.workType }));
      }
    }
  }, [worker]);

  // Keep form synced when worker reloads (after mutation)
  useEffect(() => {
    if (worker && editOpen === false) {
      const isPreset = worker.workType ? (WORK_TYPE_VALUES as string[]).includes(worker.workType) : true;
      if (!isPreset && worker.workType) {
        setForm((prev: any) => prev ? { ...prev, workType: '__custom', customWorkType: worker.workType } : prev);
      }
    }
  }, [worker, editOpen]);

  const selectValue = form ? (form.workType === '' ? '' : (WORK_TYPE_VALUES as string[]).includes(form.workType) ? form.workType : '__custom') : '';
  const showCustomInput = selectValue === '__custom' || form?.workType === 'Other';

  const resolvedWorkType = (): string | null => {
    if (!form) return null;
    if (selectValue === '__custom') return form.customWorkType?.trim() || null;
    if (form.workType === 'Other') return form.customWorkType?.trim() || 'Other';
    if (form.workType) return form.workType;
    return null;
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put(`/workers/${id}`, payload);
      return res.data as Worker;
    },
    onMutate: async (payload: any) => {
      await queryClient.cancelQueries({ queryKey: ['workers', id] });
      await queryClient.cancelQueries({ queryKey: ['workers'] });
      const prevDetail = queryClient.getQueryData<Worker>(['workers', id]);
      const prevLists = queryClient.getQueriesData<PageResponse<Worker>>({ queryKey: ['workers'] });
      // Optimistic detail
      if (prevDetail) {
        queryClient.setQueryData<Worker>(['workers', id], (old) => ({ ...old!, ...payload, workType: payload.workType, name: payload.name, marathiName: payload.marathiName }));
      }
      // Optimistic lists
      prevLists.forEach(([key, val]) => {
        if (val) {
          queryClient.setQueryData<PageResponse<Worker>>(key, (old) => {
            if (!old) return old;
            return { ...old, content: old.content.map((w: Worker) => w.id === Number(id) ? { ...w, ...payload } : w) };
          });
        }
      });
      return { prevDetail, prevLists };
    },
    onError: (err: any, _vars, ctx: any) => {
      if (ctx?.prevDetail) queryClient.setQueryData(['workers', id], ctx.prevDetail);
      if (ctx?.prevLists) {
        ctx.prevLists.forEach(([key, val]: any) => queryClient.setQueryData(key, val));
      }
      const detail = err?.response?.data?.detail || err?.response?.data?.message || '';
      toast.error(detail ? `Update failed: ${detail} / अपडेट अयशस्वी: ${detail}` : 'Update failed / अपडेट अयशस्वी');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['workers', id], data);
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success(t('saved'));
      setEditOpen(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['workers', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/workers/${id}`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['workers'] });
      const prevLists = queryClient.getQueriesData<PageResponse<Worker>>({ queryKey: ['workers'] });
      prevLists.forEach(([key, val]) => {
        if (val) {
          queryClient.setQueryData<PageResponse<Worker>>(key, (old) => {
            if (!old) return old;
            return { ...old, content: old.content.filter((w) => String(w.id) !== String(id)) };
          });
        }
      });
      return { prevLists };
    },
    onError: (err: any, _vars, ctx: any) => {
      if (ctx?.prevLists) ctx.prevLists.forEach(([key, val]: any) => queryClient.setQueryData(key, val));
      const detail = err?.response?.data?.detail || err?.response?.data?.message || '';
      toast.error(detail ? `Delete failed: ${detail} / हटवण्यात त्रुटी: ${detail}` : 'Delete failed / हटवण्यात त्रुटी');
    },
    onSuccess: () => {
      toast.success(t('saved'));
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      router.push('/workers');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await api.put(`/workers/${id}`, { isActive });
      return res.data;
    },
    onMutate: async (isActive: boolean) => {
      await queryClient.cancelQueries({ queryKey: ['workers', id] });
      const prev = queryClient.getQueryData<Worker>(['workers', id]);
      if (prev) queryClient.setQueryData<Worker>(['workers', id], { ...prev, isActive });
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['workers', id], ctx.prev);
      toast.error('Status update failed');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['workers', id], data);
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success(t('saved'));
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('नाव आवश्यक आहे'); return; }
    updateMutation.mutate({
      name: form.name.trim(),
      marathiName: form.marathiName.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      village: form.village.trim() || null,
      workType: resolvedWorkType(),
      skill: form.skill.trim() || null,
      dailyWage: parseFloat(form.dailyWage) || 0,
      overtimeRate: parseFloat(form.overtimeRate) || 0,
      joiningDate: form.joiningDate || null,
      isActive: form.isActive,
      notes: form.notes.trim() || null,
    });
  };

  const handleDelete = () => {
    if (!confirm(`${worker?.name} - ${t('delete')}? ${t('confirm')}`)) return;
    deleteMutation.mutate();
  };

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" /></div>;
  if (!worker) return <div className="text-center py-12 text-gray-500">Worker not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/workers"><Button variant="ghost" size="sm" icon={<ArrowLeft size={18} />}>Back</Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">{worker.name} <Badge variant={worker.isActive ? 'success' : 'danger'}>{worker.isActive ? t('active') : t('inactive')}</Badge></h1>
            {worker.marathiName && <p className="text-gray-500">{worker.marathiName}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Edit size={16} />} onClick={() => setEditOpen(true)}>{t('edit')}</Button>
          <Button variant="secondary" onClick={() => toggleActiveMutation.mutate(!worker.isActive)} loading={toggleActiveMutation.isPending}>{worker.isActive ? t('inactive') : t('active')}</Button>
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDelete} loading={deleteMutation.isPending}>{t('delete')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h3 className="font-semibold">Personal Information</h3></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3"><Phone size={16} className="text-gray-400" /><span>{worker.phone || '-'}</span></div>
            <div className="flex items-center gap-3"><MapPin size={16} className="text-gray-400" /><span>{worker.village || worker.address || '-'}</span></div>
            {worker.address && worker.village && <div className="flex items-center gap-3"><MapPin size={16} className="text-gray-400" /><span className="text-sm text-gray-600 dark:text-gray-300">{worker.address}</span></div>}
            <div className="flex items-center gap-3"><Briefcase size={16} className="text-gray-400" /><span className="inline-flex px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">{getWorkTypeLabel(worker.workType)}</span><span className="text-sm text-gray-500">{worker.skill || ''}</span></div>
            <div className="flex items-center gap-3"><Calendar size={16} className="text-gray-400" /><span>{worker.joiningDate ? formatDate(worker.joiningDate) : '-'}</span></div>
            {worker.notes && <div className="pt-2 border-t border-gray-100 dark:border-gray-800"><p className="text-sm text-gray-600 dark:text-gray-300">{worker.notes}</p></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="font-semibold">Financial Summary</h3></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">{t('dailyWage')}</span><span className="font-medium">{formatCurrency(worker.dailyWage)}</span></div>
            {worker.overtimeRate !== undefined && <div className="flex justify-between"><span className="text-gray-500">{t('overtimeRate')}</span><span className="font-medium">{formatCurrency(worker.overtimeRate)}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">{t('totalAdvances')}</span><span className="font-medium text-amber-500">{formatCurrency(worker.totalAdvance)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('totalPayments')}</span><span className="font-medium text-emerald-500">{formatCurrency(worker.totalPayment)}</span></div>
            <div className="border-t pt-3 flex justify-between"><span className="font-semibold">{t('balance')}</span><span className={`font-bold ${(worker.outstandingBalance || 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(worker.outstandingBalance || 0)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={`${t('edit')} - ${worker.name}`} size="lg">
        {form && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={`${t('workerName')} *`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label={t('workerMarathiName')} value={form.marathiName} onChange={(e) => setForm({ ...form, marathiName: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('phone')} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label={t('village')} value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} />
            </div>
            <Input label={t('address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('workType')}</label>
                <select
                  value={selectValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') setForm({ ...form, workType: '', customWorkType: '' });
                    else if (v === '__custom') setForm({ ...form, workType: '__custom', customWorkType: form.workType && !(WORK_TYPE_VALUES as string[]).includes(form.workType) ? form.workType : '' });
                    else setForm({ ...form, workType: v, customWorkType: '' });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">{t('selectWorkType')}</option>
                  {WORK_TYPE_PRESETS.map(p => (
                    <option key={p.value} value={p.value}>{t(p.labelKey)} / {p.value}</option>
                  ))}
                  <option value="__custom">{t('workTypeCustom')} / Custom</option>
                </select>
                {showCustomInput && (
                  <input
                    type="text"
                    placeholder={t('workTypeCustom')}
                    value={form.customWorkType}
                    onChange={(e) => setForm({ ...form, customWorkType: e.target.value })}
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>
              <Input label={t('skill')} value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={`${t('dailyWage')} *`} type="number" value={form.dailyWage} onChange={(e) => setForm({ ...form, dailyWage: e.target.value })} required />
              <Input label={t('overtimeRate')} type="number" value={form.overtimeRate} onChange={(e) => setForm({ ...form, overtimeRate: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('joiningDate')} type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('status')}</label>
                <select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="active">{t('active')}</option>
                  <option value="inactive">{t('inactive')}</option>
                </select>
              </div>
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('notes')}</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" loading={updateMutation.isPending}>{t('update')}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
