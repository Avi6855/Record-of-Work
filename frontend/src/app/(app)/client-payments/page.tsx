'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { t, formatCurrency, formatDate } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { IndianRupee, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ClientPayment { id: number; clientName: string; projectName: string; amount: number; paymentDate: string; paymentMethod: string; description: string; isVoided: boolean; }

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({ clientId: '', projectId: '', amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'CASH', description: '' });

  useEffect(() => {
    Promise.all([
      api.get('/client-payments', { params: { page: 0, size: 50 } }),
      api.get('/clients', { params: { page: 0, size: 50 } }),
      api.get('/projects', { params: { page: 0, size: 50 } })
    ]).then(([pRes, cRes, prRes]) => { setPayments(pRes.data.content); setClients(cRes.data.content); setProjects(prRes.data.content); })
    .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/client-payments', { ...form, clientId: Number(form.clientId), projectId: Number(form.projectId), amount: parseFloat(form.amount) });
      toast.success(t('saved'));
      setShowModal(false);
      const res = await api.get('/client-payments', { params: { page: 0, size: 50 } });
      setPayments(res.data.content);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('clientPayments')}</h1>
        <Button onClick={() => setShowModal(true)} icon={<Plus size={18} />}>{t('add')}</Button>
      </div>

      {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div> : (
        <div className="space-y-3">
          {payments.filter(p => !p.isVoided).map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{p.clientName}</p>
                  <p className="text-sm text-gray-500">{p.projectName} | {formatDate(p.paymentDate)} | {p.paymentMethod}</p>
                </div>
                <p className="text-lg font-bold text-emerald-500">{formatCurrency(p.amount)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('clientPayments')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('client')}</label>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" required>
              <option value="">Select Client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('projects')}</label>
            <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" required>
              <option value="">Select Project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <Input label={t('amount')} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Input label={t('date')} type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} required />
          <Input label={t('description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>{t('cancel')}</Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
