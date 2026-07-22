/**
 * J23 — Layout da visão de Anunciante (visão dedicada, só para outsider puro).
 *
 * Guard de papel: libera quem tem o papel `anunciante` (primário OU aditivo).
 * Convergência (D6): se o usuário TAMBÉM é contratante/empreiteiro, esta visão
 * redireciona para a área "Meus Anúncios" da visão de cliente — nunca duas portas
 * para a mesma coisa. Outsider puro permanece aqui.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@features/auth/hooks/use-auth';
import { userHasRoleClient } from '@features/auth/store/auth-store';
import { Skeleton } from '@shared/components/ui/skeleton';
import { AnuncianteLayout } from '@features/anunciante/components/AnuncianteLayout';
import { EmailVerificationBanner } from '@features/auth/components/EmailVerificationBanner';
import { OnboardingGate } from '@features/onboarding/components/OnboardingGate';
import { AuthSessionGuard } from '@features/auth/components/AuthSessionGuard';

export default function AnuncianteRootLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAnunciante = userHasRoleClient(user, 'anunciante');
  // D6 — convergência: cliente que também anuncia usa a visão de cliente.
  const isContratante = userHasRoleClient(user, 'contratante');
  const isEmpreiteiro = userHasRoleClient(user, 'empreiteiro');
  const converge = isContratante || isEmpreiteiro;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (converge) {
      // Redireciona para a área de cliente correspondente.
      router.replace(isContratante ? '/contratante/meus-anuncios' : '/empreiteiro/meus-anuncios');
      return;
    }
    if (!isAnunciante) {
      router.push('/login');
    }
  }, [isLoading, user, isAnunciante, converge, isContratante, router]);

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

  if (!user || converge || !isAnunciante) return null;

  return (
    <AuthSessionGuard>
      <OnboardingGate />
      <AnuncianteLayout>
        <EmailVerificationBanner />
        {children}
      </AnuncianteLayout>
    </AuthSessionGuard>
  );
}
