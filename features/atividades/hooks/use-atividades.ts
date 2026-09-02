'use client';

import { useInfiniteQuery, useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { AtividadeTipo } from '@shared/db/schema';

export interface AtividadeFeedItem {
  id: string;
  tipo: AtividadeTipo;
  actorUserId: string | null;
  obraId: string | null;
  targetUserId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  actorName: string | null;
  actorRole: string | null;
  obraNome: string | null;
}

export interface AtividadesPage {
  items: AtividadeFeedItem[];
  nextCursor: string | null;
}

async function fetchAtividades(params: {
  limit?: number;
  obraId?: string;
  tipos?: AtividadeTipo[];
  cursor?: string;
}): Promise<AtividadesPage> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.obraId) qs.set('obraId', params.obraId);
  if (params.tipos && params.tipos.length > 0) qs.set('tipo', params.tipos.join(','));
  if (params.cursor) qs.set('cursor', params.cursor);
  const res = await fetch(`/api/atividades?${qs.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao carregar atividades');
  return res.json();
}

/**
 * Atividades recentes para o widget de dashboard (3 personas).
 * Backend já aplica visibility gate por persona — basta chamar.
 */
export function useAtividadesRecentes(limit = 10): UseQueryResult<AtividadesPage, Error> {
  return useQuery({
    queryKey: ['atividades', 'recentes', limit],
    queryFn: () => fetchAtividades({ limit }),
    staleTime: 60_000,
  });
}

/**
 * Feed completo de atividades do usuário, paginado por cursor (página dedicada
 * "Atividades"). Acumula as páginas — o consumidor usa `fetchNextPage`/`hasNextPage`
 * para carregar mais e pagina o conjunto acumulado client-side. Backend já aplica
 * o visibility gate por persona.
 */
export function useAtividadesFeed(limit = 50) {
  return useInfiniteQuery({
    queryKey: ['atividades', 'feed', limit],
    queryFn: ({ pageParam }) => fetchAtividades({ limit, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}

/**
 * Atividades de uma obra específica (timeline da obra).
 */
export function useAtividadesObra(obraId: string | null | undefined, limit = 50) {
  return useQuery({
    queryKey: ['atividades', 'obra', obraId, limit],
    queryFn: () => fetchAtividades({ obraId: obraId!, limit }),
    enabled: !!obraId,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Helpers de apresentação (compartilhados pelos 3 dashboards + timeline).
// ---------------------------------------------------------------------------

export interface AtividadeDisplay {
  id: string;
  titulo: string;
  descricao: string;
  obraNome: string | null;
  obraId: string | null;
  actorName: string;
  /** Categoria para o TimelineDisplay (5 buckets). */
  tipoTimeline: 'progresso' | 'tarefa' | 'documento' | 'problema' | 'nota';
  /** Ícone para os cards de dashboard. */
  icon: 'check' | 'upload' | 'edit' | 'payment' | 'alert';
  color: 'success' | 'info' | 'warning' | 'purple' | 'amber' | 'primary';
  /** Timestamp ISO crua, para formatadores. */
  createdAt: string;
  href: string | null;
}

const TIPO_META: Record<
  AtividadeTipo,
  {
    titulo: string;
    tipoTimeline: AtividadeDisplay['tipoTimeline'];
    icon: AtividadeDisplay['icon'];
    color: AtividadeDisplay['color'];
  }
> = {
  obra_publicada:        { titulo: 'Obra publicada',         tipoTimeline: 'documento', icon: 'upload',  color: 'info' },
  candidatura_criada:    { titulo: 'Nova candidatura',       tipoTimeline: 'tarefa',    icon: 'edit',    color: 'info' },
  candidatura_aceita:    { titulo: 'Candidatura aceita',     tipoTimeline: 'progresso', icon: 'check',   color: 'success' },
  candidatura_rejeitada: { titulo: 'Candidatura recusada',   tipoTimeline: 'tarefa',    icon: 'edit',    color: 'warning' },
  candidatura_cancelada: { titulo: 'Candidatura cancelada',  tipoTimeline: 'tarefa',    icon: 'edit',    color: 'warning' },
  medicao_criada:        { titulo: 'Medição registrada',     tipoTimeline: 'progresso', icon: 'edit',    color: 'info' },
  medicao_aprovada:      { titulo: 'Medição aprovada',       tipoTimeline: 'progresso', icon: 'check',   color: 'success' },
  medicao_contestada:    { titulo: 'Medição contestada',     tipoTimeline: 'problema',  icon: 'alert',   color: 'warning' },
  diario_postado:        { titulo: 'Anotação no diário',     tipoTimeline: 'nota',      icon: 'upload',  color: 'info' },
  ocorrencia_aberta:     { titulo: 'Ocorrência aberta',      tipoTimeline: 'problema',  icon: 'alert',   color: 'warning' },
  ocorrencia_resolvida:  { titulo: 'Ocorrência resolvida',   tipoTimeline: 'progresso', icon: 'check',   color: 'success' },
  lancamento_criado:     { titulo: 'Fatura emitida',         tipoTimeline: 'documento', icon: 'payment', color: 'purple' },
  lancamento_quitado:    { titulo: 'Pagamento efetuado',     tipoTimeline: 'progresso', icon: 'payment', color: 'success' },
  disputa_aberta:        { titulo: 'Disputa aberta',         tipoTimeline: 'problema',  icon: 'alert',   color: 'amber' },
  disputa_resolvida:     { titulo: 'Disputa resolvida',      tipoTimeline: 'progresso', icon: 'check',   color: 'success' },
};

function describePayload(tipo: AtividadeTipo, payload: Record<string, unknown>, obraNome: string | null): string {
  const obra = obraNome ?? 'obra';
  const medicaoDetalhes = (includeEtapa = true) => {
    const etapa = includeEtapa && typeof payload.etapa === 'string' && payload.etapa ? ` · ${payload.etapa}` : '';
    const percentual = Number(payload.percentual);
    const percentualLabel = Number.isFinite(percentual) ? ` · +${percentual}%` : '';
    const valor = Number(payload.valor);
    const valorLabel = Number.isFinite(valor) && valor > 0
      ? ` · ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}`
      : '';
    return `${etapa}${percentualLabel}${valorLabel}`;
  };
  switch (tipo) {
    case 'obra_publicada':
      return `Obra "${obra}" foi publicada e está aberta a propostas.`;
    case 'candidatura_criada':
      return `Nova proposta enviada para "${obra}".`;
    case 'candidatura_aceita':
      return `Proposta aceita em "${obra}".`;
    case 'candidatura_rejeitada': {
      const motivo = typeof payload.motivo === 'string' ? payload.motivo : null;
      return motivo ? `Proposta recusada em "${obra}" — ${motivo}.` : `Proposta recusada em "${obra}".`;
    }
    case 'candidatura_cancelada':
      return `Proposta cancelada em "${obra}".`;
    case 'medicao_criada': {
      const numero = payload.numero ?? '?';
      const etapa = payload.etapa ?? '';
      return `Medição #${numero}${etapa ? ` (${etapa})` : ''} enviada em "${obra}"${medicaoDetalhes(false)}.`;
    }
    case 'medicao_aprovada': {
      const numero = payload.numero ?? '?';
      const lanc = payload.lancamentoId ? ' Fatura gerada automaticamente.' : '';
      return `Medição #${numero} aprovada em "${obra}"${medicaoDetalhes()}.${lanc}`;
    }
    case 'medicao_contestada': {
      const motivo = typeof payload.motivo === 'string' ? payload.motivo : null;
      return motivo ? `Medição contestada em "${obra}" — ${motivo}.` : `Medição contestada em "${obra}".`;
    }
    case 'diario_postado':
      return `Nova anotação no diário de "${obra}".`;
    case 'ocorrencia_aberta': {
      const titulo = typeof payload.titulo === 'string' ? payload.titulo : 'sem título';
      return `Ocorrência em "${obra}": ${titulo}.`;
    }
    case 'ocorrencia_resolvida':
      return `Ocorrência resolvida em "${obra}".`;
    case 'lancamento_criado': {
      const valor = typeof payload.valor === 'number' ? payload.valor : null;
      const fmt = valor != null
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
        : null;
      return fmt ? `Fatura de ${fmt} criada em "${obra}".` : `Nova fatura emitida em "${obra}".`;
    }
    case 'lancamento_quitado': {
      const valor = typeof payload.valor === 'number' ? payload.valor : null;
      const fmt = valor != null
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
        : null;
      return fmt ? `Pagamento de ${fmt} efetuado em "${obra}".` : `Pagamento efetuado em "${obra}".`;
    }
    case 'disputa_aberta': {
      const titulo = typeof payload.titulo === 'string' ? payload.titulo : null;
      return titulo ? `Disputa aberta em "${obra}": ${titulo}.` : `Disputa aberta em "${obra}".`;
    }
    case 'disputa_resolvida': {
      const tipo = typeof payload.resolucaoTipo === 'string' ? payload.resolucaoTipo : null;
      return tipo ? `Disputa resolvida em "${obra}" (${tipo}).` : `Disputa resolvida em "${obra}".`;
    }
  }
}

function buildHref(tipo: AtividadeTipo, obraId: string | null, role: 'contratante' | 'empreiteiro' | 'admin'): string | null {
  if (!obraId) return null;
  const base =
    role === 'contratante' ? `/contratante/minhas-obras/${obraId}` :
    role === 'empreiteiro' ? `/empreiteiro/minhas-obras/${obraId}` :
    `/admin/obras/${obraId}`;
  return base;
}

export function toAtividadeDisplay(
  item: AtividadeFeedItem,
  viewerRole: 'contratante' | 'empreiteiro' | 'admin',
): AtividadeDisplay {
  const meta = TIPO_META[item.tipo];
  return {
    id: item.id,
    titulo: meta.titulo,
    descricao: describePayload(item.tipo, item.payload ?? {}, item.obraNome),
    obraNome: item.obraNome,
    obraId: item.obraId,
    actorName: item.actorName ?? 'Sistema',
    tipoTimeline: meta.tipoTimeline,
    icon: meta.icon,
    color: meta.color,
    createdAt: item.createdAt,
    href: buildHref(item.tipo, item.obraId, viewerRole),
  };
}

const RELATIVE_RULES: Array<{ limitMs: number; render: (ms: number) => string }> = [
  { limitMs: 60_000, render: () => 'agora há pouco' },
  { limitMs: 3_600_000, render: (ms) => `há ${Math.max(1, Math.round(ms / 60_000))} min` },
  { limitMs: 86_400_000, render: (ms) => `há ${Math.max(1, Math.round(ms / 3_600_000))} h` },
  { limitMs: 7 * 86_400_000, render: (ms) => `há ${Math.max(1, Math.round(ms / 86_400_000))} d` },
  { limitMs: 30 * 86_400_000, render: (ms) => `há ${Math.max(1, Math.round(ms / (7 * 86_400_000)))} sem` },
];

export function formatRelativeBr(iso: string): string {
  const dt = new Date(iso);
  const ms = Date.now() - dt.getTime();
  if (ms < 0) return 'agora há pouco';
  for (const rule of RELATIVE_RULES) {
    if (ms < rule.limitMs) return rule.render(ms);
  }
  return dt.toLocaleDateString('pt-BR');
}
