import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CobrancaComProblema } from '../server/cobranca';
import type { EstornosXgestao } from '../server/estornos';
import type { ContatoAdmin } from '../server/contatos';
import type { PeriodoAdmin } from '../lib/estornos';
import type { CanalContato } from '../lib/contato-assinante';
import type { XgestaoAssinanteDetalhe, XgestaoAssinantePagina, XgestaoFaturamento } from '../server/assinantes';
import type { XgestaoObraDetalhe } from '../server/obra-detalhe';
import type { MetricasComerciais } from '../server/comercial';
import type { EngajamentoXgestao } from '../server/engajamento';
import type { MesHistorico } from '../lib/historico-mensal';
import type { XgestaoAdminObraRow, XgestaoObraStatus, XgestaoObrasPagina } from '../server/obras';
import type { SituacaoObra } from '../server/situacao';
import type { ProfitSummaryData } from '@features/shared/profit/types';

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const;

async function getJson<T>(url: string, erro: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    // O status vai junto para a tela diferenciar "não encontrado" de falha.
    throw Object.assign(new Error(erro), { status: response.status });
  }
  return response.json() as Promise<T>;
}

export interface XgestaoObrasFiltrosUI {
  busca?: string;
  status?: XgestaoObraStatus;
  empreiteiraId?: string;
  situacao?: SituacaoObra;
  pagina?: number;
}

export type XgestaoObrasResposta = XgestaoObrasPagina & {
  empreiteiras: Array<{ id: string; nome: string }>;
};

export function useXgestaoAdminObras(filtros: XgestaoObrasFiltrosUI) {
  const params = new URLSearchParams();
  if (filtros.busca?.trim()) params.set('q', filtros.busca.trim());
  if (filtros.status) params.set('status', filtros.status);
  if (filtros.empreiteiraId) params.set('empreiteira_id', filtros.empreiteiraId);
  if (filtros.situacao) params.set('situacao', filtros.situacao);
  if (filtros.pagina && filtros.pagina > 1) params.set('pagina', String(filtros.pagina));
  const query = params.toString();

  return useQuery<XgestaoObrasResposta>({
    // A query string entra na chave para que cada combinação de filtro tenha
    // seu próprio cache, em vez de invalidar a lista a cada digitação.
    queryKey: ['admin', 'xgestao', 'obras', query],
    queryFn: () => getJson(`/api/admin/xgestao/obras${query ? `?${query}` : ''}`, 'Erro ao listar obras do xgestão'),
    ...QUERY_CONFIG,
  });
}

export function useXgestaoAdminObra(obraId: string) {
  return useQuery<XgestaoObraDetalhe>({
    queryKey: ['admin', 'xgestao', 'obra', obraId],
    queryFn: () => getJson(`/api/admin/xgestao/obras/${obraId}`, 'Erro ao carregar a obra'),
    enabled: Boolean(obraId),
    ...QUERY_CONFIG,
  });
}

/** ADM-02 — `internas: true` lista só as contas internas/teste. */
export function useXgestaoAdminAssinantes(opcoes: { internas?: boolean } = {}) {
  const internas = Boolean(opcoes.internas);
  return useQuery<{ rows: XgestaoAssinanteDetalhe[] }>({
    queryKey: ['admin', 'xgestao', 'assinantes', internas ? 'internas' : 'base'],
    queryFn: () => getJson(`/api/admin/xgestao/assinantes${internas ? '?internas=1' : ''}`, 'Erro ao listar assinantes'),
    ...QUERY_CONFIG,
  });
}

/**
 * ADM-02 — marca/desmarca conta interna. Invalida tudo do admin xgestão: a
 * conta sai (ou volta) de todas as métricas.
 */
export function useDefinirContaInterna(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contaInterna: boolean) => {
      const response = await fetch(`/api/admin/xgestao/assinantes/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contaInterna }),
      });
      if (!response.ok) throw new Error('Não foi possível atualizar a conta.');
      return response.json() as Promise<{ contaInterna: boolean; alterou: boolean }>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'xgestao'] }),
  });
}

/** XG44 — detalhe de um assinante (`userId` do titular). */
export function useXgestaoAdminAssinante(userId: string) {
  return useQuery<XgestaoAssinantePagina>({
    queryKey: ['admin', 'xgestao', 'assinante', userId],
    queryFn: () => getJson(`/api/admin/xgestao/assinantes/${encodeURIComponent(userId)}`, 'Erro ao carregar o assinante'),
    enabled: Boolean(userId),
    // 404 é resposta definitiva: repetir só atrasa a mensagem de "não encontrado".
    retry: (tentativas, erro) => (erro as { status?: number }).status !== 404 && tentativas < 2,
    ...QUERY_CONFIG,
  });
}

/** XG46 — uso dos assinantes. */
export function useXgestaoAdminEngajamento() {
  return useQuery<EngajamentoXgestao>({
    queryKey: ['admin', 'xgestao', 'engajamento'],
    queryFn: () => getJson('/api/admin/xgestao/engajamento', 'Erro ao carregar o engajamento'),
    ...QUERY_CONFIG,
  });
}

/** XG46 — últimos 12 meses. */
export function useXgestaoAdminHistorico() {
  return useQuery<{ meses: MesHistorico[] }>({
    queryKey: ['admin', 'xgestao', 'historico'],
    queryFn: () => getJson('/api/admin/xgestao/historico', 'Erro ao carregar o histórico'),
    ...QUERY_CONFIG,
  });
}

/** XG45 — funil do teste e cancelamentos. CRM-03: `periodo` do resumo de motivos. */
export function useXgestaoAdminConversao(periodo: PeriodoAdmin = 'mes') {
  return useQuery<Pick<MetricasComerciais, 'funil' | 'recentes' | 'cancelamentos' | 'motivosCancelamento'>>({
    queryKey: ['admin', 'xgestao', 'conversao', periodo],
    queryFn: () => getJson(`/api/admin/xgestao/conversao${periodo === 'mes' ? '' : `?periodo=${periodo}`}`, 'Erro ao carregar a conversão'),
    placeholderData: (anterior) => anterior,
    ...QUERY_CONFIG,
  });
}

/** CRM-11 — `periodo` da lista de estornos e chargebacks. */
export function useXgestaoAdminFinanceiro(periodo: PeriodoAdmin = 'mes') {
  return useQuery<{ lucro: ProfitSummaryData; faturamento: XgestaoFaturamento; receita: MetricasComerciais['receita']; cobranca: CobrancaComProblema; estornos: EstornosXgestao }>({
    queryKey: ['admin', 'xgestao', 'financeiro', periodo],
    queryFn: () => getJson(`/api/admin/xgestao/financeiro${periodo === 'mes' ? '' : `?estornos=${periodo}`}`, 'Erro ao carregar o financeiro'),
    placeholderData: (anterior) => anterior,
    ...QUERY_CONFIG,
  });
}

/**
 * CRM-07 — registra um contato do admin com o responsável. Invalida o detalhe
 * e a lista (coluna "Último contato" e filtro "Nunca contatado").
 */
export function useRegistrarContato(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dados: { canal: CanalContato; nota: string | null }) => {
      const response = await fetch(`/api/admin/xgestao/assinantes/${encodeURIComponent(userId)}/contatos`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const corpo = await response.json().catch(() => null) as { message?: string; contato?: ContatoAdmin } | null;
      if (!response.ok) throw new Error(corpo?.message ?? 'Não foi possível registrar o contato.');
      return corpo!.contato!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'xgestao', 'assinante', userId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'xgestao', 'assinantes'] });
    },
  });
}

export type { XgestaoAdminObraRow, XgestaoAssinanteDetalhe, XgestaoAssinantePagina, XgestaoObraDetalhe, XgestaoObraStatus };
