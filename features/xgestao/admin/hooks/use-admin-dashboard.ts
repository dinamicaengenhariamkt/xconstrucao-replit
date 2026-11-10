import { useQuery } from '@tanstack/react-query';
import type { XgestaoAdminDashboard } from '../server/dashboard';
import type { assinantesQuePedemAtencao } from '../server/assinantes';
import type { resumoComercial } from '../server/comercial';
import type { ResumoEngajamento } from '../lib/engajamento';
import type { ResumoAssinaturas } from '../lib/situacao-assinante';
import type { CobrancaComProblema } from '../server/cobranca';

/** XG44 — a rota da home acrescenta o resumo das assinaturas ao painel. */
export type XgestaoAdminHome = XgestaoAdminDashboard & {
  comercial: ReturnType<typeof resumoComercial>;
  engajamento: ResumoEngajamento;
  assinaturas: {
    resumo: ResumoAssinaturas;
    atencao: ReturnType<typeof assinantesQuePedemAtencao>;
  };
  /** ADM-03 — card "Cobrança com problema". */
  cobranca: Pick<CobrancaComProblema, 'assinantes' | 'totais'>;
};

export function useXgestaoAdminDashboard() {
  return useQuery<XgestaoAdminHome>({
    queryKey: ['admin', 'xgestao', 'dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/admin/xgestao');
      if (!response.ok) throw new Error('Erro ao buscar a visão administrativa do xgestão');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}