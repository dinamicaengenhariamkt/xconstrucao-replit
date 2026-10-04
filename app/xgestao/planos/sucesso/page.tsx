'use client';

/**
 * XG33 AJ-01 — retorno do checkout de assinatura do xgestão.
 *
 * Mesma mecânica de `/planos/sucesso` (marketplace): a ativação acontece no
 * webhook do gateway, então a tela consulta o plano até ele mudar. A diferença é
 * o produto: lê o plano da persona xgestão e devolve o assinante ao dashboard do
 * xgestão. Fica sob `app/xgestao/`, então herda o layout com a guarda de acesso.
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { RiCheckboxCircleFill, RiLoader4Line, RiTimeLine, RiArrowRightLine } from 'react-icons/ri';
import type { PerfilPlano } from '@features/planos/ui/use-planos';
import { XGESTAO_HOME } from '@features/xgestao/routes';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 10000;
const PLANO_HREF = '/xgestao/configuracoes?tab=plano';

async function fetchPerfilPlanoXgestao(): Promise<PerfilPlano> {
  const res = await fetch('/api/perfil/plano?persona=xgestao', { cache: 'no-store' });
  if (!res.ok) throw new Error('Erro ao verificar plano');
  return res.json();
}

type Status = 'polling' | 'activated' | 'timeout';

export default function XGestaoPlanoSucessoPage() {
  const startTimeRef = useRef<number>(Date.now());
  const [status, setStatus] = useState<Status>('polling');
  const [tierInicial, setTierInicial] = useState<string | null>(null);
  // XG35 — no teste do Pro, assinar o Pro não muda o tier: a ativação aparece
  // como "deixou de estar em teste" com plano pago.
  const [estavaEmTeste, setEstavaEmTeste] = useState(false);

  const { data, isError } = useQuery<PerfilPlano, Error>({
    queryKey: ['xgestao', 'plano', 'sucesso-poll'],
    queryFn: fetchPerfilPlanoXgestao,
    refetchInterval: status === 'polling' ? POLL_INTERVAL_MS : false,
    staleTime: 0,
    gcTime: 0,
    retry: 2,
  });

  useEffect(() => {
    if (!data) return;

    if (tierInicial === null) {
      setTierInicial(data.plano);
      setEstavaEmTeste(Boolean(data.teste?.emTeste));
      return;
    }

    const saiuDoTeste = estavaEmTeste && !data.teste?.emTeste;
    if (data.plano !== 'free' && (data.plano !== tierInicial || saiuDoTeste)) {
      setStatus('activated');
      return;
    }

    if (Date.now() - startTimeRef.current >= POLL_TIMEOUT_MS) {
      setStatus('timeout');
    }
  }, [data, tierInicial, estavaEmTeste]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === 'polling') setStatus('timeout');
    }, POLL_TIMEOUT_MS + POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <div className="flex items-center justify-center px-4 py-12" data-testid="xgestao-plano-sucesso-page">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 text-center space-y-6">
        {status === 'polling' && !isError && (
          <>
            <div className="flex justify-center">
              <RiLoader4Line className="w-16 h-16 text-primary animate-spin" data-testid="icon-polling-spinner" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Pagamento recebido!
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Sua assinatura será ativada em instantes. Aguarde enquanto confirmamos o pagamento.
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
              <RiCheckboxCircleFill className="w-16 h-16 text-emerald-500" data-testid="icon-activated" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Assinatura ativada!
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Seu plano{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {data?.catalogo?.nome ?? data?.plano}
                </span>{' '}
                já está ativo.
              </p>
            </div>
            <Link
              href={XGESTAO_HOME}
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
              data-testid="link-ir-dashboard"
            >
              Ir para o dashboard
              <RiArrowRightLine className="w-4 h-4" />
            </Link>
          </>
        )}

        {(status === 'timeout' || isError) && status !== 'activated' && (
          <>
            <div className="flex justify-center">
              <RiTimeLine className="w-16 h-16 text-amber-500" data-testid="icon-timeout" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Quase lá!
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {isError
                  ? 'Não foi possível verificar a assinatura agora. Confira o seu plano em instantes.'
                  : 'Seu pagamento foi recebido. A ativação pode levar alguns instantes, dependendo do método de pagamento.'}
                <br /><br />
                Se o plano não aparecer ativo em alguns minutos, entre em contato com o suporte.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={PLANO_HREF}
                className="inline-flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                data-testid="link-ver-plano"
              >
                Ver meu plano
              </Link>
              <Link
                href={XGESTAO_HOME}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
                data-testid="link-ir-dashboard-timeout"
              >
                Ir para o dashboard
                <RiArrowRightLine className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
