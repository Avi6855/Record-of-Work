'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { t, formatCurrency, formatDate } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Receipt, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['MACHINE', 'MATERIAL', 'FUEL', 'TRANSPORT', 'FOOD', 'LABOUR', 'TOOLS', 'ELECTRICITY', 'MAINTENANCE', 'RENT', 'OTHER'];

interface Expense { id: number; category: string; amount: number; expenseDate: string; description: string; vendor: string; projectName: string; paymentMethod: string; isVoided: boolean; }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({ projectId: '', category: 'MATERIAL', amount: '', expenseDate: new Date().toISOString().split('T')[0], description: '', vendor: '', paymentMethod: 'CASH' });

  useEffect(() => {
    Promise.all([
      api.get('/expenses', { params: { page: 0, size: 50 } }),
      api.get('/projects', { params: { page: 0, size: 50 } })
    ]).then(([eRes, pRes]) => { setExpenses(eRes.data.content); setProjects(pRes.data.content); })
    .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', { ...form, projectId: form.projectId ? Number(form.projectId) : null, amount: parseFloat(form.amount) });
      toast.success(t('saved'));
      setShowModal(false);
      const res = await api.get('/expenses', { params: { page: 0, size: 50 } });
      setExpenses(res.data.content);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('expenses')}</h1>
        <Button onClick={() => setShowModal(true)} icon={<Plus size={18} />}>{t('addExpense')}</Button>
      </div>

      {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div> : (
        <div className="space-y-3">
          {expenses.filter(e => !e.isVoided).map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{e.description}</p>
                  <p className="text-sm text-gray-500">{formatDate(e.expenseDate)} | {e.category} | {e.paymentMethod}</p>
                  {e.vendor && <p className="text-sm text-gray-400">{e.vendor}</p>}
                  {e.projectName && <p className="text-sm text-blue-500">{e.projectName}</p>}
                </div>
                <p className="text-lg font-bold text-rose-500">{formatCurrency(e.amount)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('addExpense')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('projects')}</label>
            <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <option value="">General</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label={t('amount')} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Input label={t('date')} type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} required />
          <Input label={t('description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Input label="Vendor" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>{t('cancel')}</Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}