'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PageResponse } from '@/lib/api';
import { t, formatCurrency, formatDate } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { IndianRupee, Plus, Search, Edit, Trash2, Eye, ArrowUpDown, Calendar, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useAllWorkersQuery, useAllProjectsQuery, useDebouncedValue } from '@/lib/hooks';

interface Advance {
  id: number; workerId: number; workerName: string; workerMarathiName?: string;
  projectId?: number; projectName?: string;
  amount: number; advanceDate: string; paymentMethod: string; reason?: string; notes?: string;
  isSettled?: boolean; settledAmount?: number; isVoided: boolean; status?: string;
  createdBy?: number; voidedBy?: number; voidReason?: string; voidedAt?: string;
  createdAt: string; updatedAt?: string;
}

type SortKey = 'date' | 'amount' | 'worker';

export default function AdvancesPage() {
  const queryClient = useQueryClient();
  const [page] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showVoided, setShowVoided] = useState(false);
  const [selected, setSelected] = useState<Advance | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Advance | null>(null);
  const [form, setForm] = useState({ workerId: '', projectId: '', amount: '', advanceDate: new Date().toISOString().split('T')[0], paymentMethod: 'CASH', reason: '', notes: '' });

  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['advances', page, 50],
    queryFn: async () => {
      const res = await api.get<PageResponse<Advance>>('/advances', { params: { page, size: 50 } });
      return res.data;
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: workers = [] } = useAllWorkersQuery();
  const { data: projects = [] } = useAllProjectsQuery();

  const rawAdvances: Advance[] = useMemo(() => data?.content || [], [data]);

  const filteredAndSorted = useMemo(() => {
    let list = [...rawAdvances];
    if (!showVoided) list = list.filter(a => !a.isVoided);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(a =>
        (a.workerName || '').toLowerCase().includes(q) ||
        (a.workerMarathiName || '').toLowerCase().includes(q) ||
        (a.reason || '').toLowerCase().includes(q) ||
        (a.notes || '').toLowerCase().includes(q) ||
        (a.projectName || '').toLowerCase().includes(q) ||
        String(a.amount).includes(q) ||
        (a.paymentMethod || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.advanceDate).getTime() - new Date(b.advanceDate).getTime();
      else if (sortBy === 'amount') cmp = Number(a.amount) - Number(b.amount);
      else if (sortBy === 'worker') cmp = (a.workerName || '').localeCompare(b.workerName || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [rawAdvances, debouncedSearch, sortBy, sortDir, showVoided]);

  const openDetail = (a: Advance) => { setSelected(a); setDetailOpen(true); };
  const openEdit = (a: Advance) => {
    setEditing(a);
    setForm({
      workerId: String(a.workerId || ''),
      projectId: a.projectId ? String(a.projectId) : '',
      amount: String(a.amount),
      advanceDate: a.advanceDate ? a.advanceDate.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: a.paymentMethod || 'CASH',
      reason: a.reason || '',
      notes: a.notes || '',
    });
    setShowModal(true);
    setDetailOpen(false);
  };
  const openCreate = () => {
    setEditing(null);
    setForm({ workerId: '', projectId: '', amount: '', advanceDate: new Date().toISOString().split('T')[0], paymentMethod: 'CASH', reason: '', notes: '' });
    setShowModal(true);
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/advances', payload);
      return res.data as Advance;
    },
    onMutate: async (payload: any) => {
      await queryClient.cancelQueries({ queryKey: ['advances'] });
      const prev = queryClient.getQueryData<PageResponse<Advance>>(['advances', page, 50]);
      const optimistic: Advance = {
        id: Date.now(), workerId: payload.workerId, workerName: workers.find((w:any)=>String(w.id)===String(payload.workerId))?.name || payload.workerId,
        workerMarathiName: workers.find((w:any)=>String(w.id)===String(payload.workerId))?.marathiName || '',
        projectId: payload.projectId || undefined, projectName: payload.projectId ? projects.find((p:any)=>String(p.id)===String(payload.projectId))?.name : undefined,
        amount: payload.amount, advanceDate: payload.advanceDate, paymentMethod: payload.paymentMethod, reason: payload.reason, notes: payload.notes,
        isVoided: false, status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as Advance;
      if (prev) {
        queryClient.setQueryData<PageResponse<Advance>>(['advances', page, 50], { ...prev, content: [optimistic, ...prev.content], totalElements: prev.totalElements + 1 });
      }
      return { prev };
    },
    onError: (_err, _v, ctx:any) => { if(ctx?.prev) queryClient.setQueryData(['advances', page, 50], ctx.prev); toast.error('Create failed'); },
    onSuccess: (data) => {
      toast.success(t('saved'));
      setShowModal(false);
      // replace optimistic with real
      queryClient.invalidateQueries({ queryKey: ['advances'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.put(`/advances/${id}`, payload);
      return res.data as Advance;
    },
    onMutate: async ({ id, payload }: any) => {
      await queryClient.cancelQueries({ queryKey: ['advances'] });
      const prev = queryClient.getQueryData<PageResponse<Advance>>(['advances', page, 50]);
      if (prev) {
        const workerName = workers.find((w:any)=>String(w.id)===String(payload.workerId))?.name || payload.workerId;
        const workerMarathiName = workers.find((w:any)=>String(w.id)===String(payload.workerId))?.marathiName || '';
        const projectName = payload.projectId ? projects.find((p:any)=>String(p.id)===String(payload.projectId))?.name : undefined;
        queryClient.setQueryData<PageResponse<Advance>>(['advances', page, 50], {
          ...prev,
          content: prev.content.map(a => a.id === id ? { ...a, ...payload, workerName, workerMarathiName, projectName, projectId: payload.projectId || null, amount: payload.amount } : a),
        });
        // also update selected
        if (selected && selected.id === id) {
          setSelected(s => s ? { ...s, ...payload, workerName, workerMarathiName, projectName } : s);
        }
      }
      return { prev };
    },
    onError: (_err, _v, ctx:any) => { if(ctx?.prev) queryClient.setQueryData(['advances', page, 50], ctx.prev); toast.error('Update failed'); },
    onSuccess: () => { toast.success(t('editSuccess')); setShowModal(false); setEditing(null); queryClient.invalidateQueries({ queryKey: ['advances'] }); },
  });

  const voidMutation = useMutation({
    mutationFn: async (id: number) => { await api.put(`/advances/${id}/void`, null, { params: { reason: 'Voided by user' } }); return id; },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['advances'] });
      const prev = queryClient.getQueryData<PageResponse<Advance>>(['advances', page, 50]);
      if (prev) {
        queryClient.setQueryData<PageResponse<Advance>>(['advances', page, 50], {
          ...prev,
          content: prev.content.map(a => a.id === id ? { ...a, isVoided: true, status: 'VOIDED', voidedAt: new Date().toISOString() } : a),
        });
        if (selected && selected.id === id) setSelected(s => s ? { ...s, isVoided: true, status: 'VOIDED' } : s);
      }
      return { prev };
    },
    onError: (_err, _v, ctx:any) => { if(ctx?.prev) queryClient.setQueryData(['advances', page, 50], ctx.prev); toast.error('Void failed'); },
    onSuccess: () => { toast.success(t('voidSuccess')); setDetailOpen(false); queryClient.invalidateQueries({ queryKey: ['advances'] }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.workerId || !form.amount || !form.advanceDate) { toast.error(t('amountRequired')); return; }
    const payload: any = {
      workerId: Number(form.workerId),
      projectId: form.projectId ? Number(form.projectId) : null,
      amount: parseFloat(form.amount),
      advanceDate: form.advanceDate,
      paymentMethod: form.paymentMethod,
      reason: form.reason?.trim() || null,
      notes: form.notes?.trim() || null,
    };
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  const handleVoid = (a: Advance) => {
    if (!confirm(`${t('confirmVoid')} #${a.id}?`)) return;
    voidMutation.mutate(a.id);
  };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><span className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Wallet size={18}/></span>{t('advances')} • उचल {isFetching && <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse inline-block"/>}</h1>
          <p className="text-sm text-gray-500 mt-1">{filteredAndSorted.length} / {rawAdvances.length} records • {t('totalAdvances')}</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={18}/> } className="bg-gradient-to-r from-amber-500 to-orange-600">{t('addAdvance')}</Button>
      </div>

      {/* Search / Filter / Sort */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input type="text" placeholder={`${t('search')} worker, reason घरखर्च, project...`} value={searchInput} onChange={(e)=>setSearchInput(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-amber-500"/>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
              <button onClick={()=>toggleSort('date')} className={`px-3 py-2 flex items-center gap-1 ${sortBy==='date' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700' : 'bg-white dark:bg-gray-800'}`}><Calendar size={14}/>{t('sortByDate')} {sortBy==='date' && <ArrowUpDown size={12}/>}</button>
              <button onClick={()=>toggleSort('amount')} className={`px-3 py-2 flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 ${sortBy==='amount' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700' : 'bg-white dark:bg-gray-800'}`}><IndianRupee size={14}/>{t('sortByAmount')}</button>
              <button onClick={()=>toggleSort('worker')} className={`px-3 py-2 flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 ${sortBy==='worker' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700' : 'bg-white dark:bg-gray-800'}`}>{t('sortByWorker')}</button>
            </div>
            <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer">
              <input type="checkbox" checked={showVoided} onChange={(e)=>setShowVoided(e.target.checked)} className="rounded"/>{t('showVoided')}
            </label>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-3">{[...Array(4)].map((_,i)=><div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"/> )}</div>
      ) : filteredAndSorted.length === 0 ? (
        <Card className="p-12 text-center">
          <Wallet size={40} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500">{t('noResults')} • {t('noData')}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={openCreate}>{t('addAdvance')}</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSorted.map((a)=>(
            <Card key={a.id} className={`p-4 hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer overflow-hidden relative ${a.isVoided?'opacity-60':''}`} hover>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"/>
              <div onClick={()=>openDetail(a)} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{a.workerName} {a.workerMarathiName && <span className="text-gray-500 font-normal">• {a.workerMarathiName}</span>}</p>
                    <p className="text-xs text-gray-500 flex flex-wrap gap-2 items-center"><span className="inline-flex items-center gap-1"><Calendar size={12}/>{formatDate(a.advanceDate)}</span> <Badge variant={a.paymentMethod==='CASH'?'warning':'info'}>{a.paymentMethod || 'CASH'}</Badge> {a.projectName && <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">{a.projectName}</span>} {a.isVoided && <Badge variant="danger">{t('voided')}</Badge>}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(a.amount)}</p>
                    <p className="text-xs text-gray-400">ID #{a.id}</p>
                  </div>
                </div>
                {(a.reason || a.notes) && (
                  <div className="text-sm">
                    {a.reason && <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-500">{t('reason')}:</span> {a.reason} <span className="text-gray-400">({a.reason==='घरखर्च'?'घरखर्च':a.reason})</span></p>}
                    {a.notes && <p className="text-xs text-gray-400 truncate">{a.notes}</p>}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" size="sm" onClick={()=>openDetail(a)} icon={<Eye size={14}/>}>{t('view')}</Button>
                {!a.isVoided && (
                  <>
                    <Button variant="ghost" size="sm" onClick={()=>openEdit(a)} icon={<Edit size={14}/>}>{t('edit')}</Button>
                    <Button variant="ghost" size="sm" className="text-rose-500" onClick={()=>handleVoid(a)} icon={<Trash2 size={14}/>} loading={voidMutation.isPending}>{t('void')}</Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal - Complete fields */}
      <Modal isOpen={detailOpen} onClose={()=>setDetailOpen(false)} title={`${t('transactionDetail')} #${selected?.id ?? ''} • ${t('advances')}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Field label={t('transactionIdLabel')} value={`#${selected.id}`} />
              <Field label={t('statusLabel')} value={selected.isVoided ? t('voided') : t('active')} badge={selected.isVoided?'danger':'success'} />
              <Field label={`${t('workerName')} / ${t('workers')}`} value={selected.workerName} />
              <Field label={t('workerNameMarathi')} value={selected.workerMarathiName || '-'} />
              <Field label={`${t('project')} / ${t('projectName')}`} value={selected.projectName || '-'} />
              <Field label={t('date')} value={formatDate(selected.advanceDate)} />
              <Field label={t('amount')} value={formatCurrency(selected.amount)} strong />
              <Field label={t('paymentMethod')} value={selected.paymentMethod || 'CASH'} />
              <Field label={t('reason')} value={selected.reason || '-'} />
              <Field label={t('description')} value={selected.notes || '-'} />
              <Field label={t('notes')} value={selected.notes || '-'} />
              <Field label={t('createdBy')} value={selected.createdBy ? `User #${selected.createdBy}` : '-'} />
              <Field label={t('createdAt')} value={selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '-'} />
              <Field label={t('updatedAt')} value={selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : '-'} />
              {selected.isVoided && <><Field label="Void Reason" value={selected.voidReason || '-'} /><Field label="Voided At" value={selected.voidedAt ? new Date(selected.voidedAt).toLocaleString() : '-'} /></>}
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button variant="secondary" onClick={()=>setDetailOpen(false)}>{t('cancel')}</Button>
              {!selected.isVoided && <>
                <Button variant="secondary" onClick={()=>openEdit(selected)} icon={<Edit size={16}/>}>{t('edit')}</Button>
                <Button variant="danger" onClick={()=>handleVoid(selected)} icon={<Trash2 size={16}/>}>{t('void')}</Button>
              </>}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={()=>{setShowModal(false); setEditing(null);}} title={editing ? `${t('edit')} #${editing.id}` : t('addAdvance')} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('workers')} *</label>
            <select value={form.workerId} onChange={(e)=>setForm({...form, workerId:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" required>
              <option value="">Select Worker</option>
              {workers.map((w:any)=><option key={w.id} value={w.id}>{w.name} {w.marathiName?`• ${w.marathiName}`:''} {w.phone?`(${w.phone})`:''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('projects')} ({t('project')})</label>
            <select value={form.projectId} onChange={(e)=>setForm({...form, projectId:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <option value="">General (No Project)</option>
              {projects.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={`${t('amount')} *`} type="number" step="0.01" value={form.amount} onChange={(e)=>setForm({...form, amount:e.target.value})} required />
            <Input label={`${t('date')} *`} type="date" value={form.advanceDate} onChange={(e)=>setForm({...form, advanceDate:e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('paymentMethod')}</label>
            <select value={form.paymentMethod} onChange={(e)=>setForm({...form, paymentMethod:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <option value="CASH">{t('cash')} (Cash)</option>
              <option value="UPI">{t('upi')}</option>
              <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
              <option value="CHEQUE">{t('cheque')}</option>
            </select>
          </div>
          <Input label={`${t('reason')} (घरखर्च etc)`} value={form.reason} onChange={(e)=>setForm({...form, reason:e.target.value})} placeholder="घरखर्च" />
          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5">{t('notes')}</label>
            <textarea value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" placeholder="Optional notes" />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={()=>{setShowModal(false); setEditing(null);}}>{t('cancel')}</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editing? t('update') : t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({ label, value, strong, badge }: { label: string; value: string; strong?: boolean; badge?: 'success'|'danger'|'info'|undefined }) {
  return (
    <div className="space-y-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
      <p className="text-xs text-gray-500">{label}</p>
      {badge ? <Badge variant={badge}>{value}</Badge> : <p className={`text-sm ${strong?'font-bold text-amber-600 text-base':''} text-gray-900 dark:text-white break-words`}>{value}</p>}
    </div>
  );
}
