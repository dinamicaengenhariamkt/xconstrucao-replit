'use client';

export function FAQSkeleton() {
  return (
    <div className="p-10 space-y-8 animate-pulse">
      <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 bg-gray-200 dark:bg-gray-800 rounded-full w-32" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-40" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}
