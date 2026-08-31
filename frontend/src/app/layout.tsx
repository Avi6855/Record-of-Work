import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'कामचा हिशोब | Record of Work',
  description: 'Digital work management for construction and daily wage workers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mr" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
