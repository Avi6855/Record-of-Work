'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { t, formatCurrency, formatDate } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { IndianRupee, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Payment { id: number; workerName: string; amount: number; paymentDate: string; paymentMethod: string; paymentType: string; description: string; isVoided: boolean; }

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);
  const [form, setForm] = useState({ workerId: '', amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'CASH', paymentType: 'WAGE_PAYMENT', description: '' });

  useEffect(() => {
    Promise.all([
      api.get('/payments', { params: { page: 0, size: 50 } }),
      api.get('/workers', { params: { page: 0, size: 100 } })
    ]).then(([pRes, wRes]) => { setPayments(pRes.data.content); setWorkers(wRes.data.content); })
    .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/payments', { ...form, workerId: Number(form.workerId), amount: parseFloat(form.amount) });
      toast.success(t('paymentRecorded'));
      setShowModal(false);
      const res = await api.get('/payments', { params: { page: 0, size: 50 } });
      setPayments(res.data.content);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('workerPayments')}</h1>
        <Button onClick={() => setShowModal(true)} icon={<Plus size={18} />}>{t('recordPayment')}</Button>
      </div>

      {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div> : (
        <div className="space-y-3">
          {payments.filter(p => !p.isVoided).map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{p.workerName}</p>
                  <p className="text-sm text-gray-500">{formatDate(p.paymentDate)} | {p.paymentMethod} | {p.paymentType}</p>
                  {p.description && <p className="text-sm text-gray-400">{p.description}</p>}
                </div>
                <p className="text-lg font-bold text-emerald-500">{formatCurrency(p.amount)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('recordPayment')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('workers')}</label>
            <select value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" required>
              <option value="">Select Worker</option>
              {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <Input label={t('amount')} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Input label={t('date')} type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('paymentMethod')}</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <option value="CASH">{t('cash')}</option>
              <option value="UPI">{t('upi')}</option>
              <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
              <option value="CHEQUE">{t('cheque')}</option>
            </select>
          </div>
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