'use client';
import { useState, useMemo } from 'react';
import { useWagesQuery, useDebouncedValue } from '@/lib/hooks';
import { t, formatCurrency } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, ArrowUpDown, Wallet, Calendar } from 'lucide-react';

type SortKey = 'name' | 'wage' | 'balance' | 'present' | 'advance' | 'paid';

export default function WagesPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: wagesRaw, isLoading, isFetching, isError } = useWagesQuery(year, month);
  const wages = wagesRaw || [];

  // instant client-side filtering (no network per keystroke) + sorting
  const filteredSorted = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = wages;
    if (q) {
      list = list.filter((w) => {
        const name = (w.workerName || '').toLowerCase();
        const mr = (w.marathiName || '').toLowerCase();
        const village = (w.village || '').toLowerCase();
        const wt = (w.workType || '').toLowerCase();
        return name.includes(q) || mr.includes(q) || village.includes(q) || wt.includes(q) || String(w.workerId).includes(q);
      });
    }
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = (a.workerName || '').localeCompare(b.workerName || '', 'mr');
          break;
        case 'wage':
          cmp = a.grossWage - b.grossWage;
          break;
        case 'balance':
          cmp = a.remainingBalance - b.remainingBalance;
          break;
        case 'present':
          cmp = a.presentDays - b.presentDays;
          break;
        case 'advance':
          cmp = a.totalAdvance - b.totalAdvance;
          break;
        case 'paid':
          cmp = a.totalPayment - b.totalPayment;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [wages, debouncedSearch, sortBy, sortDir]);

  const totals = useMemo(() => {
    // totals reflect currently visible (filtered) for instant feedback
    const src = debouncedSearch ? filteredSorted : wages;
    return {
      gross: src.reduce((s, w) => s + (w.grossWage || 0), 0),
      advance: src.reduce((s, w) => s + (w.totalAdvance || 0), 0),
      paid: src.reduce((s, w) => s + (w.totalPayment || 0), 0),
      balance: src.reduce((s, w) => s + (w.remainingBalance || 0), 0),
      present: src.reduce((s, w) => s + (w.presentDays || 0), 0),
      half: src.reduce((s, w) => s + (w.halfDays || 0), 0),
      ot: src.reduce((s, w) => s + (w.overtimeHours || 0), 0),
      count: src.length,
    };
  }, [wages, filteredSorted, debouncedSearch]);

  const monthNamesMr = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];
  const monthNamesEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="text-indigo-600" size={22} />
            {t('wageCalculation')}
            {isFetching && <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full animate-pulse" aria-label="refreshing" />}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Calendar size={14} />
            {totals.count} {t('workers')} • {monthNamesMr[month-1] || month}/{year}
            {debouncedSearch && ` • "${debouncedSearch}"`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
              <option key={m} value={m}>{monthNamesMr[m-1]} / {monthNamesEn[m-1]}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500">
            {[2023,2024,2025,2026,2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Filters + sort - instant client-side, no API on sort/search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={`${t('search')} ${t('workerName').toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">✕</button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none">
                  <option value="name">{t('workerName')} / {t('sort')}</option>
                  <option value="wage">{t('grossWage')}</option>
                  <option value="balance">{t('remainingBalance')}</option>
                  <option value="present">{t('present')} / हजेरी</option>
                  <option value="advance">उचल (Advance)</option>
                  <option value="paid">Paid / दिलेली</option>
                </select>
                <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <button onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm hover:bg-gray-50 dark:hover:bg-gray-700" title={t('sort')}>
                {sortDir === 'asc' ? '↑ A-Z' : '↓ Z-A'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totals row - instant from memo, updates without reload */}
      {!isLoading && wages.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
              <div><p className="text-gray-500 dark:text-gray-400 text-xs">एकूण कामगार</p><p className="font-bold text-gray-900 dark:text-white">{totals.count}</p><p className="text-xs text-gray-500">हजेरी {totals.present}+½ {totals.half} OT {totals.ot}h</p></div>
              <div><p className="text-gray-500 text-xs">{t('grossWage')}</p><p className="font-bold text-indigo-600">{formatCurrency(totals.gross)}</p></div>
              <div><p className="text-gray-500 text-xs">उचल</p><p className="font-semibold text-amber-600">{formatCurrency(totals.advance)}</p></div>
              <div><p className="text-gray-500 text-xs">Paid</p><p className="font-semibold text-emerald-600">{formatCurrency(totals.paid)}</p></div>
              <div className="col-span-2 md:col-span-1"><p className="text-gray-500 text-xs">{t('remainingBalance')}</p><p className={`font-bold ${totals.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(totals.balance)}</p></div>
              <div className="col-span-2 lg:col-span-2 flex items-center">
                <span className="text-xs text-gray-500 hidden md:inline">Instant filter/sort • {filteredSorted.length}/{wages.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List - placeholderData keeps previous month visible while fetching */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <Card><CardContent className="p-8 text-center text-rose-500">डेटा लोड करण्यात त्रुटी • Failed to load</CardContent></Card>
      ) : filteredSorted.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">
          {wages.length === 0 ? t('noData') : `No match for "${debouncedSearch}"`}
        </CardContent></Card>
      ) : (
        <div className={`space-y-4 ${isFetching ? 'opacity-60' : ''} transition-opacity`}>
          {filteredSorted.map((w) => (
            <Card key={w.workerId} hover className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                      {w.workerName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{w.workerName}</p>
                      <p className="text-sm text-gray-500 truncate">
                        हजेरी: {w.presentDays} • अर्धा: {w.halfDays} • अनुप: {w.absentDays ?? 0} • OT: {w.overtimeHours}h
                        {w.workType ? ` • ${w.workType}` : ''}{w.village ? ` • ${w.village}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(w.grossWage)}</p>
                    <p className={`text-sm font-medium ${w.remainingBalance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      बाकी: {formatCurrency(w.remainingBalance)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">उचल: <span className="font-medium text-amber-600">{formatCurrency(w.totalAdvance)}</span></span>
                  <span className="text-gray-500 dark:text-gray-400">दिले: <span className="font-medium text-emerald-600">{formatCurrency(w.totalPayment)}</span></span>
                  <span className="text-gray-500 dark:text-gray-400">दैनिक: <span className="font-medium text-gray-700 dark:text-gray-200">{formatCurrency(w.dailyWage)}</span></span>
                  <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
                  <span className="text-xs text-gray-400">ID {w.workerId}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
