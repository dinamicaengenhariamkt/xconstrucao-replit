import 'server-only';

import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturaEventos, assinaturas, financeiro } from '@shared/db/schema';
import { ORIGEM_ESTORNO_MENSALIDADE_XGESTAO } from '@features/xgestao/lib/receita';
import { inicioDoMesSaoPaulo } from '../lib/metricas-comerciais';
import type { XgestaoAssinanteDetalhe } from './assinantes';
import type { TipoProblemaCobranca } from '../lib/cobranca-rotulos';

/**
 * ADM-03 — cobrança com problema no xgestão, num lugar só:
 * - `pagamento_recusado`: evento `payment_failed` no mês (São Paulo);
 * - `estorno`: estorno ou chargeback de mensalidade lançado no caixa no mês;
 * - `webhook_preso`: aviso do gateway ligado a uma assinatura xgestão que
 *   morreu (`dead`) ou está `pending`/`failed` há mais de 1 hora;
 * - `pendente_reativacao`: assinatura parada no limbo da consulta ao gateway;
 * - `inadimplente`: situação comercial de hoje (mesma regra da lista).
 *
 * A base é a lista de assinantes já carregada pela rota: conta interna (ADM-02)
 * não entra.
 */
export { ROTULO_PROBLEMA_COBRANCA, type TipoProblemaCobranca } from '../lib/cobranca-rotulos';

export interface ProblemaCobranca {
  id: string;
  tipo: TipoProblemaCobranca;
  userId: string;
  empreiteiraNome: string;
  nome: string | null;
  /** ISO. */
  data: string;
  detalhe: string;
}

export interface CobrancaComProblema {
  /** Assinantes distintos com algum problema. */
  assinantes: number;
  totais: Record<TipoProblemaCobranca, number>;
  itens: ProblemaCobranca[];
}

/** Aviso do gateway pendente há mais que isso é considerado preso. */
export const WEBHOOK_PRESO_APOS_MS = 60 * 60 * 1000;
const MAX_ITENS = 100;

function valorBr(valor: unknown): string {
  return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export async function cobrancaComProblemaXgestao(
  lista: XgestaoAssinanteDetalhe[],
  agora: Date = new Date(),
): Promise<CobrancaComProblema> {
  const totais: Record<TipoProblemaCobranca, number> = {
    pagamento_recusado: 0, estorno: 0, webhook_preso: 0, pendente_reativacao: 0, inadimplente: 0,
  };
  if (lista.length === 0) return { assinantes: 0, totais, itens: [] };
  const ref = new Map(lista.map((a) => [a.userId, a]));
  const userIds = [...ref.keys()];
  const desde = inicioDoMesSaoPaulo(agora);
  const presoAntesDe = new Date(agora.getTime() - WEBHOOK_PRESO_APOS_MS);

  const [falhas, estornos, webhooks, pendentes] = await Promise.all([
    db
      .select({ id: assinaturaEventos.id, userId: assinaturas.userId, criadoEm: assinaturaEventos.criadoEm })
      .from(assinaturaEventos)
      .innerJoin(assinaturas, eq(assinaturas.id, assinaturaEventos.assinaturaId))
      .where(and(
        eq(assinaturaEventos.tipo, 'payment_failed'),
        gte(assinaturaEventos.criadoEm, desde),
        eq(assinaturas.persona, 'xgestao'),
        inArray(assinaturas.userId, userIds),
      ))
      .orderBy(desc(assinaturaEventos.criadoEm)),
    db
      .select({ id: financeiro.id, userId: financeiro.recebedorUserId, valor: financeiro.valor, criadoEm: financeiro.createdAt })
      .from(financeiro)
      .where(and(
        eq(financeiro.origemTipo, ORIGEM_ESTORNO_MENSALIDADE_XGESTAO),
        gte(financeiro.createdAt, desde),
        inArray(financeiro.recebedorUserId, userIds),
      ))
      .orderBy(desc(financeiro.createdAt)),
    // O aviso cru do gateway não tem coluna de assinatura: liga pelo id da
    // subscription no Asaas ou pela referência externa `xconstrucao|<userId>|`.
    db.execute<{ id: string; user_id: string; status: string; event_type: string; created_at: Date | string; last_error: string | null }>(sql`
      select distinct on (w.id) w.id, a.user_id, w.status, w.event_type, w.created_at, w.last_error
      from webhook_delivery_log w
      join assinaturas a on a.persona = 'xgestao'
        and a.user_id in (${sql.join(userIds.map((id) => sql`${id}`), sql`, `)})
        and (
          (a.gateway_subscription_id is not null and w.raw_body like '%' || a.gateway_subscription_id || '%')
          or w.raw_body like '%xconstrucao|' || a.user_id || '|%'
        )
      where w.status = 'dead'
         or (w.status in ('pending', 'failed') and w.created_at < ${presoAntesDe})
      order by w.id, w.created_at desc
      limit ${MAX_ITENS}
    `),
    db
      .select({ id: assinaturas.id, userId: assinaturas.userId, desde: assinaturas.pendenteReativacaoAt, criadoEm: assinaturas.createdAt })
      .from(assinaturas)
      .where(and(
        eq(assinaturas.persona, 'xgestao'),
        eq(assinaturas.status, 'pendente_reativacao'),
        inArray(assinaturas.userId, userIds),
      )),
  ]);

  const itens: ProblemaCobranca[] = [];
  const add = (item: Omit<ProblemaCobranca, 'empreiteiraNome' | 'nome'>) => {
    const a = ref.get(item.userId);
    if (!a) return;
    totais[item.tipo] += 1;
    itens.push({ ...item, empreiteiraNome: a.empreiteiraNome, nome: a.nome });
  };
  const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : agora.toISOString());

  for (const f of falhas) add({ id: `falha:${f.id}`, tipo: 'pagamento_recusado', userId: f.userId, data: iso(f.criadoEm), detalhe: 'Cobrança recusada ou vencida sem pagamento' });
  for (const e of estornos) {
    if (e.userId) add({ id: `estorno:${e.id}`, tipo: 'estorno', userId: e.userId, data: iso(e.criadoEm), detalhe: `Estorno de ${valorBr(e.valor)}` });
  }
  for (const w of webhooks.rows) {
    add({
      id: `webhook:${w.id}`, tipo: 'webhook_preso', userId: w.user_id, data: iso(w.created_at),
      detalhe: `${w.event_type} ${w.status === 'dead' ? 'desistido após as tentativas' : 'sem processar'}`,
    });
  }
  for (const p of pendentes) add({ id: `reativacao:${p.id}`, tipo: 'pendente_reativacao', userId: p.userId, data: iso(p.desde ?? p.criadoEm), detalhe: 'Aguardando resposta do gateway para reativar' });
  for (const a of lista) {
    if (a.situacao.codigo === 'inadimplente') {
      add({ id: `inadimplente:${a.userId}`, tipo: 'inadimplente', userId: a.userId, data: a.situacao.ate ?? agora.toISOString(), detalhe: a.situacao.motivo ?? 'Pagamento em atraso' });
    }
  }
  itens.sort((x, y) => y.data.localeCompare(x.data));
  return { assinantes: new Set(itens.map((i) => i.userId)).size, totais, itens: itens.slice(0, MAX_ITENS) };
}
