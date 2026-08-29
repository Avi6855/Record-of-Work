import { cn } from '@/lib/utils';

interface SkeletonProps { className?: string; }

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl', className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 w-full" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(cols)].map((_, j) => <Skeleton key={j} className="h-10 flex-1" />)}
        </div>
      ))}
    </div>
  );
}
