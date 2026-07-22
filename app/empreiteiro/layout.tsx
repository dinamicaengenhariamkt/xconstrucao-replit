'use client';

import { useAuth } from '@features/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EmpreiteiroLayout } from '@features/empreiteiro/components/EmpreiteiroLayout';
import { EmailVerificationBanner } from '@features/auth/components/EmailVerificationBanner';
import { PerfilIncompletoBanner } from '@features/perfil/components/PerfilIncompletoBanner';
import { OnboardingGate } from '@features/onboarding/components/OnboardingGate';
import { AuthSessionGuard } from '@features/auth/components/AuthSessionGuard';

export default function EmpreiteiroLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // No modo "Ver como" o servidor projeta `user` como o target em verbos
  // read-only (/api/auth/me incluso), então a role já vem como
  // 'empreiteiro'. Super admin sem impersonation cookie não entra aqui.
  const allowed = user?.role === 'empreiteiro';

  useEffect(() => {
    if (!isLoading && (!user || !allowed)) {
      router.push('/login');
    }
  }, [isLoading, user, allowed, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!user || !allowed) {
    return null;
  }

  return (
    <AuthSessionGuard>
      <OnboardingGate />
      <EmpreiteiroLayout>
        <EmailVerificationBanner />
        <PerfilIncompletoBanner />
        {children}
      </EmpreiteiroLayout>
    </AuthSessionGuard>
  );
}
