'use client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: { value: number; isUp: boolean };
  className?: string;
}

export default function StatCard({ title, value, icon, color = 'from-indigo-500 to-purple-600', className }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[₹,]/g, '')) || 0;
  
  useEffect(() => {
    if (numValue === 0) { setDisplayValue(0); return; }
    let start = 0;
    const duration = 1000;
    const increment = numValue / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= numValue) { setDisplayValue(numValue); clearInterval(timer); }
      else setDisplayValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [numValue]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn('relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-lg transition-all duration-300', className)}>
      <div className={cn('absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-bl-full', color)} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {typeof value === 'string' && value.startsWith('₹') ? `₹${displayValue.toLocaleString('en-IN')}` : displayValue.toLocaleString('en-IN')}
          </p>
        </div>
        <div className={cn('p-3 rounded-xl bg-gradient-to-br text-white', color)}>{icon}</div>
      </div>
    </motion.div>
  );
}
