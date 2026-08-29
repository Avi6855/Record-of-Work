'use client';
import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
          <input ref={ref} className={cn('w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200', icon && 'pl-10', error && 'border-rose-500 focus:ring-rose-500', className)} {...props} />
        </div>
        {error && <p className="mt-1 text-sm text-rose-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
