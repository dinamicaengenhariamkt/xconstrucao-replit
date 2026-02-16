/**
 * Layout para área do Contratante
 * Protege rotas e garante que apenas usuários com role "contratante" tenham acesso
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@features/auth/hooks/use-auth';
import { Skeleton } from '@shared/components/ui/skeleton';

export default function ContratanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'contratante')) {
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

  if (!user || user.role !== 'contratante') {
    return null;
  }

  return <>{children}</>;
}
