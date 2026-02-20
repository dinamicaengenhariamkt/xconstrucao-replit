'use client';

export function MinhasObrasSkeleton() {
  return (
    <div className="space-y-10 p-10 animate-pulse">
      <div className="space-y-3">
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg w-64" />
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-96" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 bg-gray-200 dark:bg-gray-800 rounded-full w-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-800" />
            <div className="p-6 space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
