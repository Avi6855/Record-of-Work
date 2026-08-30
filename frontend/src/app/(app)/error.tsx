'use client';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">!</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Page Error</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error.message || 'Something went wrong on this page.'}</p>
        <button onClick={reset} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg">
          Try again
        </button>
      </div>
    </div>
  );
}
