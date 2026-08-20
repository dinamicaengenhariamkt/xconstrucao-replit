'use client';

// Página de primeiro acesso (J51) — usa hooks dinâmicos de auth/router.
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@features/auth/hooks/use-auth';
import { OnboardingWizard } from '@features/onboarding/OnboardingWizard';

const PERSONAS = ['contratante', 'empreiteiro', 'anunciante'] as const;
type Persona = (typeof PERSONAS)[number];

function isPersona(role: string | undefined): role is Persona {
  return !!role && (PERSONAS as readonly string[]).includes(role);
}

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Sem sessão → login. Admin/superadmin não têm wizard → manda ao painel deles.
    if (!isLoading && !user) {
      router.replace('/login');
      return;
    }
    if (!isLoading && user && !isPersona(user.role)) {
      router.replace('/admin/financeiro');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !isPersona(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-[#1C1F22]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  return <OnboardingWizard role={user.role} roles={user.roles} />;
}
