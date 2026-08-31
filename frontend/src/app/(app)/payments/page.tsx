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
import { IndianRupee, Plus, Search, Edit, Trash2, Eye, ArrowUpDown, Calendar, CreditCard, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useAllWorkersQuery, useAllProjectsQuery, useDebouncedValue } from '@/lib/hooks';

interface Payment {
  id: number; workerId: number; workerName: string; workerMarathiName?: string;
  projectId?: number; projectName?: string;
  amount: number; paymentDate: string; paymentMethod: string; paymentType: string;
  description?: string; notes?: string; referenceNumber?: string;
  isVoided: boolean; status?: string; createdBy?: number; voidedBy?: number; voidReason?: string; voidedAt?: string;
  createdAt: string; updatedAt?: string;
}

type SortKey = 'date' | 'amount' | 'worker';
type FilterType = 'ALL' | 'WAGE_PAYMENT' | 'ADVANCE_PAYMENT' | 'FINAL_SETTLEMENT' | 'PARTIAL_PAYMENT';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [page] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<FilterType>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [showVoided, setShowVoided] = useState(false);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [form, setForm] = useState({ workerId:'', projectId:'', amount:'', paymentDate:new Date().toISOString().split('T')[0], paymentMethod:'CASH', paymentType:'WAGE_PAYMENT', referenceNumber:'', description:'', notes:'' });

  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['payments', page, 50],
    queryFn: async () => {
      const res = await api.get<PageResponse<Payment>>('/payments', { params: { page, size: 50 } });
      return res.data;
    },
    staleTime: 60*1000,
    placeholderData: (prev)=>prev,
  });

  const { data: workers=[] } = useAllWorkersQuery();
  const { data: projects=[] } = useAllProjectsQuery();

  const raw: Payment[] = useMemo(()=>data?.content||[], [data]);

  const filtered = useMemo(()=>{
    let list=[...raw];
    if(!showVoided) list=list.filter(p=>!p.isVoided);
    if(typeFilter!=='ALL') list=list.filter(p=>p.paymentType===typeFilter);
    if(methodFilter!=='ALL') list=list.filter(p=>p.paymentMethod===methodFilter);
    if(debouncedSearch){
      const q=debouncedSearch.toLowerCase();
      list=list.filter(p=>
        (p.workerName||'').toLowerCase().includes(q) ||
        (p.workerMarathiName||'').toLowerCase().includes(q) ||
        (p.description||'').toLowerCase().includes(q) ||
        (p.notes||'').toLowerCase().includes(q) ||
        (p.referenceNumber||'').toLowerCase().includes(q) ||
        (p.projectName||'').toLowerCase().includes(q) ||
        String(p.amount).includes(q)
      );
    }
    list.sort((a,b)=>{
      let cmp=0;
      if(sortBy==='date') cmp=new Date(a.paymentDate).getTime()-new Date(b.paymentDate).getTime();
      else if(sortBy==='amount') cmp=Number(a.amount)-Number(b.amount);
      else cmp=(a.workerName||'').localeCompare(b.workerName||'');
      return sortDir==='asc'?cmp:-cmp;
    });
    return list;
  },[raw, debouncedSearch, sortBy, sortDir, typeFilter, methodFilter, showVoided]);

  const openDetail=(p:Payment)=>{setSelected(p); setDetailOpen(true);};
  const openEdit=(p:Payment)=>{
    setEditing(p);
    setForm({
      workerId:String(p.workerId||''), projectId:p.projectId?String(p.projectId):'', amount:String(p.amount),
      paymentDate:p.paymentDate? p.paymentDate.split('T')[0]: new Date().toISOString().split('T')[0],
      paymentMethod:p.paymentMethod||'CASH', paymentType:p.paymentType||'WAGE_PAYMENT',
      referenceNumber:p.referenceNumber||'', description:p.description||'', notes:p.notes||'',
    });
    setShowModal(true); setDetailOpen(false);
  };
  const openCreate=()=>{
    setEditing(null);
    setForm({ workerId:'', projectId:'', amount:'', paymentDate:new Date().toISOString().split('T')[0], paymentMethod:'CASH', paymentType:'WAGE_PAYMENT', referenceNumber:'', description:'', notes:'' });
    setShowModal(true);
  };

  const createMutation=useMutation({
    mutationFn: async (payload:any)=>{ const res=await api.post('/payments', payload); return res.data as Payment; },
    onMutate: async (payload:any)=>{
      await queryClient.cancelQueries({queryKey:['payments']});
      const prev=queryClient.getQueryData<PageResponse<Payment>>(['payments', page, 50]);
      const optimistic: Payment = {
        id:Date.now(), workerId:payload.workerId, workerName: workers.find((w:any)=>String(w.id)===String(payload.workerId))?.name||'',
        workerMarathiName: workers.find((w:any)=>String(w.id)===String(payload.workerId))?.marathiName||'',
        projectId:payload.projectId||undefined, projectName:payload.projectId? projects.find((p:any)=>String(p.id)===String(payload.projectId))?.name:undefined,
        amount:payload.amount, paymentDate:payload.paymentDate, paymentMethod:payload.paymentMethod, paymentType:payload.paymentType,
        description:payload.description, notes:payload.notes, referenceNumber:payload.referenceNumber,
        isVoided:false, status:'ACTIVE', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
      } as Payment;
      if(prev) queryClient.setQueryData<PageResponse<Payment>>(['payments', page, 50], {...prev, content:[optimistic,...prev.content], totalElements:prev.totalElements+1});
      return {prev};
    },
    onError:(_e,_v,ctx:any)=>{ if(ctx?.prev) queryClient.setQueryData(['payments', page,50], ctx.prev); toast.error('Create failed'); },
    onSuccess:()=>{ toast.success(t('paymentRecorded')); setShowModal(false); queryClient.invalidateQueries({queryKey:['payments']}); }
  });

  const updateMutation=useMutation({
    mutationFn: async ({id,payload}:{id:number,payload:any})=>{ const res=await api.put(`/payments/${id}`, payload); return res.data as Payment; },
    onMutate: async ({id,payload}:any)=>{
      await queryClient.cancelQueries({queryKey:['payments']});
      const prev=queryClient.getQueryData<PageResponse<Payment>>(['payments', page, 50]);
      if(prev){
        const workerName=workers.find((w:any)=>String(w.id)===String(payload.workerId))?.name||'';
        const workerMarathiName=workers.find((w:any)=>String(w.id)===String(payload.workerId))?.marathiName||'';
        const projectName=payload.projectId? projects.find((p:any)=>String(p.id)===String(payload.projectId))?.name:undefined;
        queryClient.setQueryData<PageResponse<Payment>>(['payments', page,50], {...prev, content: prev.content.map(p=>p.id===id? {...p,...payload, workerName, workerMarathiName, projectName, projectId:payload.projectId||null, amount:payload.amount}:p)});
        if(selected && selected.id===id) setSelected(s=>s? {...s,...payload, workerName, workerMarathiName, projectName}:s);
      }
      return {prev};
    },
    onError:(_e,_v,ctx:any)=>{ if(ctx?.prev) queryClient.setQueryData(['payments', page,50], ctx.prev); toast.error('Update failed'); },
    onSuccess:()=>{ toast.success(t('editSuccess')); setShowModal(false); setEditing(null); queryClient.invalidateQueries({queryKey:['payments']}); }
  });

  const voidMutation=useMutation({
    mutationFn: async (id:number)=>{ await api.put(`/payments/${id}/void`, null, { params:{ reason:'Voided by user'}}); return id; },
    onMutate: async (id:number)=>{
      await queryClient.cancelQueries({queryKey:['payments']});
      const prev=queryClient.getQueryData<PageResponse<Payment>>(['payments', page,50]);
      if(prev){
        queryClient.setQueryData<PageResponse<Payment>>(['payments', page,50], {...prev, content: prev.content.map(p=>p.id===id? {...p,isVoided:true,status:'VOIDED', voidedAt:new Date().toISOString()}:p)});
        if(selected && selected.id===id) setSelected(s=>s? {...s,isVoided:true,status:'VOIDED'}:s);
      }
      return {prev};
    },
    onError:(_e,_v,ctx:any)=>{ if(ctx?.prev) queryClient.setQueryData(['payments', page,50], ctx.prev); toast.error('Void failed'); },
    onSuccess:()=>{ toast.success(t('voidSuccess')); setDetailOpen(false); queryClient.invalidateQueries({queryKey:['payments']}); }
  });

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!form.workerId || !form.amount || !form.paymentDate){ toast.error(t('amountRequired')); return; }
    const payload:any={
      workerId:Number(form.workerId), projectId: form.projectId? Number(form.projectId):null,
      amount: parseFloat(form.amount), paymentDate: form.paymentDate,
      paymentMethod: form.paymentMethod, paymentType: form.paymentType,
      referenceNumber: form.referenceNumber?.trim()||null, description: form.description?.trim()||null, notes: form.notes?.trim()||null,
    };
    if(editing) updateMutation.mutate({id: editing.id, payload});
    else createMutation.mutate(payload);
  };
  const handleVoid=(p:Payment)=>{ if(!confirm(`${t('confirmVoid')} #${p.id}?`)) return; voidMutation.mutate(p.id); };
  const toggleSort=(k:SortKey)=>{ if(sortBy===k) setSortDir(d=>d==='asc'?'desc':'asc'); else {setSortBy(k); setSortDir('desc');} };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><span className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white"><CreditCard size={18}/></span>{t('workerPayments')} {isFetching && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block"/>}</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} / {raw.length} records</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={18}/>} className="bg-gradient-to-r from-emerald-500 to-cyan-600">{t('recordPayment')}</Button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input type="text" placeholder={`${t('search')} worker, ref, project...`} value={searchInput} onChange={(e)=>setSearchInput(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-emerald-500"/>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
              <button onClick={()=>toggleSort('date')} className={`px-3 py-2 flex items-center gap-1 ${sortBy==='date'?'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700':'bg-white dark:bg-gray-800'}`}><Calendar size={14}/>{t('sortByDate')}</button>
              <button onClick={()=>toggleSort('amount')} className={`px-3 py-2 flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 ${sortBy==='amount'?'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700':'bg-white dark:bg-gray-800'}`}><IndianRupee size={14}/>{t('sortByAmount')}</button>
              <button onClick={()=>toggleSort('worker')} className={`px-3 py-2 flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 ${sortBy==='worker'?'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700':'bg-white dark:bg-gray-800'}`}>{t('sortByWorker')}</button>
            </div>
            <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer"><input type="checkbox" checked={showVoided} onChange={(e)=>setShowVoided(e.target.checked)} className="rounded"/>{t('showVoided')}</label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 flex items-center gap-1"><Filter size={14}/>{t('filter')}:</span>
          <select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value as FilterType)} className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs">
            <option value="ALL">{t('all')} • {t('paymentType')}</option>
            <option value="WAGE_PAYMENT">WAGE_PAYMENT</option>
            <option value="ADVANCE_PAYMENT">ADVANCE_PAYMENT</option>
            <option value="FINAL_SETTLEMENT">FINAL_SETTLEMENT</option>
            <option value="PARTIAL_PAYMENT">PARTIAL_PAYMENT</option>
          </select>
          <select value={methodFilter} onChange={(e)=>setMethodFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs">
            <option value="ALL">{t('all')} • {t('paymentMethod')}</option>
            <option value="CASH">{t('cash')}</option>
            <option value="UPI">{t('upi')}</option>
            <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
            <option value="CHEQUE">{t('cheque')}</option>
          </select>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-3">{[...Array(4)].map((_,i)=><div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"/> )}</div>
      ) : filtered.length===0 ? (
        <Card className="p-12 text-center"><CreditCard size={40} className="mx-auto text-gray-300 mb-3"/><p className="text-gray-500">{t('noResults')}</p><Button variant="secondary" size="sm" className="mt-3" onClick={openCreate}>{t('recordPayment')}</Button></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(p=>(
            <Card key={p.id} className={`p-4 hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer overflow-hidden relative ${p.isVoided?'opacity-60':''}`} hover>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"/>
              <div onClick={()=>openDetail(p)} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{p.workerName} {p.workerMarathiName && <span className="text-gray-500 font-normal">• {p.workerMarathiName}</span>}</p>
                    <p className="text-xs text-gray-500 flex flex-wrap gap-2 items-center"><span className="flex items-center gap-1"><Calendar size={12}/>{formatDate(p.paymentDate)}</span> <Badge variant="info">{p.paymentMethod}</Badge> <Badge variant="default">{p.paymentType}</Badge> {p.projectName && <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 text-xs">{p.projectName}</span>} {p.isVoided && <Badge variant="danger">{t('voided')}</Badge>}</p>
                  </div>
                  <div className="text-right"><p className="text-lg font-bold text-emerald-600">{formatCurrency(p.amount)}</p><p className="text-xs text-gray-400">ID #{p.id}</p></div>
                </div>
                <div className="text-sm space-y-1">
                  {p.referenceNumber && <p className="text-xs text-gray-500">{t('reference')}: <span className="font-mono">{p.referenceNumber}</span></p>}
                  {p.description && <p className="text-gray-700 dark:text-gray-300 truncate"><span className="text-gray-500">{t('description')}:</span> {p.description}</p>}
                  {p.notes && <p className="text-xs text-gray-400 truncate">{p.notes}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" size="sm" onClick={()=>openDetail(p)} icon={<Eye size={14}/>}>{t('view')}</Button>
                {!p.isVoided && <><Button variant="ghost" size="sm" onClick={()=>openEdit(p)} icon={<Edit size={14}/>}>{t('edit')}</Button><Button variant="ghost" size="sm" className="text-rose-500" onClick={()=>handleVoid(p)} icon={<Trash2 size={14}/>} loading={voidMutation.isPending}>{t('void')}</Button></>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal - Complete fields per R11 */}
      <Modal isOpen={detailOpen} onClose={()=>setDetailOpen(false)} title={`${t('transactionDetail')} #${selected?.id ?? ''} • ${t('workerPayments')}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Field label={t('transactionIdLabel')} value={`#${selected.id}`} />
              <Field label={t('statusLabel')} value={selected.isVoided? t('voided'): t('active')} badge={selected.isVoided?'danger':'success'} />
              <Field label={`${t('workerName')} (${t('workers')})`} value={selected.workerName} />
              <Field label={t('workerNameMarathi')} value={selected.workerMarathiName||'-'} />
              <Field label={`${t('project')} / ${t('projectName')}`} value={selected.projectName||'-'} />
              <Field label={t('date')} value={formatDate(selected.paymentDate)} />
              <Field label={t('amount')} value={formatCurrency(selected.amount)} strong />
              <Field label={t('paymentType')} value={selected.paymentType} />
              <Field label={t('paymentMethod')} value={selected.paymentMethod} />
              <Field label={t('reference')} value={selected.referenceNumber||'-'} />
              <Field label={t('description')} value={selected.description||'-'} />
              <Field label={t('notes')} value={selected.notes||'-'} />
              <Field label={t('createdBy')} value={selected.createdBy? `User #${selected.createdBy}`:'-'} />
              <Field label={t('createdAt')} value={selected.createdAt? new Date(selected.createdAt).toLocaleString():'-'} />
              <Field label={t('updatedAt')} value={selected.updatedAt? new Date(selected.updatedAt).toLocaleString():'-'} />
              {selected.isVoided && <><Field label="Void Reason" value={selected.voidReason||'-'} /><Field label="Voided At" value={selected.voidedAt? new Date(selected.voidedAt).toLocaleString():'-'} /></>}
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button variant="secondary" onClick={()=>setDetailOpen(false)}>{t('cancel')}</Button>
              {!selected.isVoided && <><Button variant="secondary" onClick={()=>openEdit(selected)} icon={<Edit size={16}/>}>{t('edit')}</Button><Button variant="danger" onClick={()=>handleVoid(selected)} icon={<Trash2 size={16}/>}>{t('void')}</Button></>}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={()=>{setShowModal(false); setEditing(null);}} title={editing? `${t('edit')} #${editing.id}`: t('recordPayment')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('workers')} *</label>
              <select value={form.workerId} onChange={(e)=>setForm({...form, workerId:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" required>
                <option value="">Select Worker</option>
                {workers.map((w:any)=><option key={w.id} value={w.id}>{w.name} {w.marathiName?`• ${w.marathiName}`:''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('project')}</label>
              <select value={form.projectId} onChange={(e)=>setForm({...form, projectId:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <option value="">General</option>
                {projects.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={`${t('amount')} *`} type="number" step="0.01" value={form.amount} onChange={(e)=>setForm({...form, amount:e.target.value})} required />
            <Input label={`${t('date')} *`} type="date" value={form.paymentDate} onChange={(e)=>setForm({...form, paymentDate:e.target.value})} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('paymentType')} *</label>
              <select value={form.paymentType} onChange={(e)=>setForm({...form, paymentType:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" required>
                <option value="WAGE_PAYMENT">WAGE_PAYMENT</option>
                <option value="ADVANCE_PAYMENT">ADVANCE_PAYMENT</option>
                <option value="FINAL_SETTLEMENT">FINAL_SETTLEMENT</option>
                <option value="PARTIAL_PAYMENT">PARTIAL_PAYMENT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('paymentMethod')}</label>
              <select value={form.paymentMethod} onChange={(e)=>setForm({...form, paymentMethod:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <option value="CASH">{t('cash')}</option>
                <option value="UPI">{t('upi')}</option>
                <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                <option value="CHEQUE">{t('cheque')}</option>
              </select>
            </div>
          </div>
          <Input label={t('reference')} value={form.referenceNumber} onChange={(e)=>setForm({...form, referenceNumber:e.target.value})} placeholder="Ref # / UPI ID" />
          <Input label={t('description')} value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5">{t('notes')}</label>
            <textarea value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={()=>{setShowModal(false); setEditing(null);}}>{t('cancel')}</Button>
            <Button type="submit" loading={createMutation.isPending||updateMutation.isPending}>{editing? t('update'): t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({label,value,strong,badge}:{label:string;value:string;strong?:boolean;badge?:'success'|'danger'|'default'|undefined}){
  return (
    <div className="space-y-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
      <p className="text-xs text-gray-500">{label}</p>
      {badge? <Badge variant={badge==='success'?'success':badge==='danger'?'danger':'default'}>{value}</Badge> : <p className={`text-sm break-words ${strong?'font-bold text-emerald-600 text-base':''} text-gray-900 dark:text-white`}>{value}</p>}
    </div>
  );
}
