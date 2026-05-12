/**
 * Layout para área do Contratante
 * Protege rotas e garante que apenas usuários com role "contratante" tenham acesso
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@features/auth/hooks/use-auth';
import { Skeleton } from '@shared/components/ui/skeleton';
import { ContratanteLayout } from '@features/contratante/components/ContratanteLayout';
import { EmailVerificationBanner } from '@features/auth/components/EmailVerificationBanner';
import { AuthSessionGuard } from '@features/auth/components/AuthSessionGuard';

export default function ContratanteRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // No modo "Ver como" o servidor já projeta `user` como o target
  // (requireVerifiedUser + /api/auth/me retornam o usuário impersonado em
  // verbos read-only). Portanto basta liberar quando role === 'contratante'.
  // Super admin sem impersonation cookie NÃO entra direto nesta área.
  const allowed = user?.role === 'contratante';

  useEffect(() => {
    if (!isLoading && (!user || !allowed)) {
      router.push('/login');
    }
  }, [isLoading, user, allowed, router]);

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

  if (!user || !allowed) {
    return null;
  }

  return (
    <AuthSessionGuard>
      <ContratanteLayout>
        <EmailVerificationBanner />
        {children}
      </ContratanteLayout>
    </AuthSessionGuard>
  );
}
