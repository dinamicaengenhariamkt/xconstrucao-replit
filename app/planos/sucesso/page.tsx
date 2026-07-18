'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { RiCheckboxCircleFill, RiLoader4Line, RiTimeLine, RiArrowRightLine } from 'react-icons/ri';
import type { PerfilPlano } from '@features/planos/ui/use-planos';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 10000;

async function fetchPerfilPlano(): Promise<PerfilPlano> {
  const res = await fetch('/api/perfil/plano', { cache: 'no-store' });
  if (!res.ok) throw new Error('Erro ao verificar plano');
  return res.json();
}

type Status = 'polling' | 'activated' | 'timeout';

export default function PlanosSucessoPage() {
  const startTimeRef = useRef<number>(Date.now());
  const [status, setStatus] = useState<Status>('polling');
  const [tierInicial, setTierInicial] = useState<string | null>(null);

  const { data, isError } = useQuery<PerfilPlano, Error>({
    queryKey: ['planos', 'sucesso-poll'],
    queryFn: fetchPerfilPlano,
    refetchInterval: status === 'polling' ? POLL_INTERVAL_MS : false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (!data) return;

    if (tierInicial === null) {
      setTierInicial(data.plano);
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;

    if (data.plano !== 'free' && data.plano !== tierInicial) {
      setStatus('activated');
      return;
    }

    if (elapsed >= POLL_TIMEOUT_MS) {
      setStatus('timeout');
    }
  }, [data, tierInicial]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === 'polling') setStatus('timeout');
    }, POLL_TIMEOUT_MS + POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const dashboardHref =
    data?.persona === 'empreiteiro'
      ? '/empreiteiro/dashboard'
      : data?.persona === 'contratante'
        ? '/contratante/dashboard'
        : '/';

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-[#1C1F22] flex items-center justify-center px-4"
      data-testid="planos-sucesso-page"
    >
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 text-center space-y-6">

          {status === 'polling' && (
            <>
              <div className="flex justify-center">
                <RiLoader4Line
                  className="w-16 h-16 text-primary animate-spin"
                  data-testid="icon-polling-spinner"
                />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Pagamento recebido!
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Sua assinatura será ativada em instantes.{' '}
                  <br className="hidden sm:block" />
                  Aguarde enquanto confirmamos com o gateway…
                </p>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
              </div>
            </>
          )}

          {status === 'activated' && (
            <>
              <div className="flex justify-center">
                <RiCheckboxCircleFill
                  className="w-16 h-16 text-emerald-500"
                  data-testid="icon-activated"
                />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Assinatura ativada!
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Seu plano{' '}
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">
                    {data?.catalogo?.nome ?? data?.plano}
                  </span>{' '}
                  já está ativo. Aproveite todos os recursos da plataforma.
                </p>
              </div>
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
                data-testid="link-ir-dashboard"
              >
                Ir para o dashboard
                <RiArrowRightLine className="w-4 h-4" />
              </Link>
            </>
          )}

          {status === 'timeout' && !isError && (
            <>
              <div className="flex justify-center">
                <RiTimeLine
                  className="w-16 h-16 text-amber-500"
                  data-testid="icon-timeout"
                />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Quase lá!
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Seu pagamento foi recebido. A ativação pode levar alguns instantes
                  dependendo do método de pagamento escolhido.
                  <br /><br />
                  Se o plano não aparecer ativo em alguns minutos, entre em contato
                  com o suporte.
                </p>
              </div>
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
                data-testid="link-ir-dashboard-timeout"
              >
                Ir para o dashboard
                <RiArrowRightLine className="w-4 h-4" />
              </Link>
            </>
          )}

          {isError && (
            <>
              <div className="flex justify-center">
                <RiTimeLine className="w-16 h-16 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Pagamento recebido
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Não foi possível verificar o status da assinatura agora.
                  Acesse o dashboard para confirmar.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
                data-testid="link-ir-home-error"
              >
                Ir para a plataforma
                <RiArrowRightLine className="w-4 h-4" />
              </Link>
            </>
          )}

        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          XConstrução · Planos e Assinaturas
        </p>
      </div>
    </div>
  );
}
