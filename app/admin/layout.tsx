'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@features/auth/hooks/use-auth';
import { Skeleton } from '@shared/components/ui/skeleton';
import { AdminLayout } from '@features/admin/components/AdminLayout';
import { AuthSessionGuard } from '@features/auth/components/AuthSessionGuard';
import { adminPodeAcessar } from '@features/auth/api/admin-scope';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAdminLike = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (!isLoading && (!user || !isAdminLike)) {
      router.push('/login');
    }
  }, [isLoading, user, isAdminLike, router]);

  // XG06 — camada de UX, NÃO de segurança (a barreira real é o proxy + as rotas).
  // Sem isto, o admin de escopo restrito que digitasse /admin/financeiro veria o
  // shell renderizar e só depois tomaria 403 nas chamadas de dados.
  useEffect(() => {
    if (isLoading || !user || !isAdminLike) return;
    if (!adminPodeAcessar(user, pathname)) {
      router.replace('/admin/xgestao');
    }
  }, [isLoading, user, isAdminLike, pathname, router]);

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
