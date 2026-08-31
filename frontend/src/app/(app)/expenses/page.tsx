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
import { Receipt, Plus, Search, Edit, Trash2, Eye, ArrowUpDown, Calendar, Wallet, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useAllProjectsQuery, useDebouncedValue } from '@/lib/hooks';

const CATEGORIES = ['MACHINE','MATERIAL','FUEL','TRANSPORT','FOOD','LABOUR','TOOLS','ELECTRICITY','MAINTENANCE','RENT','OTHER'];

interface Expense {
  id:number; projectId?:number; projectName?:string; category:string; amount:number; expenseDate:string;
  description:string; vendor?:string; vendorPhone?:string; paymentMethod:string; receiptUrl?:string; notes?:string;
  isVoided:boolean; status?:string; createdBy?:number; voidedBy?:number; voidReason?:string; voidedAt?:string;
  createdAt:string; updatedAt?:string;
}

type SortKey='date'|'amount'|'category';

export default function ExpensesPage(){
  const queryClient=useQueryClient();
  const [page]=useState(0);
  const [searchInput,setSearchInput]=useState('');
  const [sortBy,setSortBy]=useState<SortKey>('date');
  const [sortDir,setSortDir]=useState<'asc'|'desc'>('desc');
  const [categoryFilter,setCategoryFilter]=useState<string>('ALL');
  const [methodFilter,setMethodFilter]=useState<string>('ALL');
  const [showVoided,setShowVoided]=useState(false);
  const [selected,setSelected]=useState<Expense|null>(null);
  const [detailOpen,setDetailOpen]=useState(false);
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState<Expense|null>(null);
  const [form,setForm]=useState({ projectId:'', category:'MATERIAL', amount:'', expenseDate:new Date().toISOString().split('T')[0], description:'', vendor:'', vendorPhone:'', paymentMethod:'CASH', notes:'' });

  const debounced=useDebouncedValue(searchInput,350);

  const {data,isLoading,isFetching}=useQuery({
    queryKey:['expenses', page, 50],
    queryFn: async()=>{ const res=await api.get<PageResponse<Expense>>('/expenses',{params:{page,size:50}}); return res.data; },
    staleTime:60*1000,
    placeholderData:(prev)=>prev,
  });

  const {data:projects=[]}=useAllProjectsQuery();
  const raw:Expense[]=useMemo(()=>data?.content||[],[data]);

  const filtered=useMemo(()=>{
    let list=[...raw];
    if(!showVoided) list=list.filter(e=>!e.isVoided);
    if(categoryFilter!=='ALL') list=list.filter(e=>e.category===categoryFilter);
    if(methodFilter!=='ALL') list=list.filter(e=>e.paymentMethod===methodFilter);
    if(debounced){
      const q=debounced.toLowerCase();
      list=list.filter(e=>
        (e.description||'').toLowerCase().includes(q) ||
        (e.vendor||'').toLowerCase().includes(q) ||
        (e.category||'').toLowerCase().includes(q) ||
        (e.projectName||'').toLowerCase().includes(q) ||
        (e.notes||'').toLowerCase().includes(q) ||
        String(e.amount).includes(q)
      );
    }
    list.sort((a,b)=>{
      let cmp=0;
      if(sortBy==='date') cmp=new Date(a.expenseDate).getTime()-new Date(b.expenseDate).getTime();
      else if(sortBy==='amount') cmp=Number(a.amount)-Number(b.amount);
      else cmp=(a.category||'').localeCompare(b.category||'');
      return sortDir==='asc'?cmp:-cmp;
    });
    return list;
  },[raw,debounced,sortBy,sortDir,categoryFilter,methodFilter,showVoided]);

  const openDetail=(e:Expense)=>{setSelected(e); setDetailOpen(true);};
  const openEdit=(e:Expense)=>{
    setEditing(e);
    setForm({
      projectId:e.projectId?String(e.projectId):'', category:e.category||'MATERIAL', amount:String(e.amount),
      expenseDate:e.expenseDate? e.expenseDate.split('T')[0]: new Date().toISOString().split('T')[0],
      description:e.description||'', vendor:e.vendor||'', vendorPhone:e.vendorPhone||'', paymentMethod:e.paymentMethod||'CASH', notes:e.notes||'',
    });
    setShowModal(true); setDetailOpen(false);
  };
  const openCreate=()=>{ setEditing(null); setForm({ projectId:'', category:'MATERIAL', amount:'', expenseDate:new Date().toISOString().split('T')[0], description:'', vendor:'', vendorPhone:'', paymentMethod:'CASH', notes:'' }); setShowModal(true); };

  const createMutation=useMutation({
    mutationFn: async(payload:any)=>{ const res=await api.post('/expenses', payload); return res.data as Expense; },
    onMutate: async(payload:any)=>{
      await queryClient.cancelQueries({queryKey:['expenses']});
      const prev=queryClient.getQueryData<PageResponse<Expense>>(['expenses', page,50]);
      const optimistic:Expense={
        id:Date.now(), projectId:payload.projectId||undefined, projectName:payload.projectId? projects.find((p:any)=>String(p.id)===String(payload.projectId))?.name:undefined,
        category:payload.category, amount:payload.amount, expenseDate:payload.expenseDate, description:payload.description, vendor:payload.vendor, vendorPhone:payload.vendorPhone,
        paymentMethod:payload.paymentMethod, notes:payload.notes, isVoided:false, status:'ACTIVE', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
      } as Expense;
      if(prev) queryClient.setQueryData<PageResponse<Expense>>(['expenses', page,50], {...prev, content:[optimistic,...prev.content], totalElements:prev.totalElements+1});
      return {prev};
    },
    onError:(_,__,ctx:any)=>{ if(ctx?.prev) queryClient.setQueryData(['expenses',page,50],ctx.prev); toast.error('Create failed'); },
    onSuccess:()=>{ toast.success(t('saved')); setShowModal(false); queryClient.invalidateQueries({queryKey:['expenses']}); }
  });

  const updateMutation=useMutation({
    mutationFn: async({id,payload}:{id:number,payload:any})=>{ const res=await api.put(`/expenses/${id}`, payload); return res.data as Expense; },
    onMutate: async({id,payload}:any)=>{
      await queryClient.cancelQueries({queryKey:['expenses']});
      const prev=queryClient.getQueryData<PageResponse<Expense>>(['expenses',page,50]);
      if(prev){
        const projectName=payload.projectId? projects.find((p:any)=>String(p.id)===String(payload.projectId))?.name:undefined;
        queryClient.setQueryData<PageResponse<Expense>>(['expenses',page,50], {...prev, content: prev.content.map(e=>e.id===id? {...e, ...payload, projectName, projectId:payload.projectId||null, amount:payload.amount}:e)});
        if(selected && selected.id===id) setSelected(s=>s? {...s,...payload, projectName}:s);
      }
      return {prev};
    },
    onError:(_,__,ctx:any)=>{ if(ctx?.prev) queryClient.setQueryData(['expenses',page,50],ctx.prev); toast.error('Update failed'); },
    onSuccess:()=>{ toast.success(t('editSuccess')); setShowModal(false); setEditing(null); queryClient.invalidateQueries({queryKey:['expenses']}); }
  });

  const voidMutation=useMutation({
    mutationFn: async(id:number)=>{ await api.put(`/expenses/${id}/void`, null, {params:{reason:'Voided by user'}}); return id; },
    onMutate: async(id:number)=>{
      await queryClient.cancelQueries({queryKey:['expenses']});
      const prev=queryClient.getQueryData<PageResponse<Expense>>(['expenses',page,50]);
      if(prev){
        queryClient.setQueryData<PageResponse<Expense>>(['expenses',page,50], {...prev, content: prev.content.map(e=>e.id===id? {...e,isVoided:true,status:'VOIDED', voidedAt:new Date().toISOString()}:e)});
        if(selected && selected.id===id) setSelected(s=>s? {...s,isVoided:true,status:'VOIDED'}:s);
      }
      return {prev};
    },
    onError:(_,__,ctx:any)=>{ if(ctx?.prev) queryClient.setQueryData(['expenses',page,50],ctx.prev); toast.error('Void failed'); },
    onSuccess:()=>{ toast.success(t('voidSuccess')); setDetailOpen(false); queryClient.invalidateQueries({queryKey:['expenses']}); }
  });

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!form.amount || !form.expenseDate || !form.description){ toast.error(t('amountRequired')); return; }
    const payload:any={
      projectId: form.projectId? Number(form.projectId):null, category: form.category, amount: parseFloat(form.amount),
      expenseDate: form.expenseDate, description: form.description.trim(), vendor: form.vendor?.trim()||null, vendorPhone: form.vendorPhone?.trim()||null,
      paymentMethod: form.paymentMethod, notes: form.notes?.trim()||null,
    };
    if(editing) updateMutation.mutate({id: editing.id, payload});
    else createMutation.mutate(payload);
  };
  const handleVoid=(e:Expense)=>{ if(!confirm(`${t('confirmVoid')} #${e.id}?`)) return; voidMutation.mutate(e.id); };
  const toggleSort=(k:SortKey)=>{ if(sortBy===k) setSortDir(d=>d==='asc'?'desc':'asc'); else {setSortBy(k); setSortDir('desc');} };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><span className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white"><Receipt size={18}/></span>{t('expenses')} {isFetching && <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse inline-block"/>}</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} / {raw.length} records</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={18}/>} className="bg-gradient-to-r from-rose-500 to-pink-600">{t('addExpense')}</Button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input type="text" placeholder={`${t('search')} description, vendor, project...`} value={searchInput} onChange={(e)=>setSearchInput(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-rose-500"/>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
              <button onClick={()=>toggleSort('date')} className={`px-3 py-2 flex items-center gap-1 ${sortBy==='date'?'bg-rose-50 dark:bg-rose-900/30 text-rose-700':'bg-white dark:bg-gray-800'}`}><Calendar size={14}/>{t('sortByDate')}</button>
              <button onClick={()=>toggleSort('amount')} className={`px-3 py-2 flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 ${sortBy==='amount'?'bg-rose-50 dark:bg-rose-900/30 text-rose-700':'bg-white dark:bg-gray-800'}`}><Wallet size={14}/>{t('sortByAmount')}</button>
              <button onClick={()=>toggleSort('category')} className={`px-3 py-2 flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 ${sortBy==='category'?'bg-rose-50 dark:bg-rose-900/30 text-rose-700':'bg-white dark:bg-gray-800'}`}>{t('sortByCategory')}</button>
            </div>
            <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer"><input type="checkbox" checked={showVoided} onChange={(e)=>setShowVoided(e.target.checked)} className="rounded"/>{t('showVoided')}</label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 flex items-center gap-1"><Filter size={14}/>{t('filter')}:</span>
          <select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs">
            <option value="ALL">{t('all')} • {t('category')}</option>
            {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
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
        <Card className="p-12 text-center"><Receipt size={40} className="mx-auto text-gray-300 mb-3"/><p className="text-gray-500">{t('noResults')}</p><Button variant="secondary" size="sm" className="mt-3" onClick={openCreate}>{t('addExpense')}</Button></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(e=>(
            <Card key={e.id} className={`p-4 hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer overflow-hidden relative ${e.isVoided?'opacity-60':''}`} hover>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-pink-600"/>
              <div onClick={()=>openDetail(e)} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{e.description}</p>
                    <p className="text-xs text-gray-500 flex flex-wrap gap-2 items-center"><span className="flex items-center gap-1"><Calendar size={12}/>{formatDate(e.expenseDate)}</span> <Badge variant="default">{e.category}</Badge> <Badge variant="info">{e.paymentMethod}</Badge> {e.projectName && <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 text-xs">{e.projectName}</span>} {e.isVoided && <Badge variant="danger">{t('voided')}</Badge>}</p>
                  </div>
                  <div className="text-right"><p className="text-lg font-bold text-rose-600">{formatCurrency(e.amount)}</p><p className="text-xs text-gray-400">ID #{e.id}</p></div>
                </div>
                <div className="text-sm">
                  {e.vendor && <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-500">{t('vendor')}:</span> {e.vendor} {e.vendorPhone && <span className="text-xs text-gray-400">({e.vendorPhone})</span>}</p>}
                  {e.notes && <p className="text-xs text-gray-400 truncate">{e.notes}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" size="sm" onClick={()=>openDetail(e)} icon={<Eye size={14}/>}>{t('view')}</Button>
                {!e.isVoided && <><Button variant="ghost" size="sm" onClick={()=>openEdit(e)} icon={<Edit size={14}/>}>{t('edit')}</Button><Button variant="ghost" size="sm" className="text-rose-500" onClick={()=>handleVoid(e)} icon={<Trash2 size={14}/>} loading={voidMutation.isPending}>{t('void')}</Button></>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal - R11 complete */}
      <Modal isOpen={detailOpen} onClose={()=>setDetailOpen(false)} title={`${t('transactionDetail')} #${selected?.id ?? ''} • ${t('expenses')}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Field label={t('transactionIdLabel')} value={`#${selected.id}`} />
              <Field label={t('statusLabel')} value={selected.isVoided? t('voided'): t('active')} badge={selected.isVoided?'danger':'success'} />
              <Field label={`${t('project')} / ${t('projectName')}`} value={selected.projectName||'-'} />
              <Field label={t('category')} value={selected.category} />
              <Field label={t('amount')} value={formatCurrency(selected.amount)} strong />
              <Field label={t('date')} value={formatDate(selected.expenseDate)} />
              <Field label={t('description')} value={selected.description||'-'} />
              <Field label={t('vendor')} value={selected.vendor||'-'} />
              <Field label={t('paymentMethod')} value={selected.paymentMethod} />
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

      <Modal isOpen={showModal} onClose={()=>{setShowModal(false); setEditing(null);}} title={editing? `${t('edit')} #${editing.id}`: t('addExpense')} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('projects')}</label>
            <select value={form.projectId} onChange={(e)=>setForm({...form, projectId:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <option value="">General</option>
              {projects.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('category')} *</label>
            <select value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={`${t('amount')} *`} type="number" step="0.01" value={form.amount} onChange={(e)=>setForm({...form, amount:e.target.value})} required />
            <Input label={`${t('date')} *`} type="date" value={form.expenseDate} onChange={(e)=>setForm({...form, expenseDate:e.target.value})} required />
          </div>
          <Input label={`${t('description')} *`} value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('vendor')} value={form.vendor} onChange={(e)=>setForm({...form, vendor:e.target.value})} />
            <Input label={t('phone')} value={form.vendorPhone} onChange={(e)=>setForm({...form, vendorPhone:e.target.value})} />
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

function Field({label,value,strong,badge}:{label:string;value:string;strong?:boolean;badge?:'success'|'danger'|undefined}){
  return (
    <div className="space-y-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
      <p className="text-xs text-gray-500">{label}</p>
      {badge? <Badge variant={badge}>{value}</Badge> : <p className={`text-sm break-words ${strong?'font-bold text-rose-600 text-base':''} text-gray-900 dark:text-white`}>{value}</p>}
    </div>
  );
}
