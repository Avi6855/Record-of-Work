'use client';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">404</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">The page you are looking for does not exist.</p>
        <a href="/dashboard" className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg inline-block">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
