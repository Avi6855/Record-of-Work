'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { t } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'sonner';

export default function NewWorkerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', marathiName: '', phone: '', address: '', village: '', workType: '', skill: '', dailyWage: '', overtimeRate: '', joiningDate: '', notes: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/workers', { ...form, dailyWage: parseFloat(form.dailyWage) || 0, overtimeRate: parseFloat(form.overtimeRate) || 0 });
      toast.success(t('saved'));
      router.push('/workers');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
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
              <Input label={t('workerName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label={t('workerMarathiName')} value={form.marathiName} onChange={(e) => setForm({ ...form, marathiName: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('phone')} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label={t('village')} value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} />
            </div>
            <Input label={t('address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('workType')} value={form.workType} onChange={(e) => setForm({ ...form, workType: e.target.value })} />
              <Input label={t('skill')} value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('dailyWage')} type="number" value={form.dailyWage} onChange={(e) => setForm({ ...form, dailyWage: e.target.value })} required />
              <Input label={t('overtimeRate')} type="number" value={form.overtimeRate} onChange={(e) => setForm({ ...form, overtimeRate: e.target.value })} />
            </div>
            <Input label={t('joiningDate')} type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
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
