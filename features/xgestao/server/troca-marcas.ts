/**
 * XG48 — efeitos da troca de plano do xgestão no banco e no gateway:
 * marcas de somente leitura por obra, pessoas pausadas, links pausados,
 * aplicação da descida na data efetiva e a soma da diferença proporcional na
 * próxima cobrança. Sem `server-only`: os testes de integração chamam direto.
 *
 * Nada aqui exclui dados. Obra bloqueada continua visível; membro pausado e
 * link pausado voltam quando a empresa sobe de plano.
 */
import { valorDoCiclo } from '../lib/ciclo-plano';
import { and, asc, eq, gt, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  assinaturaEventos,
  assinaturaTrocas,
  assinaturas,
  empreiteiras,
  obraShareLinks,
  obras,
  planos,
  users,
  xgestaoMembros,
} from '@shared/db/schema';
import { getPlanCatalog, type PlanoTier } from '@shared/lib/plans-catalog';
import { gatewayDaAssinatura } from '@features/planos/gateway';
import { ehTierTroca, linksExcedentes, ordemTier, selecionarMantidos, valorProximaFatura } from '../lib/troca-plano';

export { linksExcedentes };

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Exec = typeof db | Tx;

export { MSG_OBRA_BLOQUEADA_POR_PLANO } from '../lib/troca-plano';

export type EscolhasTroca = { obras?: string[]; membros?: string[] };

export async function lockTrocaUsuario(tx: Tx, userId: string): Promise<void> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`xgestao-troca:${userId}`}))`);
}

export function limitesTier(tier: string) {
  const l = getPlanCatalog('xgestao', tier as PlanoTier).limites;
  return {
    obrasAtivas: l.obrasAtivas ?? 0,
    pessoasEmpresa: l.pessoasEmpresa ?? 1,
    linksPorObra: l.linksPorObra ?? -1,
    valoresPublicos: l.valoresPublicos === 1,
  };
}

export async function empresaDoTitular(exec: Exec, userId: string): Promise<string | null> {
  const [empresa] = await exec.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, userId)).limit(1);
  return empresa?.id ?? null;
}

/** Obras próprias em andamento que ainda podem ser editadas (não concluídas, não bloqueadas). */
export async function obrasEditaveis(exec: Exec, empresaId: string) {
  return exec.select({ id: obras.id, nome: obras.nome, status: obras.status, criadoEm: obras.createdAt })
    .from(obras)
    .where(and(
      eq(obras.empreiteiraId, empresaId), isNull(obras.clienteId),
      ne(obras.status, 'concluida'), eq(obras.xgestaoBloqueadaPorPlano, false),
    ))
    .orderBy(asc(obras.createdAt));
}

/** Pessoas que ocupam vaga além do titular: ativas e convites pendentes. */
export async function membrosComVaga(exec: Exec, empresaId: string, titularId: string) {
  return exec.select({
    id: xgestaoMembros.id, nome: users.name, email: users.email,
    status: xgestaoMembros.status, criadoEm: xgestaoMembros.criadoEm,
  })
    .from(xgestaoMembros)
    .innerJoin(users, eq(users.id, xgestaoMembros.userId))
    .where(and(
      eq(xgestaoMembros.empreiteiraId, empresaId),
      inArray(xgestaoMembros.status, ['ativo', 'convidado']),
      ne(xgestaoMembros.userId, titularId),
    ))
    .orderBy(asc(xgestaoMembros.criadoEm));
}

/** Links ativos (não pausados, não expirados) das obras próprias da empresa. */
export async function linksAtivosDaEmpresa(exec: Exec, empresaId: string) {
  return exec.select({ id: obraShareLinks.id, obraId: obraShareLinks.obraId, criadoEm: obraShareLinks.criadoEm })
    .from(obraShareLinks)
    .innerJoin(obras, eq(obras.id, obraShareLinks.obraId))
    .where(and(
      eq(obras.empreiteiraId, empresaId), isNull(obras.clienteId),
      eq(obraShareLinks.ativo, true), eq(obraShareLinks.pausadoPorPlano, false),
      or(isNull(obraShareLinks.expiraEm), gt(obraShareLinks.expiraEm, new Date())),
    ))
    .orderBy(asc(obraShareLinks.criadoEm));
}


/**
 * Aplica a descida: obras não escolhidas ficam só para visualização, pessoas
 * não escolhidas ficam pausadas e links acima do limite por obra ficam pausados
 * (os mais antigos continuam). Obra criada ou pessoa convidada depois da escolha
 * só ocupa vaga que sobrar. Idempotente.
 */
export async function aplicarMarcas(tx: Tx, empresaId: string, titularId: string, tier: string, escolhas: EscolhasTroca) {
  const limites = limitesTier(tier);
  const obrasAbertas = await obrasEditaveis(tx, empresaId);
  const obrasMantidas = selecionarMantidos(obrasAbertas, escolhas.obras, limites.obrasAtivas);
  const obrasBloquear = obrasAbertas.filter((o) => !obrasMantidas.has(o.id)).map((o) => o.id);
  if (obrasBloquear.length) {
    await tx.update(obras).set({ xgestaoBloqueadaPorPlano: true, updatedAt: new Date() }).where(inArray(obras.id, obrasBloquear));
  }

  const membros = await membrosComVaga(tx, empresaId, titularId);
  const membrosMantidos = selecionarMantidos(membros, escolhas.membros, Math.max(0, limites.pessoasEmpresa - 1));
  const membrosPausar = membros.filter((m) => !membrosMantidos.has(m.id));
  for (const m of membrosPausar) {
    await tx.update(xgestaoMembros)
      .set({ status: 'pausado', statusAntesPausa: m.status as 'ativo' | 'convidado', atualizadoEm: new Date() })
      .where(and(eq(xgestaoMembros.id, m.id), inArray(xgestaoMembros.status, ['ativo', 'convidado'])));
  }

  const linksPausar = linksExcedentes(await linksAtivosDaEmpresa(tx, empresaId), limites.linksPorObra);
  if (linksPausar.length) {
    await tx.update(obraShareLinks).set({ pausadoPorPlano: true }).where(inArray(obraShareLinks.id, linksPausar));
  }
  return { obrasBloqueadas: obrasBloquear, membrosPausados: membrosPausar.map((m) => m.id), linksPausados: linksPausar };
}

/**
 * Ao subir de plano: devolve edição às obras bloqueadas, reativa pessoas e
 * links pausados, até o limite do plano novo (os mais antigos primeiro).
 */
export async function restaurarMarcas(tx: Tx, empresaId: string, titularId: string, tier: string) {
  const limites = limitesTier(tier);

  const abertas = await obrasEditaveis(tx, empresaId);
  const bloqueadas = await tx.select({ id: obras.id }).from(obras).where(and(
    eq(obras.empreiteiraId, empresaId), isNull(obras.clienteId), eq(obras.xgestaoBloqueadaPorPlano, true),
  )).orderBy(asc(obras.createdAt));
  const vagasObras = limites.obrasAtivas < 0 ? bloqueadas.length : Math.max(0, limites.obrasAtivas - abertas.length);
  const obrasLiberar = bloqueadas.slice(0, vagasObras).map((o) => o.id);
  if (obrasLiberar.length) {
    await tx.update(obras).set({ xgestaoBloqueadaPorPlano: false, updatedAt: new Date() }).where(inArray(obras.id, obrasLiberar));
  }

  const ocupando = await membrosComVaga(tx, empresaId, titularId);
  const pausados = await tx.select({ id: xgestaoMembros.id, statusAntes: xgestaoMembros.statusAntesPausa })
    .from(xgestaoMembros)
    .where(and(eq(xgestaoMembros.empreiteiraId, empresaId), eq(xgestaoMembros.status, 'pausado')))
    .orderBy(asc(xgestaoMembros.criadoEm));
  const vagasPessoas = Math.max(0, limites.pessoasEmpresa - 1 - ocupando.length);
  const reativar = pausados.slice(0, vagasPessoas);
  for (const m of reativar) {
    await tx.update(xgestaoMembros)
      .set({ status: m.statusAntes ?? 'ativo', statusAntesPausa: null, atualizadoEm: new Date() })
      .where(and(eq(xgestaoMembros.id, m.id), eq(xgestaoMembros.status, 'pausado')));
  }

  const ativos = await linksAtivosDaEmpresa(tx, empresaId);
  const linksPausados = await tx.select({ id: obraShareLinks.id, obraId: obraShareLinks.obraId })
    .from(obraShareLinks)
    .innerJoin(obras, eq(obras.id, obraShareLinks.obraId))
    .where(and(
      eq(obras.empreiteiraId, empresaId), isNull(obras.clienteId),
      eq(obraShareLinks.ativo, true), eq(obraShareLinks.pausadoPorPlano, true),
    ))
    .orderBy(asc(obraShareLinks.criadoEm));
  const usoPorObra = new Map<string, number>();
  for (const l of ativos) usoPorObra.set(l.obraId, (usoPorObra.get(l.obraId) ?? 0) + 1);
  const linksLiberar: string[] = [];
  for (const l of linksPausados) {
    const uso = usoPorObra.get(l.obraId) ?? 0;
    if (limites.linksPorObra >= 0 && uso >= limites.linksPorObra) continue;
    usoPorObra.set(l.obraId, uso + 1);
    linksLiberar.push(l.id);
  }
  if (linksLiberar.length) {
    await tx.update(obraShareLinks).set({ pausadoPorPlano: false }).where(inArray(obraShareLinks.id, linksLiberar));
  }
  return { obrasLiberadas: obrasLiberar, membrosReativados: reativar.map((m) => m.id), linksReativados: linksLiberar };
}

/**
 * Nova assinatura (checkout) num plano MAIOR que o da última descida aplicada:
 * vale como "assinar um plano maior", e devolve o que estava bloqueado.
 */
export async function restaurarAposNovaAssinatura(tx: Tx, userId: string, tier: string) {
  if (!ehTierTroca(tier)) return;
  const [ultima] = await tx.select({ tierPara: assinaturaTrocas.tierPara }).from(assinaturaTrocas)
    .where(and(eq(assinaturaTrocas.userId, userId), eq(assinaturaTrocas.tipo, 'descer'), eq(assinaturaTrocas.status, 'aplicada')))
    .orderBy(sql`${assinaturaTrocas.aplicadaEm} DESC NULLS LAST`).limit(1);
  if (!ultima || ordemTier(tier) <= ordemTier(ultima.tierPara)) return;
  const empresaId = await empresaDoTitular(tx, userId);
  if (empresaId) await restaurarMarcas(tx, empresaId, userId, tier);
}

// ─── Descida na data efetiva ────────────────────────────────────────────────

/** Aplica as descidas cuja data chegou. Idempotente; pode rodar no boot e na leitura do plano. */
export async function aplicarTrocasVencidas(userId?: string): Promise<number> {
  const vencidas = await db.select({ id: assinaturaTrocas.id }).from(assinaturaTrocas).where(and(
    eq(assinaturaTrocas.status, 'agendada'),
    lte(assinaturaTrocas.efetivaEm, new Date()),
    ...(userId ? [eq(assinaturaTrocas.userId, userId)] : []),
  ));
  let aplicadas = 0;
  for (const { id } of vencidas) {
    if (await aplicarDescida(id)) aplicadas++;
  }
  return aplicadas;
}

async function aplicarDescida(trocaId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [previa] = await tx.select({ userId: assinaturaTrocas.userId }).from(assinaturaTrocas).where(eq(assinaturaTrocas.id, trocaId));
    if (!previa) return false;
    await lockTrocaUsuario(tx, previa.userId);
    const [troca] = await tx.select().from(assinaturaTrocas).where(eq(assinaturaTrocas.id, trocaId));
    if (!troca || troca.status !== 'agendada' || troca.efetivaEm.getTime() > Date.now()) return false;
    const [assinatura] = await tx.select({ status: assinaturas.status, canceladaEm: assinaturas.canceladaEm })
      .from(assinaturas).where(eq(assinaturas.id, troca.assinaturaId));
    const viva = assinatura && (assinatura.status === 'ativa' || assinatura.status === 'inadimplente') && !assinatura.canceladaEm;
    if (!viva) {
      await tx.update(assinaturaTrocas).set({ status: 'cancelada', atualizadaEm: new Date(), erro: 'assinatura encerrada antes da data efetiva' })
        .where(eq(assinaturaTrocas.id, trocaId));
      await tx.insert(assinaturaEventos).values({ assinaturaId: troca.assinaturaId, tipo: 'troca_cancelada', payloadJson: { trocaId, motivo: 'assinatura_encerrada' } });
      return false;
    }
    await tx.update(assinaturas).set({ planoId: troca.planoParaId }).where(eq(assinaturas.id, troca.assinaturaId));
    const empresaId = troca.empreiteiraId ?? await empresaDoTitular(tx, troca.userId);
    const marcas = empresaId ? await aplicarMarcas(tx, empresaId, troca.userId, troca.tierPara, troca.escolhas ?? {}) : null;
    await tx.update(assinaturaTrocas).set({ status: 'aplicada', aplicadaEm: new Date(), atualizadaEm: new Date() })
      .where(eq(assinaturaTrocas.id, trocaId));
    await tx.insert(assinaturaEventos).values({
      assinaturaId: troca.assinaturaId,
      tipo: 'troca_descer_aplicada',
      gatewayEventId: `troca_descer_aplicada_${trocaId}`,
      payloadJson: { trocaId, tierDe: troca.tierDe, tierPara: troca.tierPara, ...(marcas ?? {}) },
    });
    return true;
  });
}

// ─── Diferença proporcional na próxima cobrança ─────────────────────────────

async function registrarErro(mensagem: string, meta: Record<string, unknown>) {
  try {
    const { logError } = await import('@/server/lib/logger');
    await logError('error', mensagem, { route: 'xgestao.troca-plano', meta });
  } catch {
    console.error(`[troca-plano] ${mensagem}`, meta);
  }
}

/**
 * Deixa a próxima cobrança pendente com o valor certo: o do plano que vale no
 * próximo ciclo + as diferenças de subida ainda não pagas. Valor ABSOLUTO,
 * então repetir (retry, webhook repetido) nunca soma a diferença duas vezes.
 * Sem cobrança pendente ainda, a diferença fica pendente até o PAYMENT_CREATED.
 */
export async function sincronizarCobrancaPendente(assinaturaId: string): Promise<'ajustada' | 'sem_diferenca' | 'aguardando_cobranca' | 'sem_gateway' | 'falhou'> {
  const [assinatura] = await db.select({
    subId: assinaturas.gatewaySubscriptionId, provider: assinaturas.gatewayProvider,
    userId: assinaturas.userId, valorMensal: planos.valorMensal, valorAnual: planos.valorAnual, ciclo: assinaturas.ciclo,
  }).from(assinaturas).innerJoin(planos, eq(planos.id, assinaturas.planoId)).where(eq(assinaturas.id, assinaturaId));
  if (!assinatura) return 'sem_diferenca';
  const pendentes = await db.select({ id: assinaturaTrocas.id, diferenca: assinaturaTrocas.valorDiferenca, paymentId: assinaturaTrocas.paymentIdAjustado })
    .from(assinaturaTrocas).where(and(
      eq(assinaturaTrocas.assinaturaId, assinaturaId), eq(assinaturaTrocas.tipo, 'subir'),
      eq(assinaturaTrocas.status, 'aplicada'), isNull(assinaturaTrocas.quitadaEm),
      sql`${assinaturaTrocas.valorDiferenca} > 0`,
    ));
  if (pendentes.length === 0) return 'sem_diferenca';
  const gateway = gatewayDaAssinatura(assinatura.provider);
  if (!assinatura.subId || !gateway.proximaCobrancaPendente || !gateway.atualizarValorCobranca) return 'sem_gateway';

  const [agendada] = await db.select({ valorPara: assinaturaTrocas.valorPara }).from(assinaturaTrocas)
    .where(and(eq(assinaturaTrocas.assinaturaId, assinaturaId), eq(assinaturaTrocas.status, 'agendada'))).limit(1);
  // XG50 — no anual, a próxima fatura é a anuidade.
  const alvo = valorProximaFatura(agendada?.valorPara ?? valorDoCiclo(assinatura, assinatura.ciclo), pendentes.map((p) => p.diferenca));
  const ids = pendentes.map((p) => p.id);
  try {
    const cobranca = await gateway.proximaCobrancaPendente(assinatura.subId);
    if (!cobranca) {
      await db.update(assinaturaTrocas).set({ ajustePendente: true, atualizadaEm: new Date() }).where(inArray(assinaturaTrocas.id, ids));
      return 'aguardando_cobranca';
    }
    if (Math.round(cobranca.valor * 100) !== Math.round(alvo * 100)) {
      await gateway.atualizarValorCobranca(cobranca.id, alvo);
    }
    await db.update(assinaturaTrocas)
      .set({ paymentIdAjustado: cobranca.id, ajustePendente: false, erro: null, atualizadaEm: new Date() })
      .where(inArray(assinaturaTrocas.id, ids));
    await db.insert(assinaturaEventos).values({
      assinaturaId, tipo: 'troca_ajuste_cobranca',
      payloadJson: { paymentId: cobranca.id, valor: alvo, vencimento: cobranca.vencimento, trocas: ids },
    });
    return 'ajustada';
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : String(err);
    await db.update(assinaturaTrocas).set({ ajustePendente: true, erro: mensagem.slice(0, 500), atualizadaEm: new Date() })
      .where(inArray(assinaturaTrocas.id, ids));
    await registrarErro('[troca-plano] falha ao somar a diferença na próxima cobrança', { assinaturaId, alvo, erro: mensagem, userId: assinatura.userId });
    return 'falhou';
  }
}

/** Retry das diferenças que ainda não entraram na cobrança pendente. */
export async function reprocessarAjustesPendentes(userId?: string): Promise<number> {
  const rows = await db.selectDistinct({ assinaturaId: assinaturaTrocas.assinaturaId }).from(assinaturaTrocas).where(and(
    eq(assinaturaTrocas.status, 'aplicada'), eq(assinaturaTrocas.ajustePendente, true), isNull(assinaturaTrocas.quitadaEm),
    ...(userId ? [eq(assinaturaTrocas.userId, userId)] : []),
  ));
  let ajustadas = 0;
  for (const { assinaturaId } of rows) {
    if (await sincronizarCobrancaPendente(assinaturaId) === 'ajustada') ajustadas++;
  }
  return ajustadas;
}

export async function temDiferencaPendente(exec: Exec, assinaturaId: string): Promise<boolean> {
  const [row] = await exec.select({ id: assinaturaTrocas.id }).from(assinaturaTrocas).where(and(
    eq(assinaturaTrocas.assinaturaId, assinaturaId), eq(assinaturaTrocas.status, 'aplicada'),
    eq(assinaturaTrocas.tipo, 'subir'), isNull(assinaturaTrocas.quitadaEm), sql`${assinaturaTrocas.valorDiferenca} > 0`,
  )).limit(1);
  return Boolean(row);
}

// ─── Ganchos do webhook e do cancelamento ───────────────────────────────────

/**
 * Pagamento confirmado: a fatura com a diferença foi paga, ou (subida sem
 * proporcional, no mês bônus) o 1º pagamento chegou. A subida não volta mais.
 */
export async function marcarSubidasQuitadas(tx: Tx, assinaturaId: string, paymentId?: string) {
  await tx.update(assinaturaTrocas).set({ quitadaEm: new Date(), ajustePendente: false, atualizadaEm: new Date() }).where(and(
    eq(assinaturaTrocas.assinaturaId, assinaturaId), eq(assinaturaTrocas.tipo, 'subir'),
    eq(assinaturaTrocas.status, 'aplicada'), isNull(assinaturaTrocas.quitadaEm),
    paymentId
      ? or(eq(assinaturaTrocas.paymentIdAjustado, paymentId), sql`${assinaturaTrocas.valorDiferenca} = 0`)!
      : sql`${assinaturaTrocas.valorDiferenca} = 0`,
  ));
}

/** Estorno ou cancelamento pelo painel do Asaas: a troca pendente é cancelada. */
export async function cancelarTrocasPendentes(tx: Tx, assinaturaId: string, motivo: string) {
  const canceladas = await tx.update(assinaturaTrocas)
    .set({ status: 'cancelada', ajustePendente: false, erro: motivo, atualizadaEm: new Date() })
    .where(and(
      eq(assinaturaTrocas.assinaturaId, assinaturaId),
      or(
        eq(assinaturaTrocas.status, 'agendada'),
        and(eq(assinaturaTrocas.status, 'aplicada'), eq(assinaturaTrocas.tipo, 'subir'), isNull(assinaturaTrocas.quitadaEm)),
      )!,
    ))
    .returning({ id: assinaturaTrocas.id });
  if (canceladas.length) {
    await tx.insert(assinaturaEventos).values({ assinaturaId, tipo: 'troca_cancelada', payloadJson: { motivo, trocas: canceladas.map((c) => c.id) } });
  }
  return canceladas.length;
}

/**
 * Cancelamento pelo assinante. Subida cuja fatura com a diferença não foi paga
 * volta atrás: pelo resto do período ele fica com o plano que pagou. Descida
 * agendada perde o sentido (a conta encerra na mesma data) e é cancelada.
 */
export async function reverterTrocasAoCancelar(tx: Tx, assinaturaId: string, userId: string) {
  const subidas = await tx.select().from(assinaturaTrocas).where(and(
    eq(assinaturaTrocas.assinaturaId, assinaturaId), eq(assinaturaTrocas.tipo, 'subir'),
    eq(assinaturaTrocas.status, 'aplicada'), isNull(assinaturaTrocas.quitadaEm),
  )).orderBy(asc(assinaturaTrocas.criadaEm));
  let revertidoPara: string | null = null;
  if (subidas.length) {
    const primeira = subidas[0];
    revertidoPara = primeira.tierDe;
    await tx.update(assinaturas).set({ planoId: primeira.planoDeId }).where(eq(assinaturas.id, assinaturaId));
    // Se antes houve uma descida aplicada, as marcas dela voltam a valer.
    const [descida] = await tx.select({ escolhas: assinaturaTrocas.escolhas }).from(assinaturaTrocas).where(and(
      eq(assinaturaTrocas.userId, userId), eq(assinaturaTrocas.tipo, 'descer'), eq(assinaturaTrocas.status, 'aplicada'),
    )).orderBy(sql`${assinaturaTrocas.aplicadaEm} DESC NULLS LAST`).limit(1);
    const empresaId = await empresaDoTitular(tx, userId);
    if (descida && empresaId) {
      await aplicarMarcas(tx, empresaId, userId, primeira.tierDe, descida.escolhas ?? {});
    }
  }
  const total = await cancelarTrocasPendentes(tx, assinaturaId, 'cancelamento_pelo_assinante');
  if (revertidoPara) {
    await tx.insert(assinaturaEventos).values({ assinaturaId, tipo: 'troca_revertida', payloadJson: { tierVolta: revertidoPara } });
  }
  return { revertidoPara, canceladas: total };
}

/** A descida agendada do titular, se houver (no máximo uma por assinatura). */
export async function trocaAgendadaDoUsuario(exec: Exec, userId: string) {
  const [row] = await exec.select({
    id: assinaturaTrocas.id, tierDe: assinaturaTrocas.tierDe, tierPara: assinaturaTrocas.tierPara,
    planoParaId: assinaturaTrocas.planoParaId, valorPara: assinaturaTrocas.valorPara,
    efetivaEm: assinaturaTrocas.efetivaEm, escolhas: assinaturaTrocas.escolhas, assinaturaId: assinaturaTrocas.assinaturaId,
  }).from(assinaturaTrocas).where(and(eq(assinaturaTrocas.userId, userId), eq(assinaturaTrocas.status, 'agendada'))).limit(1);
  return row ?? null;
}

