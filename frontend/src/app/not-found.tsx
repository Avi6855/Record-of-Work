'use client';
import { t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-indigo-500 mb-4">404</h1>
        <p className="text-xl text-gray-900 dark:text-white mb-2">{t('pageNotFound')}</p>
        <p className="text-gray-500 mb-6">हे पेज उपलब्ध नाही / This page is not available</p>
        <Button onClick={() => router.push('/dashboard')}>{t('dashboard')}</Button>
      </div>
    </div>
  );
}
