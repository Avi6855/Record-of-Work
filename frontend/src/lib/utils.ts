import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PRESENT': return 'text-emerald-500';
    case 'ABSENT': return 'text-rose-500';
    case 'HALF_DAY': return 'text-amber-500';
    case 'OVERTIME': return 'text-blue-500';
    case 'LEAVE': return 'text-purple-500';
    case 'HOLIDAY': return 'text-indigo-500';
    default: return 'text-gray-400';
  }
}

export function getStatusSymbol(status: string): string {
  switch (status) {
    case 'PRESENT': return '✓';
    case 'ABSENT': return 'X';
    case 'HALF_DAY': return '½';
    case 'OVERTIME': return 'OT';
    case 'LEAVE': return 'L';
    case 'HOLIDAY': return 'H';
    default: return '';
  }
}
