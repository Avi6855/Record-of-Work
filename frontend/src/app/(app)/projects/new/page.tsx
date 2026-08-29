'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', marathiName: '', clientPhone: '', siteAddress: '', startDate: '', endDate: '', contractAmount: '', description: '', notes: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/projects', { ...form, contractAmount: parseFloat(form.contractAmount) || 0 });
      toast.success(t('saved'));
      router.push('/projects');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('addProject')}</h1>
      <Card><CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('projectName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="मराठी नाव" value={form.marathiName} onChange={(e) => setForm({ ...form, marathiName: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('clientMobile')} value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} />
            <Input label={t('contractAmount')} type="number" value={form.contractAmount} onChange={(e) => setForm({ ...form, contractAmount: e.target.value })} />
          </div>
          <Input label={t('site')} value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('startDate')} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label={t('endDate')} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => router.back()}>{t('cancel')}</Button>
            <Button type="submit" loading={loading}>{t('save')}</Button>
          </div>
        </form>
      </CardContent></Card>
    </div>
  );
}
