'use client';
import { useAuthStore, useSidebarStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Menu, Bell, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function Header() {
  const { user } = useAuthStore();
  const { isCollapsed, toggle, toggleMobile } = useSidebarStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/notifications/unread-count').then(res => setUnreadCount(res.data)).catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button onClick={toggleMobile} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Menu size={20} /></button>
          <button onClick={toggle} className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder={`${t('search')}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.roles?.[0]}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
