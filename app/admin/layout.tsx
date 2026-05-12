'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@features/auth/hooks/use-auth';
import { Skeleton } from '@shared/components/ui/skeleton';
import { AdminLayout } from '@features/admin/components/AdminLayout';
import { AuthSessionGuard } from '@features/auth/components/AuthSessionGuard';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAdminLike = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (!isLoading && (!user || !isAdminLike)) {
      router.push('/login');
    }
  }, [isLoading, user, isAdminLike, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-8 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!user || !isAdminLike) return null;

  return (
    <AuthSessionGuard>
      <AdminLayout>{children}</AdminLayout>
    </AuthSessionGuard>
  );
}
