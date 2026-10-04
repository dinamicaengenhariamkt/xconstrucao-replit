import 'server-only';

import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { empreiteiras, obraShareLinks, obras, users } from '@shared/db/schema';
import { computeProfitSummaryForObras } from '@features/shared/profit/summary-server';
import type { ProfitSummaryData } from '@features/shared/profit/types';
import { buildObraPublicaView } from '@features/xgestao/obra-publica/server/projection';
import type { ObraPublicaView } from '@features/xgestao/obra-publica/types';
import { SECOES_PUBLICAS, type SecoesPublicas } from '@features/xgestao/obra-publica/secoes';
import { obraPertenceAoXgestao } from './escopo';
import { custoRealPorObra } from './custo-real';

export interface XgestaoObraDetalhe {
  obra: {
    id: string;
    nome: string;
    status: string;
    cidade: string | null;
    uf: string | null;
    valorTotal: number;
    /** Custo real: saídas pagas pelo dono (`custo-real.ts`), não `obras.valor_pago`. */
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
  lucro: ProfitSummaryData;
  linkPublico: {
    ativo: boolean;
    visualizacoes: number;
    ultimoAcessoEm: string | null;
    criadoEm: string | null;
  };
  /** XG36 — todos os links ativos (a XG30 permite até 5 por obra, um por público). */
  linksPublicos: Array<{
    nome: string;
    visualizacoes: number;
    ultimoAcessoEm: string | null;
    criadoEm: string | null;
    expiraEm: string | null;
  }>;
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
      cidade: obras.cidade,
      uf: obras.uf,
      valorTotal: obras.valorTotal,
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

  // XG34 — sem Saúde: dependia de `obras.progresso`/`obras.valor_pago`, que o xgestão não escreve.
  const [lucro, conteudo, custoPorObra, links] = await Promise.all([
    computeProfitSummaryForObras([obraId]),
    buildObraPublicaView(obraId, TODAS_AS_SECOES),
    custoRealPorObra([obraId]),
    db
      .select({
        nome: obraShareLinks.nome,
        expiraEm: obraShareLinks.expiraEm,
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
      .orderBy(desc(obraShareLinks.criadoEm)),
  ]);
  const iso = (data: Date | null) => (data ? data.toISOString() : null);
  const ultimoAcesso = links
    .map((l) => l.ultimoAcessoEm)
    .filter((data): data is Date => Boolean(data))
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return {
    obra: {
      id: linha.id,
      nome: linha.nome,
      status: linha.status,
      cidade: linha.cidade,
      uf: linha.uf,
      valorTotal: money(linha.valorTotal),
      valorPago: custoPorObra.get(obraId) ?? 0,
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
    lucro,
    // Resumo agregado de todos os links ativos (antes só o mais recente contava).
    linkPublico: {
      ativo: links.length > 0,
      visualizacoes: links.reduce((total, l) => total + (l.visualizacoes ?? 0), 0),
      ultimoAcessoEm: iso(ultimoAcesso),
      criadoEm: iso(links[links.length - 1]?.criadoEm ?? null),
    },
    linksPublicos: links.map((l) => ({
      nome: l.nome,
      visualizacoes: l.visualizacoes ?? 0,
      ultimoAcessoEm: iso(l.ultimoAcessoEm),
      criadoEm: iso(l.criadoEm),
      expiraEm: iso(l.expiraEm),
    })),
    conteudo,
  };
}
