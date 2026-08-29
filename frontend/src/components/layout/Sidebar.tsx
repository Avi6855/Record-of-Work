'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebarStore, useAuthStore } from '@/lib/store';
import { t, setLocale, getLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, FolderKanban, CalendarCheck, Wallet, IndianRupee,
  Receipt, BookOpen, BarChart3, Bell, Settings, ChevronDown, ChevronLeft,
  ChevronRight, Building2, Shield, LogOut, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavItem { key: string; label: string; icon: React.ReactNode; href: string; children?: NavItem[]; }

const adminNavItems: NavItem[] = [
  { key: 'dashboard', label: 'dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
  { key: 'workers', label: 'workers', icon: <Users size={20} />, href: '/workers', children: [
    { key: 'allWorkers', label: 'allWorkers', icon: <Users size={16} />, href: '/workers' },
    { key: 'addWorker', label: 'addWorker', icon: <Users size={16} />, href: '/workers/new' },
  ]},
  { key: 'projects', label: 'projects', icon: <FolderKanban size={20} />, href: '/projects', children: [
    { key: 'allProjects', label: 'allProjects', icon: <FolderKanban size={16} />, href: '/projects' },
    { key: 'addProject', label: 'addProject', icon: <FolderKanban size={16} />, href: '/projects/new' },
  ]},
  { key: 'attendance', label: 'attendance', icon: <CalendarCheck size={20} />, href: '/attendance', children: [
    { key: 'todayAttendance', label: 'todayAttendance', icon: <CalendarCheck size={16} />, href: '/attendance' },
    { key: 'monthlyAttendance', label: 'monthlyAttendance', icon: <CalendarCheck size={16} />, href: '/attendance/monthly' },
  ]},
  { key: 'wages', label: 'wages', icon: <Wallet size={20} />, href: '/wages' },
  { key: 'advances', label: 'advances', icon: <IndianRupee size={20} />, href: '/advances' },
  { key: 'payments', label: 'payments', icon: <Receipt size={20} />, href: '/payments' },
  { key: 'expenses', label: 'expenses', icon: <Receipt size={20} />, href: '/expenses' },
  { key: 'ledger', label: 'ledger', icon: <BookOpen size={20} />, href: '/ledger' },
  { key: 'dailyClosing', label: 'dailyClosing', icon: <BarChart3 size={20} />, href: '/daily-closing' },
  { key: 'reports', label: 'reports', icon: <BarChart3 size={20} />, href: '/reports' },
  { key: 'notifications', label: 'notifications', icon: <Bell size={20} />, href: '/notifications' },
  { key: 'settings', label: 'settings', icon: <Settings size={20} />, href: '/settings' },
];

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button onClick={() => setExpanded(!expanded)} className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200', isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800')}>
          {item.icon}
          <span className="flex-1 text-left">{t(item.label)}</span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-4">
              {item.children!.map((child) => <NavItemComponent key={child.key} item={child} depth={depth + 1} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link href={item.href} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200', isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800')}>
      {item.icon}
      <span>{t(item.label)}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const [locale, setLocaleState] = useState<'mr' | 'en'>('mr');

  useEffect(() => { setLocaleState(getLocale()); }, []);

  const toggleLocale = () => {
    const newLocale = locale === 'mr' ? 'en' : 'mr';
    setLocale(newLocale);
    setLocaleState(newLocale);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">क</div>
          {!isCollapsed && <div><h1 className="font-bold text-gray-900 dark:text-white font-[Noto_Sans_Devanagari]">कामचा हिशोब</h1><p className="text-xs text-gray-500">Record of Work</p></div>}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {adminNavItems.map((item) => <NavItemComponent key={item.key} item={item} />)}
      </nav>
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
        <button onClick={toggleLocale} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
          <span>{locale === 'mr' ? '🌐 English' : '🌐 मराठी'}</span>
        </button>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
          <LogOut size={20} /><span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn('hidden lg:flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 fixed left-0 top-0 z-40', isCollapsed ? 'w-20' : 'w-64')}>
        {sidebarContent}
      </aside>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div className="fixed inset-0 bg-black/50 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMobile} />
            <motion.aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 z-50 lg:hidden shadow-xl" initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}>
              <button onClick={closeMobile} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={20} /></button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
