import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'कामचा हिशोब | Record of Work',
  description: 'Digital work management for construction and daily wage workers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mr" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {children}
      </body>
    </html>
  );
}
