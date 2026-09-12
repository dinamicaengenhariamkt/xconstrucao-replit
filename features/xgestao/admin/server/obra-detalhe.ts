import 'server-only';

import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { empreiteiras, obraShareLinks, obras, users } from '@shared/db/schema';
import { computeHealthMapForObras } from '@features/shared/health/summary-server';
import { computeProfitSummaryForObras } from '@features/shared/profit/summary-server';
import type { ObraHealth } from '@features/shared/health/types';
import type { ProfitSummaryData } from '@features/shared/profit/types';
import { buildObraPublicaView } from '@features/xgestao/obra-publica/server/projection';
import type { ObraPublicaView } from '@features/xgestao/obra-publica/types';
import { SECOES_PUBLICAS, type SecoesPublicas } from '@features/xgestao/obra-publica/secoes';
import { obraPertenceAoXgestao } from './escopo';

export interface XgestaoObraDetalhe {
  obra: {
    id: string;
    nome: string;
    status: string;
    progresso: number;
    cidade: string | null;
    uf: string | null;
    valorTotal: number;
    valorPago: number;
    dataInicio: string | null;
    dataPrevisao: string | null;
    criadaEm: string | null;
    atualizadaEm: string | null;
  };
  assinante: {
    empreiteiraId: string;
    empreiteira: string;
    responsavel: string | null;
    email: string;
  };
  /** Diagnóstico administrativo — nunca exposto no link público (XG04 §8). */
  saude: ObraHealth | null;
  lucro: ProfitSummaryData;
  linkPublico: {
    ativo: boolean;
    visualizacoes: number;
    ultimoAcessoEm: string | null;
    criadoEm: string | null;
  };
  /** Mesmo conteúdo operacional que o cliente vê, em leitura. */
  conteudo: ObraPublicaView | null;
}

function money(valor: unknown): number {
  const parsed = Number(valor ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Admin enxerga o conteúdo operacional completo, não o recorte do link. */
const TODAS_AS_SECOES = Object.fromEntries(
  SECOES_PUBLICAS.map((secao) => [secao, true]),
) as SecoesPublicas;

export async function detalheObraXgestao(obraId: string): Promise<XgestaoObraDetalhe | null> {
  // A checagem de escopo vem primeiro: sem ela, o id de uma obra de
  // marketplace abriria o detalhe por esta rota.
  if (!(await obraPertenceAoXgestao(obraId))) return null;

  const [linha] = await db
    .select({
      id: obras.id,
      nome: obras.nome,
      status: obras.status,
      progresso: obras.progresso,
      cidade: obras.cidade,
      uf: obras.uf,
      valorTotal: obras.valorTotal,
      valorPago: obras.valorPago,
      dataInicio: obras.dataInicio,
      dataPrevisao: obras.dataPrevisao,
      criadaEm: obras.createdAt,
      atualizadaEm: obras.updatedAt,
      empreiteiraId: empreiteiras.id,
      empreiteira: empreiteiras.nome,
      responsavel: users.name,
      email: users.email,
    })
    .from(obras)
    .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .innerJoin(users, eq(users.id, empreiteiras.userId))
    .where(eq(obras.id, obraId));

  if (!linha) return null;

  const [saudeMap, lucro, conteudo, [link]] = await Promise.all([
    computeHealthMapForObras([obraId]),
    computeProfitSummaryForObras([obraId]),
    buildObraPublicaView(obraId, TODAS_AS_SECOES),
    db
      .select({
        ativo: obraShareLinks.ativo,
        visualizacoes: obraShareLinks.visualizacoes,
        ultimoAcessoEm: obraShareLinks.ultimoAcessoEm,
        criadoEm: obraShareLinks.criadoEm,
      })
      .from(obraShareLinks)
      .where(and(
        eq(obraShareLinks.obraId, obraId),
        eq(obraShareLinks.ativo, true),
        or(isNull(obraShareLinks.expiraEm), gt(obraShareLinks.expiraEm, new Date())),
      ))
      .orderBy(desc(obraShareLinks.criadoEm))
      .limit(1),
  ]);

  return {
    obra: {
      id: linha.id,
      nome: linha.nome,
      status: linha.status,
      progresso: linha.progresso ?? 0,
      cidade: linha.cidade,
      uf: linha.uf,
      valorTotal: money(linha.valorTotal),
      valorPago: money(linha.valorPago),
      dataInicio: linha.dataInicio,
      dataPrevisao: linha.dataPrevisao,
      criadaEm: linha.criadaEm ? linha.criadaEm.toISOString() : null,
      atualizadaEm: linha.atualizadaEm ? linha.atualizadaEm.toISOString() : null,
    },
    assinante: {
      empreiteiraId: linha.empreiteiraId,
      empreiteira: linha.empreiteira,
      responsavel: linha.responsavel,
      email: linha.email,
    },
    saude: saudeMap[obraId] ?? null,
    lucro,
    linkPublico: {
      ativo: Boolean(link),
      visualizacoes: link?.visualizacoes ?? 0,
      ultimoAcessoEm: link?.ultimoAcessoEm ? link.ultimoAcessoEm.toISOString() : null,
      criadoEm: link?.criadoEm ? link.criadoEm.toISOString() : null,
    },
    conteudo,
  };
}
