'use client';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      <Card>
        <CardHeader><h3 className="font-semibold">Application Settings</h3></CardHeader>
        <CardContent>
          <p className="text-gray-500">Settings management coming soon. For now, use the Super Admin panel to manage system settings.</p>
        </CardContent>
      </Card>
    </div>
  );
}