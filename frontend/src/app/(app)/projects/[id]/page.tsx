'use client';
import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { t, formatCurrency, formatDate } from '@/lib/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Edit, Trash2, Users, IndianRupee, Wallet, TrendingDown, Plus, X, Calendar, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface AdvancePay { id: number; projectId: number; amount: number; paymentDate: string; paymentMethod: string; description?: string; notes?: string; referenceNumber?: string; isVoided: boolean; voidReason?: string; createdAt: string; updatedAt: string; }
interface WorkerLite { id: number; name: string; workType?: string; phone?: string; }
interface ProjectDetail {
  id: number; name: string; marathiName?: string; clientPhone?: string; siteAddress?: string; startDate?: string; endDate?: string;
  contractAmount: number; status: string; description?: string; notes?: string; organizationId: number;
  advanceTotal: number; remainingAmount: number; advancePayments: AdvancePay[]; workers: WorkerLite[]; client?: any;
  createdAt: string; updatedAt: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data as ProjectDetail;
    },
    enabled: !!id,
  });

  const { data: workersData } = useQuery({
    queryKey: ['workers', 'list-all'],
    queryFn: async () => {
      const res = await api.get('/workers', { params: { page: 0, size: 100 } });
      return (res.data.content || []) as WorkerLite[];
    },
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<AdvancePay | null>(null);
  const [advanceForm, setAdvanceForm] = useState({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'CASH', description: '', notes: '', referenceNumber: '' });
  const [workerSelect, setWorkerSelect] = useState<string>('');

  // sync edit form when project loads or edit opens
  const openEdit = () => {
    if (!project) return;
    setEditForm({
      name: project.name || '',
      marathiName: project.marathiName || '',
      clientPhone: project.clientPhone || '',
      siteAddress: project.siteAddress || '',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      contractAmount: String(project.contractAmount ?? ''),
      description: project.description || '',
      notes: project.notes || '',
      status: project.status || 'PLANNING',
    });
    setEditOpen(true);
  };

  const liveContract = useMemo(() => {
    if (editOpen && editForm) return parseFloat(editForm.contractAmount) || 0;
    return project ? Number(project.contractAmount) || 0 : 0;
  }, [project, editForm, editOpen]);

  const liveAdvanceTotal = useMemo(() => {
    if (!project) return 0;
    // sum non-voided advances
    return project.advancePayments?.filter(a => !a.isVoided).reduce((s, a) => s + Number(a.amount), 0) || 0;
  }, [project]);

  const liveRemaining = liveContract - liveAdvanceTotal;

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put(`/projects/${id}`, payload);
      return res.data as ProjectDetail;
    },
    onMutate: async (payload: any) => {
      await queryClient.cancelQueries({ queryKey: ['projects', id] });
      const prev = queryClient.getQueryData<ProjectDetail>(['projects', id]);
      if (prev) {
        queryClient.setQueryData<ProjectDetail>(['projects', id], { ...prev, ...payload, contractAmount: payload.contractAmount !== undefined ? payload.contractAmount : prev.contractAmount });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['projects', id], ctx.prev);
      toast.error('Update failed');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['projects', id], data);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('projectUpdated'));
      setEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { await api.delete(`/projects/${id}`); },
    onSuccess: () => {
      toast.success(t('projectDeleted'));
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/projects');
    },
    onError: () => toast.error('Delete failed'),
  });

  const assignMutation = useMutation({
    mutationFn: async (workerId: number) => {
      const res = await api.post(`/projects/${id}/workers/${workerId}`);
      return res.data as ProjectDetail;
    },
    onMutate: async (workerId: number) => {
      await queryClient.cancelQueries({ queryKey: ['projects', id] });
      const prev = queryClient.getQueryData<ProjectDetail>(['projects', id]);
      const worker = workersData?.find(w => w.id === workerId);
      if (prev && worker && !prev.workers.some(w => w.id === workerId)) {
        queryClient.setQueryData<ProjectDetail>(['projects', id], { ...prev, workers: [...prev.workers, worker] });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['projects', id], ctx.prev);
      toast.error('Assign failed');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['projects', id], data);
      toast.success(t('workerAssigned'));
      setWorkerSelect('');
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (workerId: number) => {
      const res = await api.delete(`/projects/${id}/workers/${workerId}`);
      return res.data as ProjectDetail;
    },
    onMutate: async (workerId: number) => {
      await queryClient.cancelQueries({ queryKey: ['projects', id] });
      const prev = queryClient.getQueryData<ProjectDetail>(['projects', id]);
      if (prev) {
        queryClient.setQueryData<ProjectDetail>(['projects', id], { ...prev, workers: prev.workers.filter(w => w.id !== workerId) });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['projects', id], ctx.prev);
      toast.error('Remove failed');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['projects', id], data);
      toast.success(t('workerRemoved'));
    },
  });

  const addAdvanceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/projects/${id}/advance-payments`, payload);
      return res.data as AdvancePay;
    },
    onMutate: async (payload: any) => {
      await queryClient.cancelQueries({ queryKey: ['projects', id] });
      const prev = queryClient.getQueryData<ProjectDetail>(['projects', id]);
      const optimistic: AdvancePay = { id: Date.now(), projectId: Number(id), amount: payload.amount, paymentDate: payload.paymentDate, paymentMethod: payload.paymentMethod, description: payload.description, notes: payload.notes, referenceNumber: payload.referenceNumber, isVoided: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any;
      if (prev) {
        queryClient.setQueryData<ProjectDetail>(['projects', id], { ...prev, advancePayments: [optimistic, ...prev.advancePayments], advanceTotal: Number(prev.advanceTotal) + Number(payload.amount), remainingAmount: Number(prev.contractAmount) - (Number(prev.advanceTotal) + Number(payload.amount)) });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['projects', id], ctx.prev);
      toast.error('Add advance failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      toast.success(t('advanceAdded'));
      setAdvanceModalOpen(false);
      setEditingAdvance(null);
    },
  });

  const updateAdvanceMutation = useMutation({
    mutationFn: async ({ advId, payload }: { advId: number; payload: any }) => {
      const res = await api.put(`/projects/${id}/advance-payments/${advId}`, payload);
      return res.data as AdvancePay;
    },
    onMutate: async ({ advId, payload }: any) => {
      await queryClient.cancelQueries({ queryKey: ['projects', id] });
      const prev = queryClient.getQueryData<ProjectDetail>(['projects', id]);
      if (prev) {
        const updatedPayments = prev.advancePayments.map(a => a.id === advId ? { ...a, ...payload, amount: payload.amount ?? a.amount, paymentDate: payload.paymentDate ?? a.paymentDate } : a);
        const newTotal = updatedPayments.filter(a => !a.isVoided).reduce((s, a) => s + Number(a.amount), 0);
        queryClient.setQueryData<ProjectDetail>(['projects', id], { ...prev, advancePayments: updatedPayments, advanceTotal: newTotal, remainingAmount: Number(prev.contractAmount) - newTotal });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['projects', id], ctx.prev);
      toast.error('Update advance failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      toast.success(t('advanceUpdated'));
      setAdvanceModalOpen(false);
      setEditingAdvance(null);
    },
  });

  const voidAdvanceMutation = useMutation({
    mutationFn: async (advId: number) => {
      await api.delete(`/projects/${id}/advance-payments/${advId}`);
    },
    onMutate: async (advId: number) => {
      await queryClient.cancelQueries({ queryKey: ['projects', id] });
      const prev = queryClient.getQueryData<ProjectDetail>(['projects', id]);
      if (prev) {
        const upd = prev.advancePayments.map(a => a.id === advId ? { ...a, isVoided: true } : a);
        const newTotal = upd.filter(a => !a.isVoided).reduce((s, a) => s + Number(a.amount), 0);
        queryClient.setQueryData<ProjectDetail>(['projects', id], { ...prev, advancePayments: upd, advanceTotal: newTotal, remainingAmount: Number(prev.contractAmount) - newTotal });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['projects', id], ctx.prev);
      toast.error('Void failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      toast.success(t('advanceVoidedMsg'));
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.startDate) { toast.error(t('startDateRequired')); return; }
    if (editForm.contractAmount !== '' && parseFloat(editForm.contractAmount) < 0) { toast.error(t('contractAmountInvalid')); return; }
    if (editForm.startDate && editForm.endDate && editForm.endDate < editForm.startDate) { toast.error(t('endDateInvalid')); return; }
    const payload: any = {
      name: editForm.name.trim() || null, // allow empty, backend will fallback if empty?
      marathiName: editForm.marathiName.trim() || null,
      clientPhone: editForm.clientPhone.trim() || null,
      siteAddress: editForm.siteAddress.trim() || null,
      startDate: editForm.startDate || null,
      endDate: editForm.endDate || null,
      contractAmount: parseFloat(editForm.contractAmount) || 0,
      description: editForm.description.trim() || null,
      notes: editForm.notes.trim() || null,
      status: editForm.status,
    };
    // if name empty, keep backend to generate untitled? But we allow empty -> will fallback. If we send null, backend may treat as no update. So if empty we should generate fallback or send Untitled
    if (!payload.name) {
      payload.name = `${t('untitledProject')} - ${payload.startDate || new Date().toISOString().split('T')[0]}`;
    }
    updateMutation.mutate(payload);
  };

  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceForm.amount || parseFloat(advanceForm.amount) <= 0) { toast.error(t('amountPositive')); return; }
    if (!advanceForm.paymentDate) { toast.error(t('paymentDateRequired')); return; }
    const payload = {
      amount: parseFloat(advanceForm.amount),
      paymentDate: advanceForm.paymentDate,
      paymentMethod: advanceForm.paymentMethod,
      description: advanceForm.description.trim() || null,
      notes: advanceForm.notes.trim() || null,
      referenceNumber: advanceForm.referenceNumber.trim() || null,
    };
    if (editingAdvance) {
      updateAdvanceMutation.mutate({ advId: editingAdvance.id, payload });
    } else {
      addAdvanceMutation.mutate(payload);
    }
  };

  const openAddAdvance = () => {
    setEditingAdvance(null);
    setAdvanceForm({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'CASH', description: '', notes: '', referenceNumber: '' });
    setAdvanceModalOpen(true);
  };
  const openEditAdvance = (adv: AdvancePay) => {
    setEditingAdvance(adv);
    setAdvanceForm({
      amount: String(adv.amount),
      paymentDate: adv.paymentDate ? adv.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: adv.paymentMethod || 'CASH',
      description: adv.description || '',
      notes: adv.notes || '',
      referenceNumber: adv.referenceNumber || '',
    });
    setAdvanceModalOpen(true);
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />;
  if (!project) return <div className="text-center py-12 text-gray-500">{t('noProjects')}</div>;

  const availableWorkers = workersData?.filter(w => !project.workers.some(pw => pw.id === w.id)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects"><Button variant="ghost" size="sm" icon={<ArrowLeft size={18} />}>Back</Button></Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              <Badge variant={project.status === 'ACTIVE' ? 'success' : project.status === 'COMPLETED' ? 'info' : 'warning'}>{project.status}</Badge>
            </div>
            {project.marathiName && <p className="text-gray-500">{project.marathiName}</p>}
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
              {project.startDate && <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(project.startDate)} {project.endDate ? `→ ${formatDate(project.endDate)}` : ''}</span>}
              {project.siteAddress && <span className="flex items-center gap-1"><MapPin size={14} /> {project.siteAddress}</span>}
              {project.clientPhone && <span className="flex items-center gap-1"><Phone size={14} /> {project.clientPhone}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Edit size={16} />} onClick={openEdit}>{t('edit')}</Button>
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => { if (confirm(t('confirmDeleteProject'))) deleteMutation.mutate(); }} loading={deleteMutation.isPending}>{t('delete')}</Button>
        </div>
      </div>

      {/* Financial 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-600" />
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500 flex items-center gap-2"><span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"><IndianRupee size={16} /></span> {t('contractAmount')} / करार रक्कम</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(project.contractAmount)}</p>
            <p className="text-xs text-gray-400">Contract Amount</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500 flex items-center gap-2"><span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600"><Wallet size={16} /></span> {t('advancePayment')} / कामाची उचल</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(liveAdvanceTotal)}</p>
            <p className="text-xs text-gray-400">{t('totalAdvancePayment')} • {project.advancePayments?.filter(a=>!a.isVoided).length || 0} records</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500 flex items-center gap-2"><span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><TrendingDown size={16} /></span> {t('remainingContract')} / शिल्लक करार रक्कम</p>
            <p className={`text-2xl font-bold ${liveRemaining < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatCurrency(liveRemaining)}</p>
            <p className="text-xs text-gray-400">Remaining = Contract - {formatCurrency(liveAdvanceTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Workers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <h3 className="font-semibold flex items-center gap-2"><Users size={18} className="text-indigo-500" /> {t('assignedWorkers')} ({project.workers.length})</h3>
          <div className="flex items-center gap-2">
            <select value={workerSelect} onChange={(e) => setWorkerSelect(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm min-w-[180px]">
              <option value="">{t('selectWorker')}</option>
              {availableWorkers.map(w => <option key={w.id} value={w.id}>{w.name} {w.phone ? `(${w.phone})` : ''}</option>)}
            </select>
            <Button size="sm" icon={<Plus size={16} />} onClick={() => { if (workerSelect) assignMutation.mutate(Number(workerSelect)); }} loading={assignMutation.isPending} disabled={!workerSelect}>{t('assignWorker')}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {project.workers.length === 0 ? (
            <p className="text-sm text-gray-400">{t('noWorkers')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {project.workers.map((w: any) => (
                <span key={w.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                  {w.name}
                  <button onClick={() => unassignMutation.mutate(w.id)} className="p-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advance Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <h3 className="font-semibold flex items-center gap-2"><Wallet size={18} className="text-amber-500" /> {t('advancePaymentsHistory')} • {t('advancePayment')} (कामाची उचल)</h3>
          <Button size="sm" icon={<Plus size={16} />} onClick={openAddAdvance} className="bg-gradient-to-r from-amber-500 to-orange-500">{t('addAdvancePayment')}</Button>
        </CardHeader>
        <CardContent>
          {!project.advancePayments || project.advancePayments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Wallet size={32} className="mx-auto mb-2 opacity-50" />
              <p>{t('noAdvancePayments')}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={openAddAdvance}>{t('addAdvancePayment')}</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 px-2">{t('date')}</th>
                    <th className="py-2 px-2">{t('amount')}</th>
                    <th className="py-2 px-2">{t('paymentMethod')}</th>
                    <th className="py-2 px-2">{t('description')}</th>
                    <th className="py-2 px-2">{t('referenceNumber')}</th>
                    <th className="py-2 px-2">{t('status')}</th>
                    <th className="py-2 px-2 text-right">{t('edit')}/{t('void')}</th>
                  </tr>
                </thead>
                <tbody>
                  {project.advancePayments.map((a) => (
                    <tr key={a.id} className={`border-b border-gray-50 dark:border-gray-800/50 ${a.isVoided ? 'opacity-50 bg-gray-50 dark:bg-gray-800/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
                      <td className="py-3 px-2 whitespace-nowrap">{a.paymentDate ? formatDate(a.paymentDate) : '-'}</td>
                      <td className="py-3 px-2 font-semibold whitespace-nowrap">{formatCurrency(a.amount)}</td>
                      <td className="py-3 px-2"><Badge variant="info">{a.paymentMethod}</Badge></td>
                      <td className="py-3 px-2 max-w-[200px] truncate" title={a.description || ''}>{a.description || '-'}</td>
                      <td className="py-3 px-2">{a.referenceNumber || '-'}</td>
                      <td className="py-3 px-2">{a.isVoided ? <Badge variant="danger">{t('voided')}</Badge> : <Badge variant="success">{t('active')}</Badge>}</td>
                      <td className="py-3 px-2 text-right space-x-1">
                        {!a.isVoided && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openEditAdvance(a)}>{t('edit')}</Button>
                            <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600" onClick={() => { if (confirm(t('confirmVoid'))) voidAdvanceMutation.mutate(a.id); }}>{t('void')}</Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold bg-gray-50 dark:bg-gray-800/50">
                    <td className="py-2 px-2">{t('totalAdvancePayment')}</td>
                    <td className="py-2 px-2">{formatCurrency(liveAdvanceTotal)}</td>
                    <td colSpan={5} className="py-2 px-2 text-right text-gray-500">{t('remainingContract')}: {formatCurrency(liveRemaining)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h3 className="font-semibold">{t('projectDetails')}</h3></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">{t('projectName')}</span><span className="font-medium">{project.name}</span></div>
            {project.marathiName && <div className="flex justify-between"><span className="text-gray-500">मराठी नाव</span><span className="font-medium">{project.marathiName}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">{t('clientMobile')}</span><span className="font-medium">{project.clientPhone || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('site')}</span><span className="font-medium">{project.siteAddress || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('startDate')}</span><span className="font-medium">{project.startDate ? formatDate(project.startDate) : '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('endDate')}</span><span className="font-medium">{project.endDate ? formatDate(project.endDate) : '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('status')}</span><Badge variant="info">{project.status}</Badge></div>
            {project.description && <div className="pt-2 border-t border-gray-100 dark:border-gray-800"><p className="text-gray-600 dark:text-gray-300">{project.description}</p></div>}
            {project.notes && <div className="pt-2"><p className="text-xs text-gray-500">{t('notes')}: {project.notes}</p></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="font-semibold">{t('financialSummary')}</h3></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">{t('contractAmount')}</span><span className="font-bold">{formatCurrency(project.contractAmount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('advancePayment')}</span><span className="font-bold text-amber-600">{formatCurrency(liveAdvanceTotal)}</span></div>
            <div className="border-t pt-3 flex justify-between text-lg"><span className="font-semibold">{t('remainingContract')}</span><span className={`font-bold ${liveRemaining < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatCurrency(liveRemaining)}</span></div>
            <p className="text-xs text-gray-400">Formula: {t('remainingContract')} = {t('contractAmount')} - {t('advancePayment')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={`${t('editProject')} - ${project.name}`} size="lg">
        {editForm && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('projectName')} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder={`${t('untitledProject')} Auto`} />
              <Input label="मराठी नाव" value={editForm.marathiName} onChange={(e) => setEditForm({ ...editForm, marathiName: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('clientMobile')} value={editForm.clientPhone} onChange={(e) => setEditForm({ ...editForm, clientPhone: e.target.value })} />
              <Input label={t('site')} value={editForm.siteAddress} onChange={(e) => setEditForm({ ...editForm, siteAddress: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={<span>{t('startDate')} <span className="text-rose-500">*</span></span> as any} type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} required />
              <Input label={t('endDate')} type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('contractAmount')} type="number" min={0} step="0.01" value={editForm.contractAmount} onChange={(e) => setEditForm({ ...editForm, contractAmount: e.target.value })} />
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('status')}</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  <option value="PLANNING">{t('planning')}</option>
                  <option value="ACTIVE">{t('active2')}</option>
                  <option value="PAUSED">{t('paused')}</option>
                  <option value="COMPLETED">{t('completed')}</option>
                  <option value="CANCELLED">{t('cancelled')}</option>
                </select>
              </div>
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('description')}</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('notes')}</label>
              <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-sm flex justify-between">
              <span className="text-gray-500">{t('remainingContract')} Preview:</span>
              <span className="font-bold">{formatCurrency((parseFloat(editForm.contractAmount) || 0) - liveAdvanceTotal)}</span>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" loading={updateMutation.isPending}>{t('update')}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Advance Add/Edit Modal */}
      <Modal isOpen={advanceModalOpen} onClose={() => { setAdvanceModalOpen(false); setEditingAdvance(null); }} title={editingAdvance ? t('editAdvancePayment') : t('addAdvancePayment')} size="md">
        <form onSubmit={handleAdvanceSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={`${t('amount')} *`} type="number" min={0} step="0.01" value={advanceForm.amount} onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })} required />
            <Input label={`${t('paymentDate')} *`} type="date" value={advanceForm.paymentDate} onChange={(e) => setAdvanceForm({ ...advanceForm, paymentDate: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('paymentMethod')}</label>
              <select value={advanceForm.paymentMethod} onChange={(e) => setAdvanceForm({ ...advanceForm, paymentMethod: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                <option value="CASH">{t('cash')}</option>
                <option value="UPI">{t('upi')}</option>
                <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                <option value="CHEQUE">{t('cheque')}</option>
              </select>
            </div>
            <Input label={t('referenceNumber')} value={advanceForm.referenceNumber} onChange={(e) => setAdvanceForm({ ...advanceForm, referenceNumber: e.target.value })} />
          </div>
          <Input label={t('description')} value={advanceForm.description} onChange={(e) => setAdvanceForm({ ...advanceForm, description: e.target.value })} />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('notes')}</label>
            <textarea value={advanceForm.notes} onChange={(e) => setAdvanceForm({ ...advanceForm, notes: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => { setAdvanceModalOpen(false); setEditingAdvance(null); }}>{t('cancel')}</Button>
            <Button type="submit" loading={addAdvanceMutation.isPending || updateAdvanceMutation.isPending}>{editingAdvance ? t('update') : t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
