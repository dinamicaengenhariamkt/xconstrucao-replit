'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@shared/hooks/use-toast';
import { IconMail } from '@shared/components/icons';

/**
 * Banner persistente exibido no topo dos dashboards quando o usuário ainda
 * não confirmou o email. Bloqueia visualmente as ações principais e oferece
 * "Reenviar email" usando o endpoint público /api/auth/resend-verification.
 *
 * Auto-some quando o usuário verifica (re-checa a cada 30s).
 */
export function EmailVerificationBanner() {
  const [unverified, setUnverified] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setEmail(data?.email ?? null);
        setUnverified(!data?.emailVerified);
      } catch {
        // silencioso — banner é progressive enhancement
      }
    }

    check();
    const id = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!unverified || !email) return null;

  async function handleResend() {
    if (resending) return;
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Falha ao reenviar');
      toast({
        title: 'Email reenviado',
        description: 'Verifique sua caixa de entrada e a pasta de spam.',
      });
    } catch {
      toast({
        title: 'Não foi possível reenviar',
        description: 'Tente novamente em alguns minutos.',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <div
      className="w-full bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-100"
      data-testid="banner-email-unverified"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1">
          <IconMail className="text-xl mt-0.5 shrink-0" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">Confirme seu email para liberar todas as ações</p>
            <p className="text-amber-800 dark:text-amber-200/80">
              Enviamos um link para <span className="font-medium">{email}</span>. Sem confirmar,
              criar obras e candidaturas ficam bloqueadas.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="shrink-0 inline-flex items-center justify-center rounded-full bg-amber-900 dark:bg-amber-100 text-amber-50 dark:text-amber-900 text-xs font-bold uppercase tracking-wider px-4 py-2 hover:brightness-110 disabled:opacity-50 transition-all"
          data-testid="button-resend-verification"
        >
          {resending ? 'Enviando…' : 'Reenviar email'}
        </button>
      </div>
    </div>
  );
}
