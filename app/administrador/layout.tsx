/**
 * Layout para área do Administrador
 * Protege rotas e garante que apenas usuários com role "admin" tenham acesso
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@features/auth/hooks/use-auth';
import { Skeleton } from '@shared/components/ui/skeleton';

export default function AdministradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

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

  if (!user || user.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
