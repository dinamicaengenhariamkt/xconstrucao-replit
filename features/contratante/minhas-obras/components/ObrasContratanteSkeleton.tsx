'use client';

import { Skeleton } from '@shared/components/ui/skeleton';

export function ObrasContratanteSkeleton() {
  return (
    <div className="p-10 flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-[300px]" />
        <Skeleton className="h-6 w-[450px]" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-50 dark:border-gray-800">
            <Skeleton className="aspect-[16/9] w-full" />
            <div className="p-6 flex flex-col gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
