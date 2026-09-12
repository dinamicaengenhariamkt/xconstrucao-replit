import 'server-only';

import { and, asc, count, desc, eq, gt, ilike, inArray, isNull, or, type SQL } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { empreiteiras, obraShareLinks, obras } from '@shared/db/schema';
import { computeProfitSummaryForObras } from '@features/shared/profit/summary-server';
import { computeHealthMapForObras } from '@features/shared/health/summary-server';
import type { ObraHealth } from '@features/shared/health/types';
import type { ProfitSummaryData } from '@features/shared/profit/types';
import { filtroObrasXgestao, listarEmpreiteiraIdsXgestao } from './escopo';

export type XgestaoObraStatus = 'planejamento' | 'em_andamento' | 'pausada' | 'concluida';

export interface XgestaoAdminObraRow {
  id: string;
  nome: string;
  empreiteira: string;
  empreiteiraId: string;
  status: XgestaoObraStatus;
  progresso: number;
  cidade: string | null;
  uf: string | null;
  valorTotal: number;
  valorPago: number;
  dataPrevisao: string | null;
  atualizadaEm: string | null;
  linkPublicoAtivo: boolean;
  saude: ObraHealth | null;
}

export interface XgestaoObrasFiltros {
  busca?: string;
  status?: XgestaoObraStatus;
  empreiteiraId?: string;
  pagina?: number;
  porPagina?: number;
}

export interface XgestaoObrasPagina {
  rows: XgestaoAdminObraRow[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

const POR_PAGINA_PADRAO = 20;
const POR_PAGINA_MAX = 100;

function money(valor: unknown): number {
  const parsed = Number(valor ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Lista paginada das obras do produto.
 *
 * Substitui o corte de 12 obras do painel: com busca e filtro, o administrador
 * chega a uma obra específica em vez de só ver as mais recentes.
 */
export async function listarObrasXgestao(filtros: XgestaoObrasFiltros = {}): Promise<XgestaoObrasPagina> {
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const porPagina = Math.min(POR_PAGINA_MAX, Math.max(1, filtros.porPagina ?? POR_PAGINA_PADRAO));

  const empreiteiraIds = await listarEmpreiteiraIdsXgestao();
  const escopo = filtroObrasXgestao(empreiteiraIds);
  if (!escopo) {
    return { rows: [], total: 0, pagina, porPagina, totalPaginas: 0 };
  }

  const condicoes: SQL[] = [escopo];
  if (filtros.status) condicoes.push(eq(obras.status, filtros.status));
  if (filtros.empreiteiraId) condicoes.push(eq(obras.empreiteiraId, filtros.empreiteiraId));
  if (filtros.busca?.trim()) {
    const termo = `%${filtros.busca.trim()}%`;
    condicoes.push(
      or(ilike(obras.nome, termo), ilike(empreiteiras.nome, termo), ilike(obras.cidade, termo)) as SQL,
    );
  }
  const where = and(...condicoes) as SQL;

  const [linhas, [totalRow]] = await Promise.all([
    db
      .select({
        id: obras.id,
        nome: obras.nome,
        empreiteira: empreiteiras.nome,
        empreiteiraId: empreiteiras.id,
        status: obras.status,
        progresso: obras.progresso,
        cidade: obras.cidade,
        uf: obras.uf,
        valorTotal: obras.valorTotal,
        valorPago: obras.valorPago,
        dataPrevisao: obras.dataPrevisao,
        atualizadaEm: obras.updatedAt,
      })
      .from(obras)
      .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
      .where(where)
      // O desempate por id mantém a ordem estável entre páginas: com
      // `updatedAt` repetido (seed, import em lote) o Postgres não garante
      // ordem, e a mesma obra poderia repetir ou sumir ao paginar.
      .orderBy(desc(obras.updatedAt), desc(obras.id))
      .limit(porPagina)
      .offset((pagina - 1) * porPagina),
    db
      .select({ total: count() })
      .from(obras)
      .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
      .where(where),
  ]);

  const obraIds = linhas.map((linha) => linha.id);
  // A saúde é agregada em lote: uma consulta para a página inteira, em vez de
  // uma por linha renderizada.
  const [saude, linksAtivos] = await Promise.all([
    computeHealthMapForObras(obraIds),
    obraIds.length === 0
      ? Promise.resolve([] as Array<{ obraId: string }>)
      : db
        .select({ obraId: obraShareLinks.obraId })
        .from(obraShareLinks)
        // A expiração é avaliada na leitura, não por job: um link vencido
        // continua `ativo = true` na tabela. Sem o `or` abaixo, a lista diria
        // "link ativo" para um link que já não abre.
        .where(and(
          inArray(obraShareLinks.obraId, obraIds),
          eq(obraShareLinks.ativo, true),
          or(isNull(obraShareLinks.expiraEm), gt(obraShareLinks.expiraEm, new Date())),
        )),
  ]);
  const comLink = new Set(linksAtivos.map((link) => link.obraId));

  const total = totalRow?.total ?? 0;
  return {
    rows: linhas.map((linha) => ({
      id: linha.id,
      nome: linha.nome,
      empreiteira: linha.empreiteira,
      empreiteiraId: linha.empreiteiraId,
      status: linha.status as XgestaoObraStatus,
      progresso: linha.progresso ?? 0,
      cidade: linha.cidade,
      uf: linha.uf,
      valorTotal: money(linha.valorTotal),
      valorPago: money(linha.valorPago),
      dataPrevisao: linha.dataPrevisao,
      atualizadaEm: linha.atualizadaEm ? linha.atualizadaEm.toISOString() : null,
      linkPublicoAtivo: comLink.has(linha.id),
      saude: saude[linha.id] ?? null,
    })),
    total,
    pagina,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
  };
}

/** Lucro consolidado das obras do produto, para o painel financeiro. */
export async function lucroObrasXgestao(
  /** Reaproveita os ids quando o chamador já os resolveu. */
  empreiteiraIdsCarregados?: string[],
): Promise<ProfitSummaryData> {
  const empreiteiraIds = empreiteiraIdsCarregados ?? (await listarEmpreiteiraIdsXgestao());
  const escopo = filtroObrasXgestao(empreiteiraIds);
  if (!escopo) {
    return { metrics: { receitaTotal: 0, custoTotal: 0, lucroEstimado: 0, margem: 0 }, trend: [], totalObras: 0 };
  }

  const linhas = await db.select({ id: obras.id }).from(obras).where(escopo);
  return computeProfitSummaryForObras(linhas.map((linha) => linha.id));
}

/** Opções do filtro por empreiteira, restritas ao recorte. */
export async function listarEmpreiteirasXgestao(): Promise<Array<{ id: string; nome: string }>> {
  const empreiteiraIds = await listarEmpreiteiraIdsXgestao();
  if (empreiteiraIds.length === 0) return [];
  return db
    .select({ id: empreiteiras.id, nome: empreiteiras.nome })
    .from(empreiteiras)
    .where(inArray(empreiteiras.id, empreiteiraIds))
    .orderBy(asc(empreiteiras.nome));
}
