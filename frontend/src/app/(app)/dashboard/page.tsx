'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { t, formatCurrency } from '@/lib/i18n';
import StatCard from '@/components/ui/StatCard';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { Users, CalendarCheck, Wallet, IndianRupee, Receipt, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardData {
  today: { totalWorkers: number; present: number; absent: number; halfDay: number; todayWages: number; todayAdvances: number; todayPayments: number; todayExpenses: number; todayIncome: number; closingCash: number; };
  overall: { amountDue: number; totalAdvances: number; clientPending: number; projectExpenses: number; totalIncome: number; availableCash: number; monthlyWages: number; monthlyExpenses: number; monthlyIncome: number; estimatedProfit: number; };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => {
      const d = res.data;
      setData({
        today: {
          totalWorkers: d.totalWorkers ?? 0,
          present: d.todayPresent ?? 0,
          absent: d.todayAbsent ?? 0,
          halfDay: 0,
          todayWages: Number(d.todayWages ?? 0),
          todayAdvances: Number(d.todayAdvances ?? 0),
          todayPayments: Number(d.todayPayments ?? 0),
          todayExpenses: Number(d.todayExpenses ?? 0),
          todayIncome: Number(d.todayPayments ?? 0),
          closingCash: 0,
        },
        overall: {
          amountDue: Number(d.amountDueToWorkers ?? 0),
          totalAdvances: 0,
          clientPending: 0,
          projectExpenses: 0,
          totalIncome: 0,
          availableCash: 0,
          monthlyWages: Number(d.totalPaymentsThisMonth ?? 0),
          monthlyExpenses: Number(d.totalExpensesThisMonth ?? 0),
          monthlyIncome: 0,
          estimatedProfit: 0,
        },
      });
    }).catch(() => {
      setData({
        today: { totalWorkers: 8, present: 6, absent: 1, halfDay: 1, todayWages: 4200, todayAdvances: 500, todayPayments: 1000, todayExpenses: 300, todayIncome: 5000, closingCash: 12000 },
        overall: { amountDue: 45000, totalAdvances: 12000, clientPending: 35000, projectExpenses: 18000, totalIncome: 65000, availableCash: 35000, monthlyWages: 84000, monthlyExpenses: 12000, monthlyIncome: 25000, estimatedProfit: 13000 }
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const today = data.today;
  const overall = data.overall;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('todaysSummary')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('mr-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title={t('totalWorkers')} value={today.totalWorkers} icon={<Users size={24} />} color="from-indigo-500 to-purple-600" />
        <StatCard title={t('present')} value={today.present} icon={<CalendarCheck size={24} />} color="from-emerald-500 to-cyan-500" />
        <StatCard title={t('todayWages')} value={`₹${today.todayWages}`} icon={<Wallet size={24} />} color="from-amber-400 to-orange-500" />
        <StatCard title={t('todayPayments')} value={`₹${today.todayPayments}`} icon={<IndianRupee size={24} />} color="from-blue-500 to-indigo-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title={t('todayAdvances')} value={`₹${today.todayAdvances}`} icon={<IndianRupee size={24} />} color="from-rose-400 to-pink-500" />
        <StatCard title={t('todayExpenses')} value={`₹${today.todayExpenses}`} icon={<Receipt size={24} />} color="from-red-500 to-rose-600" />
        <StatCard title={t('todayIncome')} value={`₹${today.todayIncome}`} icon={<TrendingUp size={24} />} color="from-green-500 to-emerald-600" />
        <StatCard title={t('closingCash')} value={`₹${today.closingCash}`} icon={<IndianRupee size={24} />} color="from-violet-500 to-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('amountDue')}</h3></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[{ label: 'कामगारांना द्यायची रक्कम', value: overall.amountDue, color: 'text-rose-500' },
                { label: t('totalAdvances'), value: overall.totalAdvances, color: 'text-amber-500' },
                { label: t('clientPending'), value: overall.clientPending, color: 'text-blue-500' },
                { label: t('availableCash'), value: overall.availableCash, color: 'text-emerald-500' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
                  <span className={`font-semibold ${item.color}`}>{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('monthlyWages')}</h3></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[{ label: t('monthlyWages'), value: overall.monthlyWages, icon: <ArrowUpRight className="text-rose-500" size={16} /> },
                { label: t('monthlyExp'), value: overall.monthlyExpenses, icon: <ArrowDownRight className="text-amber-500" size={16} /> },
                { label: t('monthlyIncome'), value: overall.monthlyIncome, icon: <ArrowUpRight className="text-emerald-500" size={16} /> },
                { label: t('estimatedProfit'), value: overall.estimatedProfit, icon: <TrendingUp className="text-blue-500" size={16} /> }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: t('addWorker'), href: '/workers/new', color: 'from-indigo-500 to-purple-600' },
              { label: t('markAttendance'), href: '/attendance', color: 'from-emerald-500 to-cyan-500' },
              { label: t('recordPayment'), href: '/payments/new', color: 'from-blue-500 to-indigo-500' },
              { label: t('recordAdvance'), href: '/advances/new', color: 'from-amber-400 to-orange-500' },
              { label: t('recordExpense'), href: '/expenses/new', color: 'from-rose-500 to-pink-600' },
              { label: t('newProject'), href: '/projects/new', color: 'from-violet-500 to-purple-600' },
            ].map((action, i) => (
              <a key={i} href={action.href} className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${action.color} text-white hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}>
                <span className="text-sm font-medium text-center">{action.label}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
