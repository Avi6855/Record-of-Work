'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { t, WORK_TYPE_PRESETS } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'sonner';

const WORK_TYPE_VALUES = WORK_TYPE_PRESETS.map(p => p.value);

export default function NewWorkerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', marathiName: '', phone: '', address: '', village: '',
    workType: '', customWorkType: '', skill: '', dailyWage: '', overtimeRate: '', joiningDate: '',
    isActive: true, notes: ''
  });

  const selectValue = form.workType === '' ? '' : (WORK_TYPE_VALUES as string[]).includes(form.workType) ? form.workType : '__custom';
  const showCustomInput = selectValue === '__custom' || form.workType === 'Other';

  const resolvedWorkType = (): string | null => {
    if (selectValue === '__custom') return form.customWorkType.trim() || null;
    if (form.workType === 'Other') return form.customWorkType.trim() || 'Other';
    if (form.workType) return form.workType;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('नाव आवश्यक आहे / Name required'); return; }
    setLoading(true);
    try {
      await api.post('/workers', {
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
      toast.success(t('saved'));
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      router.push('/workers');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('addWorker')}</h1>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="button" variant="secondary" onClick={() => router.back()}>{t('cancel')}</Button>
              <Button type="submit" loading={loading}>{t('save')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
