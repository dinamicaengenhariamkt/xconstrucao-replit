'use client';

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import type { PlanoTier, PlanoPersona } from '@shared/lib/plans-catalog';
import { fetchWithSessionRefresh, SessionExpiredError } from '@features/auth/utils/authenticated-fetch';

/**
 * Hooks client-side da UI de assinatura (J15). Consomem os endpoints reais da
 * J11 — nada de preço hardcoded.
 */

export interface PlanoApi {
  id: string;
  tier: PlanoTier;
  persona: PlanoPersona | 'ambos';
  nome: string;
  descricao: string | null;
  valorMensal: string;
  valorAnual: string | null;
  features: string[];
  ativo: boolean;
}

export interface PerfilPlano {
  persona: PlanoPersona;
  plano: PlanoTier;
  planoStartedAt: string | null;
  /** Status da assinatura: "ativa" | "inadimplente" | "cancelada" | null (free) */
  assinaturaStatus: string | null;
  /** Data ISO da próxima renovação (null se free ou sem assinatura) */
  renovaEm: string | null;
  catalogo: {
    nome: string;
    precoMensal: number;
    features: string[];
    limites: Record<string, number>;
  };
  uso: Array<{ key: string; label: string; current: number; max: number }>;
  /** true se o usuário tem CPF/CNPJ cadastrado (pré-requisito para assinar) */
  hasCpfCnpj: boolean;
  somenteLeitura?: boolean;
  /** XG43 — xgestão: cancelada pelo assinante, vale até `renovaEm`. */
  cancelamentoAgendado?: boolean;
  /** XG43 — xgestão: pagamento recusado, ainda dentro da carência. */
  inadimplente?: boolean;
  /** xgestão (10/11/2026): até quando o acesso vale se cancelar agora (ISO). */
  acessoSeCancelar?: string | null;
  /** XG48 — assinatura paga vigente: troca de plano sem checkout. */
  assinaturaPaga?: boolean;
  /** XG48 — descida de plano agendada para a renovação. */
  trocaAgendada?: { planoParaId: string; tierPara: string; nomePara: string; valorPara: number; efetivaEm: string } | null;
  /**
   * XG50 — cobrança da assinatura paga que vale: ciclo, valor do ciclo e a
   * diferença proporcional de subida que entra na próxima fatura.
   */
  cobranca?: { ciclo: 'mensal' | 'anual'; valor: number; diferencaPendente: number; proximaEm: string | null; primeiraCobranca?: boolean } | null;
  /** XG50 — plano anual ligado (`platform_settings.xgestao.anualAtivo`). */
  anualDisponivel?: boolean;
  /** XG35 — só na persona xgestão. */
  teste?: {
    elegivel: boolean;
    /** 10/11/2026 — o CPF/CNPJ já usou o teste em outra conta. */
    testeNegadoPorDocumento?: boolean;
    emTeste: boolean;
    fimTeste: string | null;
    /** XG43 — quando a conta fica somente leitura (fim do teste + 24h). */
    bloqueioEm: string | null;
    emTolerancia: boolean;
    /** XG43 — 1ª cobrança de quem assina agora: +1 mês após o fim do teste. */
    primeiraCobrancaComBonus: string | null;
    /** XG50 — o +1 mês ainda vale para esta conta e este CPF/CNPJ. */
    bonusDisponivel?: boolean;
    diasRestantes: number | null;
    avisoFimPendente: boolean;
    duracaoDias: number;
    tierTeste: 'basic' | 'basic_plus' | 'premium';
  };
}

const CFG = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const;

/** Lista os planos reais da persona do usuário (`GET /api/planos`). */
export function usePlanos(persona?: PlanoPersona): UseQueryResult<PlanoApi[], Error> {
  return useQuery({
    queryKey: ['planos', 'lista', persona ?? 'padrao'],
    queryFn: async () => {
      const res = await fetch(persona ? `/api/planos?persona=${persona}` : '/api/planos');
      if (!res.ok) throw new Error('Erro ao buscar planos');
      return res.json();
    },
    ...CFG,
  });
}

/** Plano atual + uso/limites (`GET /api/perfil/plano`). */
export function usePerfilPlano(
  persona?: PlanoPersona,
  options?: { enabled?: boolean },
): UseQueryResult<PerfilPlano, Error> {
  return useQuery({
    queryKey: ['perfil', 'plano', persona ?? 'padrao'],
    queryFn: async () => {
      const res = await fetch(persona ? `/api/perfil/plano?persona=${persona}` : '/api/perfil/plano');
      if (!res.ok) throw new Error('Erro ao buscar plano atual');
      return res.json();
    },
    ...CFG,
    // XG37 — membro do xgestão recebe 403 nesta rota; quem não decide o plano não consulta.
    staleTime: persona === 'xgestao' ? 0 : CFG.staleTime,
    refetchOnWindowFocus: persona === 'xgestao',
    refetchInterval: persona === 'xgestao' ? 30_000 : false,
    enabled: options?.enabled ?? true,
  });
}

export type CheckoutResponse =
  | { ok: true; kind: 'activated'; assinaturaId: string; primeiraCobrancaEm?: string }
  | { ok: true; kind: 'redirect'; url: string; primeiraCobrancaEm?: string };

export class CheckoutError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'CheckoutError';
    this.status = status;
    this.code = code;
  }
}

/** Inicia o checkout. Trata os dois `kind` (activated/redirect) no caller. */
export function useCheckout(persona?: PlanoPersona) {
  const qc = useQueryClient();
  return useMutation<CheckoutResponse, CheckoutError, { planoId: string; ciclo: 'mensal' | 'anual' }>({
    mutationFn: async ({ planoId, ciclo }) => {
      let res: Response;
      try {
        res = await fetchWithSessionRefresh('/api/assinaturas/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planoId, ciclo, ...(persona ? { persona } : {}) }),
        });
      } catch (error) {
        if (error instanceof SessionExpiredError) {
          throw new CheckoutError(error.message, 401, 'SESSION_EXPIRED');
        }
        throw error;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          throw new CheckoutError('Sua sessão expirou. Faça login novamente para continuar.', 401, 'SESSION_EXPIRED');
        }
        throw new CheckoutError(data?.message ?? 'Erro ao assinar.', res.status, data?.code);
      }
      return data as CheckoutResponse;
    },
    onSuccess: (data) => {
      if (data.kind === 'redirect') {
        // Guarda defensiva: redirect sem URL não navega para "undefined".
        if (data.url) window.location.assign(data.url);
        return;
      }
      // Ativação imediata (adapter manual) → atualizar plano/uso.
      void qc.invalidateQueries({ queryKey: ['perfil', 'plano'] });
    },
  });
}

/** XG48 — resposta da prévia da troca (`POST /api/assinaturas/trocar` com `previa`). */
export interface PreviaTroca {
  acao: 'subir' | 'subir_sem_proporcional' | 'descer' | 'descer_imediata' | 'desfazer' | 'desfazer_e_subir';
  tipo: 'subir' | 'descer' | 'desfazer';
  planoAtual: { id: string; tier: string; nome: string; valor: number };
  planoNovo: { id: string; tier: string; nome: string; valor: number };
  efetivaEm: string;
  proximaFaturaEm: string | null;
  diferenca: number;
  diasRestantes: number;
  diasCiclo: number;
  valorProximaFatura: number;
  valorDepois: number;
  excedentes: {
    obras: { limite: number; emAndamento: Array<{ id: string; nome: string }>; precisaEscolher: boolean };
    membros: { limite: number; lista: Array<{ id: string; nome: string | null; email: string | null; status: string }>; precisaEscolher: boolean };
    links: { limitePorObra: number; pausados: number };
    perdeValoresPublicos: boolean;
  } | null;
}

export class TrocaError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = 'TrocaError';
  }
}

async function postTroca<T>(body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetchWithSessionRefresh('/api/assinaturas/trocar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, persona: 'xgestao' }),
    });
  } catch (error) {
    if (error instanceof SessionExpiredError) throw new TrocaError(error.message, 401, 'SESSION_EXPIRED');
    throw error;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new TrocaError(data?.message ?? 'Não foi possível mudar de plano.', res.status, data?.code);
  return data as T;
}

/** XG48 — calcula a troca sem efeito (proporcional, próxima fatura, excedentes). */
export function usePreviaTroca() {
  return useMutation<PreviaTroca, TrocaError, { planoId: string }>({
    mutationFn: ({ planoId }) => postTroca<PreviaTroca>({ planoId, previa: true }),
  });
}

/** XG48 — confirma a troca. `chave` é única por diálogo: clique duplo aplica uma vez. */
export function useConfirmarTroca() {
  const qc = useQueryClient();
  return useMutation<
    { ok: true; trocaId: string; status: string; repetida: boolean; previa: PreviaTroca | null },
    TrocaError,
    { planoId: string; chave: string; obras?: string[]; membros?: string[]; ciente?: boolean }
  >({
    mutationFn: (input) => postTroca(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['perfil', 'plano'] });
    },
  });
}

/** Cancela a assinatura ativa (marketplace: volta para free; xgestão: vale até `acessoAte`). */
export function useCancelarAssinatura(persona?: PlanoPersona) {
  const qc = useQueryClient();
  // CRM-03 — o xgestão pode mandar o motivo (opcional); o marketplace chama sem nada.
  return useMutation<{ ok: boolean; acessoAte?: string | null }, Error, { motivo?: string | null; motivoTexto?: string | null } | void>({
    mutationFn: async (motivo) => {
      const res = await fetch('/api/assinaturas/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(persona ? { persona } : {}),
          ...(persona === 'xgestao' && motivo ? { motivo: motivo.motivo ?? null, motivoTexto: motivo.motivoTexto ?? null } : {}),
        }),
      });
      if (!res.ok) throw new Error('Erro ao cancelar assinatura');
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['perfil', 'plano'] });
    },
  });
}
