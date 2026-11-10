import 'server-only';

import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { financeiro } from '@shared/db/schema';
import { ORIGEM_ESTORNO_MENSALIDADE_XGESTAO } from '@features/xgestao/lib/receita';
import { classificarEstorno, inicioDoPeriodo, type PeriodoAdmin, type TipoEstorno } from '../lib/estornos';
import type { XgestaoAssinanteDetalhe } from './assinantes';

/**
 * CRM-11 — estornos e chargebacks de mensalidade do xgestão no período.
 *
 * Fonte: a saída paga no caixa da plataforma (`xgestao_mensalidade_estorno`,
 * uma por pagamento). O tipo vem do id dos eventos `payment_refunded` do mesmo
 * pagamento (`payload_json.paymentId`): `payload_json.motivo` e, nos eventos
 * antigos, o prefixo do id. Ver `classificarEstorno`. A base é a
 * lista de assinantes já carregada: conta interna (ADM-02) não entra.
 */
export interface EstornoXgestao {
  id: string;
  tipo: TipoEstorno;
  userId: string;
  empreiteiraNome: string;
  nome: string | null;
  valor: number;
  /** ISO. */
  data: string;
  plano: string;
}

export interface EstornosXgestao {
  periodo: PeriodoAdmin;
  desde: string;
  total: { quantidade: number; valor: number };
  porTipo: Record<TipoEstorno, { quantidade: number; valor: number }>;
  itens: EstornoXgestao[];
}

const MAX_ITENS = 500;

export async function estornosXgestao(
  lista: XgestaoAssinanteDetalhe[],
  periodo: PeriodoAdmin,
  agora = new Date(),
): Promise<EstornosXgestao> {
  const desde = inicioDoPeriodo(periodo, agora);
  const vazio = (): EstornosXgestao => ({
    periodo,
    desde: desde.toISOString(),
    total: { quantidade: 0, valor: 0 },
    porTipo: { estorno: { quantidade: 0, valor: 0 }, chargeback: { quantidade: 0, valor: 0 } },
    itens: [],
  });
  if (lista.length === 0) return vazio();
  const ref = new Map(lista.map((a) => [a.userId, a]));
  const linhas = await db
    .select({
      id: financeiro.id,
      userId: financeiro.recebedorUserId,
      valor: financeiro.valor,
      descricao: financeiro.descricao,
      criadoEm: financeiro.createdAt,
      eventos: sql<string[] | null>`(
        select array_agg(e.gateway_event_id) from assinatura_eventos e
        where e.tipo = 'payment_refunded' and e.payload_json->>'paymentId' = ${financeiro.origemId}
      )`,
      motivos: sql<string[] | null>`(
        select array_agg(e.payload_json->>'motivo') from assinatura_eventos e
        where e.tipo = 'payment_refunded' and e.payload_json->>'paymentId' = ${financeiro.origemId}
      )`,
    })
    .from(financeiro)
    .where(and(
      eq(financeiro.origemTipo, ORIGEM_ESTORNO_MENSALIDADE_XGESTAO),
      eq(financeiro.tipo, 'saida'),
      gte(financeiro.createdAt, desde),
      inArray(financeiro.recebedorUserId, [...ref.keys()]),
    ))
    .orderBy(desc(financeiro.createdAt))
    .limit(MAX_ITENS);

  const r = vazio();
  for (const l of linhas) {
    const a = l.userId ? ref.get(l.userId) : undefined;
    if (!a) continue;
    const tipo = classificarEstorno(l.eventos ?? [], l.motivos ?? []);
    const valor = Number(l.valor) || 0;
    r.total.quantidade += 1;
    r.total.valor += valor;
    r.porTipo[tipo].quantidade += 1;
    r.porTipo[tipo].valor += valor;
    r.itens.push({
      id: l.id,
      tipo,
      userId: a.userId,
      empreiteiraNome: a.empreiteiraNome,
      nome: a.nome,
      valor,
      data: (l.criadoEm ?? agora).toISOString(),
      // "Estorno mensalidade xgestão <Plano>" (assinatura-service.ts).
      plano: l.descricao.replace(/^Estorno mensalidade xgestão\s*/i, '') || l.descricao,
    });
  }
  const arredondar = (v: number) => Math.round(v * 100) / 100;
  r.total.valor = arredondar(r.total.valor);
  r.porTipo.estorno.valor = arredondar(r.porTipo.estorno.valor);
  r.porTipo.chargeback.valor = arredondar(r.porTipo.chargeback.valor);
  return r;
}
