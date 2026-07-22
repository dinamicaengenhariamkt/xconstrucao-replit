'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * J52 — Reforço client-side do gate do wizard para navegação DIRETA ao dashboard
 * (o redirect pós-login já cobre o fluxo de login). Consulta a fonte autoritativa
 * `/api/auth/me` (não o store, que pode não carregar o campo) e só desvia para
 * `/onboarding` quando `onboardingConcluido === false` EXPLÍCITO — nunca em
 * ausência/erro, evitando prender o usuário ou criar loop. Admin/superadmin e a
 * própria rota `/onboarding` são ignorados. Não renderiza nada.
 */
export function OnboardingGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Já está no wizard → não reavaliar (evita loop).
    if (pathname?.startsWith('/onboarding')) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { role?: string; onboardingConcluido?: boolean };
        if (cancelled) return;
        // Admin/superadmin nunca passam pelo wizard.
        if (data.role === 'admin' || data.role === 'superadmin') return;
        // Só desvia com valor explícito false (fonte autoritativa).
        if (data.onboardingConcluido === false) router.replace('/onboarding');
      } catch {
        // silencioso — best-effort, nunca bloqueia por falha de rede.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
