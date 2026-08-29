'use client';
import { useAuthStore, useSidebarStore, useThemeStore } from '@/lib/store';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, setLoading } = useAuthStore();
  const { isCollapsed } = useSidebarStore();
  const { setTheme } = useThemeStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const storedTheme = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
    setTheme(storedTheme);
    
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (storedUser && token) {
      useAuthStore.setState({ user: JSON.parse(storedUser), isAuthenticated: true, isLoading: false });
    } else {
      setLoading(false);
      if (pathname !== '/login') router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (pathname === '/login') return <>{children}</>;
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold animate-pulse">क</div>
          <p className="text-gray-500 dark:text-gray-400">{isLoading ? 'Loading...' : 'Redirecting...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', padding: '12px', fontSize: '14px' } }} />
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Header />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
