'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'sonner';
import { Calendar, MapPin, Phone, FileText, IndianRupee, ArrowLeft, Plus, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    marathiName: '',
    clientPhone: '',
    siteAddress: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    contractAmount: '',
    description: '',
    notes: '',
    status: 'PLANNING',
  });
  const [advance, setAdvance] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    description: '',
    notes: '',
    referenceNumber: '',
    enabled: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.startDate) e.startDate = t('startDateRequired');
    if (form.contractAmount !== '' && parseFloat(form.contractAmount) < 0) e.contractAmount = t('contractAmountInvalid');
    if (form.startDate && form.endDate && form.endDate < form.startDate) e.endDate = t('endDateInvalid');
    if (advance.enabled) {
      if (!advance.amount || parseFloat(advance.amount) <= 0) e.advanceAmount = t('amountPositive');
      if (!advance.paymentDate) e.advanceDate = t('paymentDateRequired');
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const first = Object.values(e)[0];
      toast.error(first);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // allow empty name -> backend will fallback, but we also fallback here for preview
      let nameToSend: string | null = form.name.trim() || null;
      // if still null, backend will generate Untitled Project - date
      const payload: any = {
        name: nameToSend,
        marathiName: form.marathiName.trim() || null,
        clientPhone: form.clientPhone.trim() || null,
        siteAddress: form.siteAddress.trim() || null,
        startDate: form.startDate,
        endDate: form.endDate || null,
        contractAmount: parseFloat(form.contractAmount) || 0,
        description: form.description.trim() || null,
        notes: form.notes.trim() || null,
        status: form.status,
      };
      const res = await api.post('/projects', payload);
      const created = res.data;
      // if advance enabled and amount >0, create advance payment inline
      if (advance.enabled && advance.amount && parseFloat(advance.amount) > 0) {
        try {
          await api.post(`/projects/${created.id}/advance-payments`, {
            amount: parseFloat(advance.amount),
            paymentDate: advance.paymentDate,
            paymentMethod: advance.paymentMethod,
            description: advance.description.trim() || null,
            notes: advance.notes.trim() || null,
            referenceNumber: advance.referenceNumber.trim() || null,
          });
        } catch (advErr: any) {
          toast.error(advErr.response?.data?.detail || 'Advance failed, project created');
        }
      }
      toast.success(t('saved'));
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push(`/projects/${created.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || JSON.stringify(err.response?.data) || 'Error';
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  };

  const previewName = form.name.trim() || `${t('untitledProject')} - ${form.startDate || new Date().toISOString().split('T')[0]}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects"><Button variant="ghost" size="sm" icon={<ArrowLeft size={18} />}>Back</Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('addProject')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{previewName}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white"><FileText size={16} /></span>
            {t('projectDetails')}
          </h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input label={t('projectName')} placeholder={`${t('untitledProject')} Auto`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <p className="text-xs text-gray-400 mt-1">Optional — empty will auto create “{t('untitledProject')} - date”</p>
              </div>
              <Input label="मराठी नाव (Optional)" value={form.marathiName} onChange={(e) => setForm({ ...form, marathiName: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('clientMobile')} type="tel" icon={<Phone size={16} />} value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} />
              <Input label={t('site')} icon={<MapPin size={16} />} value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label={<span>{t('startDate')} <span className="text-rose-500">*</span></span> as any}
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  error={errors.startDate}
                  required
                />
              </div>
              <Input label={t('endDate')} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} error={errors.endDate} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('contractAmount')} type="number" min={0} step="0.01" icon={<IndianRupee size={16} />} value={form.contractAmount} onChange={(e) => setForm({ ...form, contractAmount: e.target.value })} error={errors.contractAmount} placeholder="0" />
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('status')}</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 text-sm">
                  <option value="PLANNING">{t('planning')}</option>
                  <option value="ACTIVE">{t('active2')}</option>
                  <option value="PAUSED">{t('paused')}</option>
                  <option value="COMPLETED">{t('completed')}</option>
                  <option value="CANCELLED">{t('cancelled')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('description')}</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Optional" />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('notes')}</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Optional" />
              </div>
            </div>

            {/* Advance Payment Section inline optional */}
            <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5 bg-gray-50/50 dark:bg-gray-800/30 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={advance.enabled} onChange={(e) => setAdvance({ ...advance, enabled: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2"><Wallet size={16} className="text-indigo-500" /> {t('advancePayment')} (Optional) - {t('addAdvancePayment')}</span>
              </label>
              {advance.enabled && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label={`${t('amount')} *`} type="number" min={0} step="0.01" icon={<IndianRupee size={16} />} value={advance.amount} onChange={(e) => setAdvance({ ...advance, amount: e.target.value })} error={errors.advanceAmount} required={advance.enabled} />
                    <Input label={`${t('paymentDate')} *`} type="date" value={advance.paymentDate} onChange={(e) => setAdvance({ ...advance, paymentDate: e.target.value })} error={errors.advanceDate} required={advance.enabled} />
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('paymentMethod')}</label>
                      <select value={advance.paymentMethod} onChange={(e) => setAdvance({ ...advance, paymentMethod: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500">
                        <option value="CASH">{t('cash')}</option>
                        <option value="UPI">{t('upi')}</option>
                        <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                        <option value="CHEQUE">{t('cheque')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label={t('description')} value={advance.description} onChange={(e) => setAdvance({ ...advance, description: e.target.value })} />
                    <Input label={t('referenceNumber')} value={advance.referenceNumber} onChange={(e) => setAdvance({ ...advance, referenceNumber: e.target.value })} />
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('notes')}</label>
                    <textarea value={advance.notes} onChange={(e) => setAdvance({ ...advance, notes: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="secondary" onClick={() => router.back()}>{t('cancel')}</Button>
              <Button type="submit" loading={loading} className="bg-gradient-to-r from-indigo-500 to-purple-600">{t('save')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
