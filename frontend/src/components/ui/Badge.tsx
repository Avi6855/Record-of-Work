import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    danger: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
