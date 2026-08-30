'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { t, formatDate } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Bell, CheckCircle } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface Notification { id: number; type: string; title: string; message: string; isRead: boolean; createdAt: string; }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications', { params: { page: 0, size: 50 } }).then(res => setNotifications(res.data.content || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('notifications')}</h1>
        {notifications.some(n => !n.isRead) && <Button variant="secondary" size="sm" onClick={markAllRead} icon={<CheckCircle size={16} />}>Mark all read</Button>}
      </div>

      {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div> : notifications.length === 0 ? (
        <EmptyState icon={<Bell size={48} />} title="No notifications" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={`p-4 ${!n.isRead ? 'border-l-4 border-l-indigo-500' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{n.title}</p>
                  <p className="text-sm text-gray-500">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}