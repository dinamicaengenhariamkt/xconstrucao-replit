import 'server-only';

import { and, count, desc, eq, gt, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@shared/db/db';
import {
  assinaturaEventos,
  assinaturaTrocas,
  assinaturas,
  empreiteiras,
  financeiro,
  obraOcorrencias,
  obraShareLinks,
  obras,
  planos,
  sessions,
  userFiles,
  users,
} from '@shared/db/schema';
import { getPlanCatalog } from '@shared/lib/plans-catalog';
import {
  filtroObrasXgestao,
  listarMembrosEmpreiteirasXgestao,
  listarAssinantesXgestao as listarBase,
  type FiltroContasInternas,
  type XgestaoAssinanteBase,
  type XgestaoMembroEmpresa,
} from './escopo';
import { expirarTestesVencidos, TESTE_PROVIDER } from '@features/xgestao/teste/server/teste-service';
import { assinaturaXgestaoVigente } from '@features/xgestao/lib/acesso-plano';
import { contarVagasEquipe, type VinculoEquipe } from '@features/xgestao/equipe/vagas';
import { getDiasObraParada } from '@features/admin/platform-settings/server/settings-reader';
import { computeProfitSummaryForObras } from '@features/shared/profit/summary-server';
import type { ProfitSummaryData } from '@features/shared/profit/types';
import { custoRealPorEmpreiteira, custoRealPorObra } from './custo-real';
import { ORIGEM_ESTORNO_MENSALIDADE_XGESTAO, ORIGEM_MENSALIDADE_XGESTAO } from '@features/xgestao/lib/receita';
import { lancamentoAtrasado, obraAtrasada, obraParada, ultimaAtividadeObra } from './situacao';
import { DIAS_ATIVO_MES, engajamentoAssinante, type EngajamentoAssinante } from '../lib/engajamento';
import {
  compararAtencao,
  escolherAssinaturaCanonica,
  limitesDoTier,
  limiteSemTeto,
  motivosAtencao,
  resumirAssinaturas,
  situacaoAssinante,
  usoRecurso,
  type LimitesAdmin,
  type MotivoAtencao,
  type SituacaoAssinante,
  type UsoPlanoAdmin,
} from '../lib/situacao-assinante';
import { fimDoAcessoPago, jornadaDoTeste } from '../lib/metricas-comerciais';
import { listarContatosAssinante, ultimoContatoPorUsuario, type ContatoAdmin } from './contatos';
import type { CanalContato } from '../lib/contato-assinante';
import { retornoDoAssinante, type RetornoAssinante } from '../lib/retorno-assinante';
import { precoMensalEquivalente } from './preco-sql';

export type XgestaoTier = import('@shared/lib/plans-catalog').PlanoTier;

export interface XgestaoAssinanteDetalhe extends XgestaoAssinanteBase {
  plano: {
    tier: XgestaoTier;
    nome: string;
    valorMensal: number;
    /**
     * `'ativa'` ou `null`. Só assinatura ativa define o tier; sem ela o
     * assinante está no free, que não gera cobrança e portanto não tem
     * situação a exibir.
     */
    status: string | null;
    renovaEm: string | null;
    /** XG35 — assinatura ativa é o teste grátis; `renovaEm` é então o fim do teste. */
    emTeste: boolean;
  };
  /** XG44 — situação comercial (teste, pago, cancelamento, inadimplência, somente leitura). */
  situacao: SituacaoAssinante;
  obrasGerenciadas: number;
  obrasAtivas: number;
  /**
   * XG36 — uso do plano pela mesma regra do limite (`create-obra.ts`): obras não
   * concluídas. `limiteObras = null` é sem limite (`-1`/`null` da oferta nova ou
   * 9999 do catálogo antigo, ver `limiteSemTeto`); `0` em somente leitura.
   */
  uso: { obrasEmAberto: number; limiteObras: number | null };
  /**
   * ADM-05 — bytes em arquivos das obras xgestão (titular e equipe, sem os
   * apagados). Um arquivo usado em dois lugares conta uma vez.
   */
  armazenamentoBytes: number;
  /** XG44 — uso de cada limite do plano (obras em aberto, pessoas, links na pior obra). */
  usoPlano: UsoPlanoAdmin;
  /**
   * XG48 — o que ficou de fora ao descer de plano e por isso NÃO conta no uso:
   * obras em aberto só para visualização e membros pausados.
   */
  bloqueiosPlano: { obrasBloqueadas: number; membrosPausados: number };
  /** XG44 — soma das obras do assinante, com as mesmas regras do painel. */
  consolidado: {
    orcamento: number;
    /** Saídas pagas pelo dono (`custo-real.ts`). */
    custoReal: number;
    obrasAtrasadas: number;
    obrasParadas: number;
    ocorrenciasAbertas: number;
    /** ADM-09 — vencidos e não pagos, calculado na hora (a receber + a pagar). */
    pagamentosAtrasados: number;
    /** ADM-09 — entradas vencidas: o cliente da obra deve ao assinante. */
    recebimentosAtrasados: number;
    /** ADM-09 — saídas vencidas: o assinante deve a fornecedor/equipe. */
    contasAPagarAtrasadas: number;
    linksAtivos: number;
  };
  /** XG44 — por que o admin deveria olhar este assinante agora (vazio = nada). */
  atencao: MotivoAtencao[];
  /**
   * Último acesso do responsável. XG46: o mais recente entre o login
   * (`users.last_login_at`) e a renovação da sessão (`sessions.last_used_at`),
   * porque quem fica logado por dias não faz login de novo.
   */
  ultimoAcessoEm: string | null;
  /** XG46 — uso do titular e da equipe e registros nas obras. */
  engajamento: EngajamentoAssinante;
  /** Pessoas vinculadas à empresa; não entram na contagem de assinantes. */
  membros: Array<Pick<XgestaoMembroEmpresa, 'userId' | 'nome' | 'email' | 'papel' | 'status' | 'obras'>>;
  /** CRM-08 — quanto o cliente já pagou ao xgestão (líquido de estornos). */
  totalPago: number;
  /**
   * CRM-03 — cancelamento pedido pelo assinante na assinatura que vale
   * (agendado ou já efetivado): motivo opcional e quando pediu.
   */
  cancelamento: { motivo: string | null; texto: string | null; pedidoEm: string | null } | null;
  /**
   * CRM-08 — já teve assinatura paga e perdeu o acesso (cancelou, estorno,
   * inadimplência vencida). `em` = quando o acesso pago acabou.
   */
  saida: { em: string | null; motivo: string } | null;
  /** CRM-10 — trocas de plano relevantes para contato. */
  trocas: {
    descidaAgendada: { em: string; plano: string } | null;
    /** Subida aplicada nos últimos 30 dias. */
    subidaRecente: { em: string; plano: string } | null;
  };
  /** CRM-07 — último contato registrado pelo admin. */
  ultimoContato: { em: string; canal: CanalContato } | null;
  /** XG50 — voltou depois de cancelar e alerta de cancela-e-volta. */
  retorno: RetornoAssinante;
}

/** CRM-10 — subida de plano conta como recente por este tempo. */
export const DIAS_SUBIDA_RECENTE = 30;

export interface XgestaoFaturamento {
  /**
   * Receita da plataforma com as assinaturas do produto — o que entra para
   * nós. Não confundir com o lucro das obras, que é do assinante.
   */
  receitaAcumulada: number;
  /** Soma do valor mensal de quem paga e renova (situação `pago`). */
  receitaRecorrenteMensal: number;
  /** Pagou o período corrente: `pago` + `cancelamento_agendado`. */
  assinantesPagantes: number;
  assinantesFree: number;
  distribuicaoPlanos: Record<XgestaoTier, number>;
}

function money(valor: unknown): number {
  const parsed = Number(valor ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Assinantes com plano, situação, uso dos limites e consolidado das obras.
 *
 * Uma consulta por dimensão, agregada em memória sobre a lista de assinantes —
 * evita repetir subquery por linha e mantém o custo constante no número de
 * assinantes, não no de obras. `userIds` restringe a um subconjunto (página
 * de detalhe) sem mudar nenhuma regra.
 */
export async function listarAssinantesDetalhados(
  opcoes: {
    userIds?: string[];
    agora?: Date;
    /** ADM-02 — padrão `excluir`: conta interna/teste fica fora das métricas. */
    internas?: FiltroContasInternas;
  } = {},
): Promise<XgestaoAssinanteDetalhe[]> {
  const agora = opcoes.agora ?? new Date();
  // XG35 — teste vencido não pode aparecer como plano ativo na lista. ADM-10:
  // é o único ponto de escrita das leituras do admin; cada rota chama esta
  // função uma vez e repassa a lista às demais (home, financeiro, CSV).
  await expirarTestesVencidos();
  const base = await listarBase({ internas: opcoes.internas, userIds: opcoes.userIds });
  if (base.length === 0) return [];

  const userIds = base.map((assinante) => assinante.userId);
  const empreiteiraIds = [...new Set(base.flatMap((assinante) => (assinante.empreiteiraId ? [assinante.empreiteiraId] : [])))];
  // ADM-06 — quem ainda não tem empresa continua na lista (sem obras): o
  // escopo vazio vira `false` em vez de encurtar o retorno.
  const escopo = filtroObrasXgestao(empreiteiraIds) ?? sql`false`;
  const diasParada = await getDiasObraParada();

  const [assinaturaRows, obraRows, membros, acessos, custoPorEmpreiteira, ocorrenciaRows, atrasoRows, linkRows, armazenamento] = await Promise.all([
    db
      .select({
        id: assinaturas.id,
        userId: assinaturas.userId,
        status: assinaturas.status,
        provider: assinaturas.gatewayProvider,
        renovaEm: assinaturas.renovaEm,
        canceladaEm: assinaturas.canceladaEm,
        createdAt: assinaturas.createdAt,
        // CRM-04 — 1º pagamento e mês bônus; CRM-03 — motivo do cancelamento.
        primeiroPagamentoEm: assinaturas.primeiroPagamentoEm,
        fimTesteEm: assinaturas.fimTesteEm,
        motivoCancelamento: assinaturas.motivoCancelamento,
        motivoCancelamentoTexto: assinaturas.motivoCancelamentoTexto,
        tier: planos.tier,
        nome: planos.nome,
        // XG50 — anual entra no MRR como valor anual / 12.
        valorMensal: precoMensalEquivalente,
        ciclo: assinaturas.ciclo,
      })
      .from(assinaturas)
      .innerJoin(planos, eq(planos.id, assinaturas.planoId))
      .where(and(eq(assinaturas.persona, 'xgestao'), eq(planos.persona, 'xgestao'), inArray(assinaturas.userId, userIds))),
    db
      .select({
        empreiteiraId: obras.empreiteiraId,
        total: count(),
        // XG48 — obra bloqueada pelo plano (ficou fora da escolha ao descer)
        // não ocupa limite, como em `create-obra.ts`; aparece à parte.
        ativas: sql<number>`count(*) filter (where ${obras.status} = 'em_andamento' and not ${obras.xgestaoBloqueadaPorPlano})::int`,
        emAberto: sql<number>`count(*) filter (where ${obras.status} <> 'concluida' and not ${obras.xgestaoBloqueadaPorPlano})::int`,
        bloqueadas: sql<number>`count(*) filter (where ${obras.status} <> 'concluida' and ${obras.xgestaoBloqueadaPorPlano})::int`,
        atrasadas: sql<number>`count(*) filter (where ${obraAtrasada})::int`,
        paradas: sql<number>`count(*) filter (where ${obraParada(diasParada)})::int`,
        orcamento: sql<string>`coalesce(sum(${obras.valorTotal}), 0)`,
      })
      .from(obras)
      .where(escopo)
      .groupBy(obras.empreiteiraId),
    listarMembrosEmpreiteirasXgestao(empreiteiraIds),
    db.select({ id: users.id, lastLoginAt: users.lastLoginAt }).from(users).where(inArray(users.id, userIds)),
    custoRealPorEmpreiteira(escopo),
    db
      .select({ empreiteiraId: obras.empreiteiraId, total: sql<number>`count(*)::int` })
      .from(obraOcorrencias)
      .innerJoin(obras, eq(obras.id, obraOcorrencias.obraId))
      .where(and(escopo, eq(obraOcorrencias.status, 'aberta')))
      .groupBy(obras.empreiteiraId),
    // ADM-09 — mesma regra do alerta do painel (`lancamentoAtrasado`), por tipo.
    db
      .select({ empreiteiraId: obras.empreiteiraId, tipo: financeiro.tipo, total: sql<number>`count(*)::int` })
      .from(financeiro)
      .innerJoin(obras, eq(obras.id, financeiro.obraId))
      .where(and(escopo, eq(financeiro.escopo, 'obra'), lancamentoAtrasado))
      .groupBy(obras.empreiteiraId, financeiro.tipo),
    // Links ativos por obra, com a expiração avaliada na leitura como em `token.ts`.
    db
      .select({ empreiteiraId: obras.empreiteiraId, obraId: obraShareLinks.obraId, total: sql<number>`count(*)::int` })
      .from(obraShareLinks)
      .innerJoin(obras, eq(obras.id, obraShareLinks.obraId))
      .where(and(
        escopo,
        eq(obraShareLinks.ativo, true),
        // XG48 — link pausado pelo plano não abre (`token.ts`) nem ocupa limite.
        eq(obraShareLinks.pausadoPorPlano, false),
        or(isNull(obraShareLinks.expiraEm), gt(obraShareLinks.expiraEm, agora)),
      ))
      .groupBy(obras.empreiteiraId, obraShareLinks.obraId),
    armazenamentoPorEmpreiteira(escopo),
  ]);
  const [sinais, pagoPorCliente, efetivadas, trocas, ultimosContatos, eventosRetorno] = await Promise.all([
    sinaisDeUso(
      userIds,
      membros.map((m) => ({ empreiteiraId: m.empreiteiraId, userId: m.userId })),
      escopo,
      agora,
    ),
    // CRM-04/08 — total pago (e se já pagou alguma vez); contas internas só quando listadas.
    receitaPorCliente(userIds, { incluirInternas: (opcoes.internas ?? 'excluir') !== 'excluir' }),
    cancelamentosEfetivados(userIds),
    trocasParaContato(userIds, agora),
    ultimoContatoPorUsuario(userIds),
    eventosDeRetorno(userIds),
  ]);
  const ultimoAcesso = new Map(acessos.map((linha) => [linha.id, maisRecente(linha.lastLoginAt, sinais.sessao.get(linha.id) ?? null)]));
  const ocorrencias = new Map(ocorrenciaRows.map((l) => [l.empreiteiraId, Number(l.total) || 0]));
  const atrasos = new Map<string, { receber: number; pagar: number }>();
  for (const linha of atrasoRows) {
    if (!linha.empreiteiraId) continue;
    const atual = atrasos.get(linha.empreiteiraId) ?? { receber: 0, pagar: 0 };
    if (linha.tipo === 'entrada') atual.receber += Number(linha.total) || 0;
    else atual.pagar += Number(linha.total) || 0;
    atrasos.set(linha.empreiteiraId, atual);
  }
  const links = new Map<string, { total: number; maiorPorObra: number }>();
  for (const linha of linkRows) {
    if (!linha.empreiteiraId) continue;
    const atual = links.get(linha.empreiteiraId) ?? { total: 0, maiorPorObra: 0 };
    const qtd = Number(linha.total) || 0;
    links.set(linha.empreiteiraId, { total: atual.total + qtd, maiorPorObra: Math.max(atual.maiorPorObra, qtd) });
  }

  // XG44 — a assinatura que vale é escolhida pela MESMA ordem de
  // `situacaoPlanoXgestao` (ativa > inadimplente > demais; mais recente). Antes
  // a lista pegava "a primeira vigente por data", o que podia discordar do app.
  const assinaturasPorUsuario = new Map<string, Array<(typeof assinaturaRows)[number]>>();
  for (const linha of assinaturaRows) {
    const lista = assinaturasPorUsuario.get(linha.userId) ?? [];
    lista.push(linha);
    assinaturasPorUsuario.set(linha.userId, lista);
  }
  const obrasPorEmpreiteira = new Map(obraRows.map((linha) => [linha.empreiteiraId, linha]));
  const membrosPorEmpreiteira = new Map<string, XgestaoMembroEmpresa[]>();
  for (const membro of membros) {
    const lista = membrosPorEmpreiteira.get(membro.empreiteiraId) ?? [];
    lista.push(membro);
    membrosPorEmpreiteira.set(membro.empreiteiraId, lista);
  }

  return base.map((assinante) => {
    const canonica = escolherAssinaturaCanonica(
      (assinaturasPorUsuario.get(assinante.userId) ?? []).map((linha) => ({ ...linha, preco: linha.valorMensal })),
    );
    const pago = pagoPorCliente.get(assinante.userId);
    const situacao = situacaoAssinante(canonica, agora, { jaPagou: (pago?.pagamentos ?? 0) > 0 });
    const vigente = canonica !== null && assinaturaXgestaoVigente(canonica, agora);
    const assinatura = vigente ? canonica : null;
    const empresa = assinante.empreiteiraId;
    const obrasDoAssinante = empresa ? obrasPorEmpreiteira.get(empresa) : undefined;
    const tier = (assinatura?.tier ?? 'free') as XgestaoTier;
    const acesso = ultimoAcesso.get(assinante.userId);
    const membrosDaEmpresa = (empresa ? membrosPorEmpreiteira.get(empresa) : undefined) ?? [];
    const limites = limitesDoTier(assinatura ? tier : null);
    const somenteLeitura = !vigente;
    const obrasEmAberto = Number(obrasDoAssinante?.emAberto) || 0;
    const linksEmpresa = (empresa ? links.get(empresa) : undefined) ?? { total: 0, maiorPorObra: 0 };
    const atrasoEmpresa = (empresa ? atrasos.get(empresa) : undefined) ?? { receber: 0, pagar: 0 };
    // Mesma conta das vagas da aba Equipe (`vagas.ts`): titular + ativos + convites pendentes.
    const pessoas = contarVagasEquipe(
      assinante.userId,
      membrosDaEmpresa.map((m) => ({ userId: m.userId, status: m.status as VinculoEquipe['status'] })),
    ).utilizadas;
    const usoPlano: UsoPlanoAdmin = {
      obras: usoRecurso(obrasEmAberto, limites.obras, somenteLeitura),
      pessoas: usoRecurso(pessoas, limites.pessoas, somenteLeitura),
      links: usoRecurso(linksEmpresa.maiorPorObra, limites.linksPorObra, somenteLeitura),
    };
    const obrasGerenciadas = Number(obrasDoAssinante?.total) || 0;
    const usoEquipe = membrosDaEmpresa
      .filter((m) => m.userId !== assinante.userId)
      .reduce<Date | null>((m, membro) => maisRecente(m, sinais.usoMembro.get(membro.userId) ?? null), null);
    const engajamento = engajamentoAssinante({
      usoTitular: acesso ?? null,
      usoEquipe,
      registro: (empresa ? sinais.registro.get(empresa) : undefined) ?? null,
      registros30d: (empresa ? sinais.registros30d.get(empresa) : undefined) ?? 0,
    }, agora);
    return {
      ...assinante,
      plano: {
        tier,
        nome: assinatura?.nome ?? 'Somente leitura',
        valorMensal: money(assinatura?.valorMensal ?? 0),
        status: assinatura?.status ?? null,
        renovaEm: assinatura?.renovaEm ? assinatura.renovaEm.toISOString() : null,
        emTeste: assinatura?.provider === TESTE_PROVIDER,
      },
      situacao,
      obrasGerenciadas,
      obrasAtivas: Number(obrasDoAssinante?.ativas) || 0,
      uso: {
        obrasEmAberto,
        limiteObras: assinatura ? limiteObrasDoCatalogo(getPlanCatalog('xgestao', tier).limites.obrasAtivas) : 0,
      },
      armazenamentoBytes: (empresa ? armazenamento.get(empresa) : undefined) ?? 0,
      usoPlano,
      bloqueiosPlano: {
        obrasBloqueadas: Number(obrasDoAssinante?.bloqueadas) || 0,
        membrosPausados: membrosDaEmpresa.filter((m) => m.userId !== assinante.userId && m.status === 'pausado').length,
      },
      consolidado: {
        orcamento: money(obrasDoAssinante?.orcamento),
        custoReal: (empresa ? custoPorEmpreiteira.get(empresa) : undefined) ?? 0,
        obrasAtrasadas: Number(obrasDoAssinante?.atrasadas) || 0,
        obrasParadas: Number(obrasDoAssinante?.paradas) || 0,
        ocorrenciasAbertas: (empresa ? ocorrencias.get(empresa) : undefined) ?? 0,
        pagamentosAtrasados: atrasoEmpresa.receber + atrasoEmpresa.pagar,
        recebimentosAtrasados: atrasoEmpresa.receber,
        contasAPagarAtrasadas: atrasoEmpresa.pagar,
        linksAtivos: linksEmpresa.total,
      },
      atencao: motivosAtencao(situacao, usoPlano, obrasGerenciadas, engajamento),
      ultimoAcessoEm: acesso ? acesso.toISOString() : null,
      engajamento,
      membros: membrosDaEmpresa
        .map(({ userId, nome, email, papel, status, obras }) => ({ userId, nome, email, papel, status, obras })),
      totalPago: pago?.total ?? 0,
      cancelamento: canonica && canonica.provider !== TESTE_PROVIDER && canonica.canceladaEm
        // Pedido do assinante: ainda ativa (agendado), efetivado pelo job ou com motivo.
        // Encerrada por estorno ou troca de plano não é pedido de cancelamento.
        && (canonica.status === 'ativa' || efetivadas.has(canonica.id) || canonica.motivoCancelamento || canonica.motivoCancelamentoTexto)
        ? { motivo: canonica.motivoCancelamento, texto: canonica.motivoCancelamentoTexto, pedidoEm: canonica.canceladaEm.toISOString() }
        : null,
      saida: saidaDoAssinante(canonica, situacao, efetivadas),
      trocas: trocas.get(assinante.userId) ?? { descidaAgendada: null, subidaRecente: null },
      ultimoContato: ultimosContatos.get(assinante.userId) ?? null,
      retorno: retornoDoAssinante({
        assinaturasPagas: (assinaturasPorUsuario.get(assinante.userId) ?? [])
          .filter((l) => l.provider !== TESTE_PROVIDER && Number(l.valorMensal) > 0)
          .map((l) => l.createdAt),
        saidas: eventosRetorno.get(assinante.userId)?.saidas ?? [],
        tentativasBloqueadas: eventosRetorno.get(assinante.userId)?.negados ?? 0,
      }, agora),
    };
  });
}

/**
 * XG50 — saídas (pedido de cancelamento ou estorno de assinatura paga) e
 * tentativas bloqueadas de 2º teste/bônus, por responsável.
 */
async function eventosDeRetorno(userIds: string[]): Promise<Map<string, { saidas: Date[]; negados: number }>> {
  const mapa = new Map<string, { saidas: Date[]; negados: number }>();
  if (userIds.length === 0) return mapa;
  const linhas = await db
    .select({
      dono: sql<string>`coalesce(${assinaturaEventos.userId}, ${assinaturas.userId})`,
      tipo: assinaturaEventos.tipo,
      criadoEm: assinaturaEventos.criadoEm,
      provider: assinaturas.gatewayProvider,
    })
    .from(assinaturaEventos)
    .leftJoin(assinaturas, eq(assinaturas.id, assinaturaEventos.assinaturaId))
    .where(and(
      inArray(assinaturaEventos.tipo, ['cancelamento_agendado', 'cancelamento', 'payment_refunded', 'bonus_negado', 'teste_negado']),
      or(
        and(inArray(assinaturas.userId, userIds), eq(assinaturas.persona, 'xgestao')),
        inArray(assinaturaEventos.userId, userIds),
      ),
    ));
  for (const l of linhas) {
    if (!l.dono) continue;
    const atual = mapa.get(l.dono) ?? { saidas: [], negados: 0 };
    if (l.tipo === 'bonus_negado' || l.tipo === 'teste_negado') atual.negados += 1;
    else if (l.provider !== TESTE_PROVIDER) atual.saidas.push(l.criadoEm);
    mapa.set(l.dono, atual);
  }
  return mapa;
}

/**
 * CRM-08 — quem já teve assinatura paga e hoje está em somente leitura: data
 * em que o acesso pago acabou (mesma regra de `fimDoAcessoPago` da conversão)
 * e o motivo da situação.
 */
function saidaDoAssinante(
  canonica: { id: string; userId: string; status: string; provider: string; preco: string | number; tier: string; nome: string; createdAt: Date; renovaEm: Date | null; canceladaEm: Date | null } | null,
  situacao: SituacaoAssinante,
  efetivadas: ReadonlySet<string>,
): XgestaoAssinanteDetalhe['saida'] {
  if (!canonica || situacao.codigo !== 'somente_leitura') return null;
  if (canonica.provider === TESTE_PROVIDER || !(Number(canonica.preco) > 0)) return null;
  const fim = fimDoAcessoPago({ ...canonica, plano: canonica.nome }, efetivadas);
  return { em: fim ? fim.toISOString() : null, motivo: situacao.motivo ?? 'Assinatura encerrada' };
}

/** Assinaturas com o fim agendado cumprido pelo job (`cancelamento_efetivado`). */
async function cancelamentosEfetivados(userIds: string[]): Promise<Set<string>> {
  const linhas = await db
    .select({ assinaturaId: assinaturaEventos.assinaturaId })
    .from(assinaturaEventos)
    .innerJoin(assinaturas, eq(assinaturas.id, assinaturaEventos.assinaturaId))
    .where(and(
      eq(assinaturaEventos.tipo, 'cancelamento_efetivado'),
      eq(assinaturas.persona, 'xgestao'),
      inArray(assinaturas.userId, userIds),
    ));
  return new Set(linhas.flatMap((l) => (l.assinaturaId ? [l.assinaturaId] : [])));
}

/**
 * CRM-10 — descida agendada (vale na renovação) e subida aplicada nos últimos
 * 30 dias, por responsável. A tabela vem do bootstrap da troca de plano; sem
 * ela, lê como "nenhuma troca".
 */
async function trocasParaContato(userIds: string[], agora: Date): Promise<Map<string, XgestaoAssinanteDetalhe['trocas']>> {
  const mapa = new Map<string, XgestaoAssinanteDetalhe['trocas']>();
  const planoPara = alias(planos, 'plano_para_contato');
  const desde = new Date(agora.getTime() - DIAS_SUBIDA_RECENTE * 24 * 60 * 60 * 1000);
  try {
    const linhas = await db
      .select({
        userId: assinaturaTrocas.userId,
        tipo: assinaturaTrocas.tipo,
        status: assinaturaTrocas.status,
        efetivaEm: assinaturaTrocas.efetivaEm,
        aplicadaEm: assinaturaTrocas.aplicadaEm,
        criadaEm: assinaturaTrocas.criadaEm,
        plano: planoPara.nome,
      })
      .from(assinaturaTrocas)
      .innerJoin(planoPara, eq(planoPara.id, assinaturaTrocas.planoParaId))
      .where(and(
        inArray(assinaturaTrocas.userId, userIds),
        or(
          // Status explícitos: `pendente_gateway` e `falhou` (REV-07) não contam como agendada.
          and(eq(assinaturaTrocas.tipo, 'descer'), eq(assinaturaTrocas.status, 'agendada')),
          and(eq(assinaturaTrocas.tipo, 'subir'), eq(assinaturaTrocas.status, 'aplicada'), gt(sql`coalesce(${assinaturaTrocas.aplicadaEm}, ${assinaturaTrocas.criadaEm})`, desde)),
        ),
      ))
      .orderBy(desc(assinaturaTrocas.criadaEm));
    for (const l of linhas) {
      const atual = mapa.get(l.userId) ?? { descidaAgendada: null, subidaRecente: null };
      // Ordem decrescente: a primeira de cada tipo é a mais recente.
      if (l.tipo === 'descer' && !atual.descidaAgendada) atual.descidaAgendada = { em: l.efetivaEm.toISOString(), plano: l.plano };
      if (l.tipo === 'subir' && !atual.subidaRecente) atual.subidaRecente = { em: (l.aplicadaEm ?? l.criadaEm).toISOString(), plano: l.plano };
      mapa.set(l.userId, atual);
    }
    return mapa;
  } catch (erro) {
    if ((erro as { code?: string })?.code === '42P01' || (erro as { cause?: { code?: string } })?.cause?.code === '42P01') return mapa;
    throw erro;
  }
}

/** `null` = sem limite (regra única `limiteSemTeto`). */
function limiteObrasDoCatalogo(limite: number | null | undefined): number | null {
  return limite === null || limite === undefined || limiteSemTeto(limite) ? null : limite;
}

/**
 * ADM-05 — bytes em arquivos das obras de cada empresa: anexos, fotos, fotos
 * do diário, foto de ocorrência, comprovante e contrato da equipe. Só conta o
 * arquivo do titular ou de um membro da empresa, sem `deleted_at`, uma vez por
 * empresa mesmo que esteja ligado a dois registros.
 */
async function armazenamentoPorEmpreiteira(escopo: SQL): Promise<Map<string, number>> {
  const linhas = await db
    .selectDistinct({ empreiteiraId: obras.empreiteiraId, fileId: userFiles.id, bytes: userFiles.sizeBytes })
    .from(sql`(
      select obra_id, file_id from obra_anexos where file_id is not null
      union select obra_id, file_id from obra_fotos
      union select obra_id, unnest(foto_file_ids) as file_id from obra_diario
      union select obra_id, foto_file_id from obra_ocorrencias where foto_file_id is not null
      union select obra_id, comprovante_file_id from financeiro where comprovante_file_id is not null and obra_id is not null
      union select obra_id, contrato_file_id from obra_equipe where contrato_file_id is not null
    ) as arquivo_obra`)
    .innerJoin(obras, sql`${obras.id} = arquivo_obra.obra_id`)
    .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .innerJoin(userFiles, sql`${userFiles.id} = arquivo_obra.file_id`)
    .where(and(
      escopo,
      isNull(userFiles.deletedAt),
      sql`(${userFiles.ownerUserId} = ${empreiteiras.userId} or exists (
        select 1 from xgestao_membros m
        where m.empreiteira_id = ${obras.empreiteiraId} and m.user_id = ${userFiles.ownerUserId}
      ))`,
    ));
  const mapa = new Map<string, number>();
  for (const l of linhas) {
    if (!l.empreiteiraId) continue;
    mapa.set(l.empreiteiraId, (mapa.get(l.empreiteiraId) ?? 0) + (Number(l.bytes) || 0));
  }
  return mapa;
}

function maisRecente(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function comoData(valor: unknown): Date | null {
  if (!valor) return null;
  const d = valor instanceof Date ? valor : new Date(String(valor));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * XG46 — sinais de uso de cada empresa: última sessão de cada pessoa (titular e
 * equipe), último login da equipe, último registro nas obras e quantos
 * registros entraram nos últimos 30 dias. Quatro consultas agregadas, sem
 * subquery por assinante.
 */
async function sinaisDeUso(
  titulares: string[],
  membros: Array<{ empreiteiraId: string; userId: string }>,
  escopo: NonNullable<ReturnType<typeof filtroObrasXgestao>>,
  agora: Date,
) {
  const pessoas = [...new Set([...titulares, ...membros.map((m) => m.userId).filter(Boolean)])];
  const membroIds = [...new Set(membros.map((m) => m.userId).filter(Boolean))];
  const desde = new Date(agora.getTime() - DIAS_ATIVO_MES * 24 * 60 * 60 * 1000);
  const [sessoes, loginsMembros, registros, recentes] = await Promise.all([
    db
      .select({ userId: sessions.userId, ultimo: sql<string | null>`max(${sessions.lastUsedAt})` })
      .from(sessions)
      .where(inArray(sessions.userId, pessoas))
      .groupBy(sessions.userId),
    membroIds.length
      ? db.select({ id: users.id, lastLoginAt: users.lastLoginAt }).from(users).where(inArray(users.id, membroIds))
      : Promise.resolve([] as Array<{ id: string; lastLoginAt: Date | null }>),
    // O join com empreiteiras evita o "id ambíguo" das subqueries de ultimaAtividadeObra.
    db
      .select({ empreiteiraId: obras.empreiteiraId, ultimo: sql<string | null>`max(${ultimaAtividadeObra})` })
      .from(obras)
      .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
      .where(escopo)
      .groupBy(obras.empreiteiraId),
    db
      .select({ empreiteiraId: obras.empreiteiraId, total: sql<number>`count(*)::int` })
      .from(sql`(
        select obra_id from obra_diario where created_at >= ${desde}
        union all select obra_id from financeiro where obra_id is not null and created_at >= ${desde}
        union all select obra_id from obra_fotos where created_at >= ${desde}
        union all select obra_id from obra_ocorrencias where created_at >= ${desde}
        union all select obra_id from obra_anexos where created_at >= ${desde}
      ) as registro`)
      .innerJoin(obras, sql`${obras.id} = registro.obra_id`)
      .where(escopo)
      .groupBy(obras.empreiteiraId),
  ]);
  const sessao = new Map(sessoes.map((s) => [s.userId, comoData(s.ultimo)]));
  const usoMembro = new Map<string, Date | null>(
    loginsMembros.map((m) => [m.id, maisRecente(comoData(m.lastLoginAt), sessao.get(m.id) ?? null)]),
  );
  return {
    sessao,
    usoMembro,
    registro: new Map(registros.flatMap((r) => (r.empreiteiraId ? [[r.empreiteiraId, comoData(r.ultimo)] as const] : []))),
    registros30d: new Map(recentes.flatMap((r) => (r.empreiteiraId ? [[r.empreiteiraId, Number(r.total) || 0] as const] : []))),
  };
}

/** XG44 — números da home: quantos em cada situação e quantos pedem atenção. */
export function resumoAssinaturasXgestao(assinantes: XgestaoAssinanteDetalhe[]) {
  return resumirAssinaturas(assinantes);
}

/** XG44 — os N assinantes mais urgentes, para a tabela da home. */
export function assinantesQuePedemAtencao(assinantes: XgestaoAssinanteDetalhe[], limite = 6) {
  return assinantes
    .filter((a) => a.atencao.length > 0)
    .sort((a, b) => compararAtencao(a.atencao, b.atencao) || a.empreiteiraNome.localeCompare(b.empreiteiraNome, 'pt-BR'))
    .slice(0, limite)
    .map((a) => ({
      userId: a.userId,
      empreiteiraNome: a.empreiteiraNome,
      nome: a.nome,
      tier: a.plano.tier,
      situacao: a.situacao,
      atencao: a.atencao,
    }));
}

/**
 * XG45 — filtro único da receita do xgestão no caixa da plataforma:
 * - mensalidades pagas (`xgestao_mensalidade`, uma por pagamento do gateway);
 * - o lançamento da assinatura (`assinatura`, chave = id da assinatura) quando
 *   a assinatura é do xgestão — é como o checkout manual e o fluxo antigo gravam;
 * - estorno/chargeback (`xgestao_mensalidade_estorno`, saída paga): entra com
 *   sinal negativo, então mensalidade + estorno do mesmo pagamento somam zero.
 * O recorte é pela persona da assinatura de origem, não pelo pagador: a mesma
 * conta pode ter assinatura de marketplace e de xgestão ao mesmo tempo.
 * ADM-02: o dinheiro de conta interna/teste não é receita.
 */
function receitaXgestaoQuery(opcoes: { incluirInternas?: boolean } = {}) {
  /** Cliente do lançamento: quem pagou a mensalidade ou recebeu o estorno. */
  const cliente = sql<string | null>`coalesce(${financeiro.pagadorUserId}, ${financeiro.recebedorUserId}, ${assinaturas.userId})`;
  return {
    join: and(eq(financeiro.origemTipo, 'assinatura'), eq(assinaturas.id, financeiro.origemId)),
    where: and(
      eq(financeiro.categoria, 'assinatura'),
      eq(financeiro.status, 'pago'),
      or(
        and(
          eq(financeiro.tipo, 'entrada'),
          or(
            eq(financeiro.origemTipo, ORIGEM_MENSALIDADE_XGESTAO),
            and(eq(financeiro.origemTipo, 'assinatura'), eq(assinaturas.persona, 'xgestao')),
          ),
        ),
        and(eq(financeiro.tipo, 'saida'), eq(financeiro.origemTipo, ORIGEM_ESTORNO_MENSALIDADE_XGESTAO)),
      ),
      opcoes.incluirInternas ? undefined : sql`not exists (select 1 from users u where u.id = ${cliente} and u.conta_interna)`,
    ),
    cliente,
    /** Valor com sinal: estorno subtrai. */
    valor: sql`(case when ${financeiro.tipo} = 'saida' then -${financeiro.valor} else ${financeiro.valor} end)`,
    /**
     * ADM-08 — mês do lançamento em São Paulo. `financeiro.data` é gravado com o
     * dia de UTC quando o chamador não informa a data (`lancamentos-service.ts`):
     * nesse caso o mês sai do `created_at` convertido para SP (uma mensalidade
     * paga às 22h do dia 31 é do mês 31, não do seguinte). Data informada
     * explicitamente (diferente do dia UTC da criação) é respeitada.
     */
    mes: sql<string>`(case
      when ${financeiro.createdAt} is not null and left(${financeiro.data}, 10) = to_char(${financeiro.createdAt}, 'YYYY-MM-DD')
        then to_char((${financeiro.createdAt} at time zone 'UTC') at time zone 'America/Sao_Paulo', 'YYYY-MM')
      else left(${financeiro.data}, 7) end)`,
    dia: sql<string>`(case
      when ${financeiro.createdAt} is not null and left(${financeiro.data}, 10) = to_char(${financeiro.createdAt}, 'YYYY-MM-DD')
        then to_char((${financeiro.createdAt} at time zone 'UTC') at time zone 'America/Sao_Paulo', 'YYYY-MM-DD')
      else left(${financeiro.data}, 10) end)`,
  };
}

/** XG46 — dinheiro de mensalidade do xgestão que entrou no caixa, por mês (`YYYY-MM`), já sem estornos. */
export async function receitaPorMesXgestao(): Promise<Map<string, number>> {
  const filtro = receitaXgestaoQuery();
  const linhas = await db
    .select({ mes: filtro.mes, total: sql<string>`coalesce(sum(${filtro.valor}), 0)` })
    .from(financeiro)
    .leftJoin(assinaturas, filtro.join)
    .where(filtro.where)
    .groupBy(filtro.mes);
  return new Map(linhas.map((l) => [l.mes, money(l.total)]));
}

/**
 * XG45 — quanto cada cliente já pagou ao xgestão: total líquido (estornos
 * subtraem), nº de pagamentos (só entradas) e data do último pagamento.
 */
export async function receitaPorCliente(
  userIds: string[],
  /** Detalhe de uma conta interna mostra o que ela pagou; as métricas não. */
  opcoes: { incluirInternas?: boolean } = {},
): Promise<Map<string, { total: number; pagamentos: number; ultimoEm: string | null }>> {
  const mapa = new Map<string, { total: number; pagamentos: number; ultimoEm: string | null }>();
  if (userIds.length === 0) return mapa;
  const filtro = receitaXgestaoQuery(opcoes);
  const linhas = await db
    .select({
      userId: filtro.cliente,
      total: sql<string>`coalesce(sum(${filtro.valor}), 0)`,
      pagamentos: sql<number>`(count(*) filter (where ${financeiro.tipo} = 'entrada'))::int`,
      ultimoEm: sql<string | null>`max(${filtro.dia}) filter (where ${financeiro.tipo} = 'entrada')`,
    })
    .from(financeiro)
    .leftJoin(assinaturas, filtro.join)
    .where(and(filtro.where, inArray(filtro.cliente, userIds)))
    .groupBy(filtro.cliente);
  for (const l of linhas) {
    if (l.userId) mapa.set(l.userId, { total: money(l.total), pagamentos: Number(l.pagamentos) || 0, ultimoEm: l.ultimoEm });
  }
  return mapa;
}

export interface PagamentoAssinante {
  id: string;
  tipo: 'pagamento' | 'estorno';
  descricao: string;
  /** Com sinal: estorno é negativo. */
  valor: number;
  /** `YYYY-MM-DD`, dia em São Paulo. */
  data: string;
}

const MAX_PAGAMENTOS_DETALHE = 50;

/** Lançamentos do caixa ligados ao assinante (mensalidades e estornos), do mais recente. */
export async function pagamentosDoAssinante(userId: string): Promise<PagamentoAssinante[]> {
  const filtro = receitaXgestaoQuery({ incluirInternas: true });
  const linhas = await db
    .select({
      id: financeiro.id,
      tipo: financeiro.tipo,
      descricao: financeiro.descricao,
      valor: filtro.valor,
      data: filtro.dia,
    })
    .from(financeiro)
    .leftJoin(assinaturas, filtro.join)
    .where(and(filtro.where, sql`${filtro.cliente} = ${userId}`))
    .orderBy(desc(financeiro.createdAt), desc(financeiro.id))
    .limit(MAX_PAGAMENTOS_DETALHE);
  return linhas.map((l) => ({
    id: l.id,
    tipo: l.tipo === 'saida' ? 'estorno' : 'pagamento',
    descricao: l.descricao,
    valor: money(l.valor),
    data: l.data,
  }));
}

/**
 * Receita que o produto gera para a plataforma.
 *
 * A receita acumulada sai dos lançamentos pagos do caixa (`financeiro`), a
 * mesma fonte do painel do marketplace. O recorrente é o valor mensal de quem
 * está pagando e renova (situação `pago`); quem cancelou continua contando como
 * pagante até o fim do período, mas não entra no recorrente (XG45).
 */
export async function faturamentoXgestao(
  /** Reaproveita a lista quando o chamador já a carregou (rota /financeiro). */
  assinantesCarregados?: XgestaoAssinanteDetalhe[],
): Promise<XgestaoFaturamento> {
  const assinantes = assinantesCarregados ?? (await listarAssinantesDetalhados());
  if (assinantes.length === 0) {
    return {
      receitaAcumulada: 0,
      receitaRecorrenteMensal: 0,
      assinantesPagantes: 0,
      assinantesFree: 0,
      distribuicaoPlanos: { free: 0, pro: 0, enterprise: 0, basic: 0, basic_plus: 0, premium: 0 },
    };
  }

  const filtro = receitaXgestaoQuery();
  const [receitaRow] = await db
    .select({ total: sql<string>`coalesce(sum(${filtro.valor}), 0)` })
    .from(financeiro)
    .leftJoin(assinaturas, filtro.join)
    .where(filtro.where);

  const distribuicaoPlanos: Record<XgestaoTier, number> = { free: 0, pro: 0, enterprise: 0, basic: 0, basic_plus: 0, premium: 0 };
  let receitaRecorrenteMensal = 0;
  let assinantesPagantes = 0;

  for (const assinante of assinantes) {
    distribuicaoPlanos[assinante.plano.tier] += 1;
    // Teste grátis, inadimplente e somente leitura não são receita esperada.
    if (assinante.situacao.codigo === 'pago') receitaRecorrenteMensal += assinante.plano.valorMensal;
    if (assinante.situacao.codigo === 'pago' || assinante.situacao.codigo === 'cancelamento_agendado') assinantesPagantes += 1;
  }

  return {
    receitaAcumulada: money(receitaRow?.total),
    receitaRecorrenteMensal,
    assinantesPagantes,
    assinantesFree: distribuicaoPlanos.free,
    distribuicaoPlanos,
  };
}

export type SituacaoObraAdmin = 'atrasada' | 'parada' | 'no_prazo' | 'concluida';

export interface XgestaoAssinanteObra {
  id: string;
  nome: string;
  status: string;
  situacao: SituacaoObraAdmin;
  cidade: string | null;
  uf: string | null;
  valorTotal: number;
  custoReal: number;
  dataPrevisao: string | null;
  ultimaAtividadeEm: string | null;
  linksAtivos: number;
  /** XG48 — obra só para visualização depois de descer de plano. */
  bloqueadaPorPlano: boolean;
}

/** XG48 — troca de plano marcada para a renovação (descida) e ainda não aplicada. */
export interface TrocaPlanoAgendada {
  id: string;
  planoDe: string;
  planoPara: string;
  tierDe: string;
  tierPara: string;
  valorDe: number;
  valorPara: number;
  /** valorPara - valorDe: negativo na descida (o cliente passa a pagar menos). */
  diferencaMensal: number;
  efetivaEm: string;
  criadaEm: string;
  /** Quantas obras e pessoas o cliente escolheu manter. */
  obrasMantidas: number;
  membrosMantidos: number;
}

export interface XgestaoAssinantePagina {
  assinante: XgestaoAssinanteDetalhe;
  limites: LimitesAdmin;
  obras: XgestaoAssinanteObra[];
  /** Diagnóstico administrativo — receita, custos e margem das obras do assinante. */
  lucro: ProfitSummaryData;
  /** XG45 — quanto o cliente já pagou ao xgestão (caixa da plataforma). */
  pagamentos: { total: number; pagamentos: number; ultimoEm: string | null };
  /** Mensalidades e estornos no caixa, do mais recente (estorno com valor negativo). */
  listaPagamentos: PagamentoAssinante[];
  /** XG48 — troca de plano agendada; `null` quando não há. */
  trocaAgendada: TrocaPlanoAgendada | null;
  /** CRM-07 — contatos do admin com o responsável, do mais recente. */
  contatos: ContatoAdmin[];
  /** XG45 — como foi o teste grátis deste assinante; `null` se nunca teve. */
  jornadaTeste: {
    estado: 'em_teste' | 'convertido' | 'perdido';
    inicioTeste: string;
    fimTeste: string | null;
    comBonus: boolean;
    assinouEm: string | null;
    diasAteAssinar: number | null;
  } | null;
  historico: {
    assinaturas: Array<{
      id: string;
      plano: string;
      tier: string;
      status: string;
      teste: boolean;
      valorMensal: number;
      /** XG50 — mensal ou anual (no anual, `valorMensal` é o ano / 12). */
      ciclo: string;
      iniciadaEm: string;
      renovaEm: string | null;
      canceladaEm: string | null;
    }>;
    /** Só tipo e data: o payload do gateway não sai para a tela. */
    eventos: Array<{ id: string; tipo: string; criadoEm: string }>;
  };
}

/** Teto de obras exibidas no detalhe; a lista completa fica em /admin/xgestao/obras. */
export const MAX_OBRAS_DETALHE = 200;
const MAX_EVENTOS_DETALHE = 30;

/**
 * XG44 — tudo o que o admin precisa para entender um assinante: situação,
 * uso do plano, obras com situação e custo, lucro consolidado e histórico.
 * `null` quando o id não é um responsável xgestão (membro de equipe, conta de
 * marketplace ou id inexistente) — a rota responde 404 sem revelar qual.
 */
export async function detalheAssinanteXgestao(userId: string): Promise<XgestaoAssinantePagina | null> {
  // ADM-02 — o detalhe abre também conta interna (é onde o admin a desmarca).
  const [assinante] = await listarAssinantesDetalhados({ userIds: [userId], internas: 'incluir' });
  if (!assinante) return null;

  // ADM-06 — responsável sem empresa abre o detalhe, só sem obras.
  const escopo = filtroObrasXgestao(assinante.empreiteiraId ? [assinante.empreiteiraId] : []) ?? sql`false`;
  const diasParada = await getDiasObraParada();

  const [obraRows, historicoRows, eventoRows] = await Promise.all([
    db
      .select({
        id: obras.id,
        nome: obras.nome,
        status: obras.status,
        cidade: obras.cidade,
        uf: obras.uf,
        valorTotal: obras.valorTotal,
        dataPrevisao: obras.dataPrevisao,
        ultimaAtividadeEm: ultimaAtividadeObra,
        atrasada: sql<boolean>`coalesce(${obraAtrasada}, false)`,
        bloqueadaPorPlano: obras.xgestaoBloqueadaPorPlano,
        parada: sql<boolean>`coalesce(${obraParada(diasParada)}, false)`,
      })
      .from(obras)
      // O join obriga o Drizzle a qualificar as colunas ("obras"."id"): sem ele
      // o `id` solto dentro das subconsultas de `ultimaAtividadeObra` fica
      // ambíguo com o `id` das tabelas filhas (erro 42702). Mesmo motivo em `obras.ts`.
      .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
      .where(escopo)
      .orderBy(desc(obras.updatedAt), desc(obras.id))
      .limit(MAX_OBRAS_DETALHE),
    db
      .select({
        id: assinaturas.id,
        plano: planos.nome,
        tier: planos.tier,
        status: assinaturas.status,
        provider: assinaturas.gatewayProvider,
        valorMensal: precoMensalEquivalente,
        ciclo: assinaturas.ciclo,
        iniciadaEm: assinaturas.iniciadaEm,
        renovaEm: assinaturas.renovaEm,
        canceladaEm: assinaturas.canceladaEm,
        createdAt: assinaturas.createdAt,
      })
      .from(assinaturas)
      .innerJoin(planos, eq(planos.id, assinaturas.planoId))
      .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')))
      .orderBy(desc(assinaturas.createdAt)),
    db
      .select({ id: assinaturaEventos.id, tipo: assinaturaEventos.tipo, criadoEm: assinaturaEventos.criadoEm })
      .from(assinaturaEventos)
      // XG50 — inclui eventos da conta sem assinatura (ex.: `teste_negado`).
      .leftJoin(assinaturas, eq(assinaturas.id, assinaturaEventos.assinaturaId))
      .where(or(
        and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')),
        eq(assinaturaEventos.userId, userId),
      ))
      .orderBy(desc(assinaturaEventos.criadoEm))
      .limit(MAX_EVENTOS_DETALHE),
  ]);

  const obraIds = obraRows.map((o) => o.id);
  const agora = new Date();
  const [custoPorObra, lucro, linkRows, pagoPorCliente, listaPagamentos, trocaAgendada, contatos] = await Promise.all([
    custoRealPorObra(obraIds),
    computeProfitSummaryForObras(obraIds),
    obraIds.length === 0
      ? Promise.resolve([] as Array<{ obraId: string; total: number }>)
      : db
        .select({ obraId: obraShareLinks.obraId, total: sql<number>`count(*)::int` })
        .from(obraShareLinks)
        .where(and(
          inArray(obraShareLinks.obraId, obraIds),
          eq(obraShareLinks.ativo, true),
          eq(obraShareLinks.pausadoPorPlano, false),
          or(isNull(obraShareLinks.expiraEm), gt(obraShareLinks.expiraEm, agora)),
        ))
        .groupBy(obraShareLinks.obraId),
    receitaPorCliente([userId], { incluirInternas: true }),
    pagamentosDoAssinante(userId),
    trocaAgendadaDoAssinante(userId),
    listarContatosAssinante(userId),
  ]);
  const jornada = jornadaDoTeste(historicoRows.map((h) => ({
    id: h.id, userId, status: h.status, provider: h.provider, tier: h.tier, plano: h.plano,
    preco: h.valorMensal, createdAt: h.createdAt, renovaEm: h.renovaEm, canceladaEm: h.canceladaEm,
  })), agora);
  const linksPorObra = new Map(linkRows.map((l) => [l.obraId, Number(l.total) || 0]));
  const iso = (data: Date | null) => (data ? data.toISOString() : null);

  return {
    assinante,
    limites: limitesDoTier(assinante.situacao.codigo === 'somente_leitura' || assinante.situacao.codigo === 'sem_teste'
      ? null
      : assinante.plano.tier),
    obras: obraRows.map((o) => ({
      id: o.id,
      nome: o.nome,
      status: o.status,
      // Concluída não está atrasada nem parada; atrasada vence parada (é a mais grave).
      situacao: o.status === 'concluida' ? 'concluida' : o.atrasada ? 'atrasada' : o.parada ? 'parada' : 'no_prazo',
      cidade: o.cidade,
      uf: o.uf,
      valorTotal: money(o.valorTotal),
      custoReal: custoPorObra.get(o.id) ?? 0,
      dataPrevisao: o.dataPrevisao,
      ultimaAtividadeEm: o.ultimaAtividadeEm ? new Date(o.ultimaAtividadeEm).toISOString() : null,
      linksAtivos: linksPorObra.get(o.id) ?? 0,
      bloqueadaPorPlano: o.bloqueadaPorPlano,
    })),
    lucro,
    pagamentos: pagoPorCliente.get(userId) ?? { total: 0, pagamentos: 0, ultimoEm: null },
    listaPagamentos,
    trocaAgendada,
    contatos,
    jornadaTeste: jornada && {
      estado: jornada.estado,
      inicioTeste: jornada.inicioTeste.toISOString(),
      fimTeste: iso(jornada.fimTeste),
      comBonus: jornada.comBonus,
      assinouEm: iso(jornada.assinouEm),
      diasAteAssinar: jornada.diasAteAssinar === null ? null : Math.round(jornada.diasAteAssinar * 10) / 10,
    },
    historico: {
      assinaturas: historicoRows.map((h) => ({
        id: h.id,
        plano: h.plano,
        tier: h.tier,
        status: h.status,
        teste: h.provider === TESTE_PROVIDER,
        valorMensal: money(h.valorMensal),
        ciclo: h.ciclo,
        iniciadaEm: h.iniciadaEm.toISOString(),
        renovaEm: iso(h.renovaEm),
        canceladaEm: iso(h.canceladaEm),
      })),
      eventos: eventoRows.map((e) => ({ id: e.id, tipo: e.tipo, criadoEm: e.criadoEm.toISOString() })),
    },
  };
}

/**
 * XG48 — troca agendada mais recente do assinante (descida que vale na
 * renovação). A tabela é criada pelo bootstrap da troca de plano; se ainda não
 * existir no banco, o detalhe abre sem a troca em vez de quebrar.
 */
async function trocaAgendadaDoAssinante(userId: string): Promise<TrocaPlanoAgendada | null> {
  const planoDe = alias(planos, 'plano_de');
  const planoPara = alias(planos, 'plano_para');
  try {
    const [linha] = await db
      .select({
        id: assinaturaTrocas.id,
        planoDe: planoDe.nome,
        planoPara: planoPara.nome,
        tierDe: assinaturaTrocas.tierDe,
        tierPara: assinaturaTrocas.tierPara,
        valorDe: assinaturaTrocas.valorDe,
        valorPara: assinaturaTrocas.valorPara,
        efetivaEm: assinaturaTrocas.efetivaEm,
        criadaEm: assinaturaTrocas.criadaEm,
        escolhas: assinaturaTrocas.escolhas,
      })
      .from(assinaturaTrocas)
      .innerJoin(planoDe, eq(planoDe.id, assinaturaTrocas.planoDeId))
      .innerJoin(planoPara, eq(planoPara.id, assinaturaTrocas.planoParaId))
      .where(and(eq(assinaturaTrocas.userId, userId), eq(assinaturaTrocas.status, 'agendada')))
      .orderBy(desc(assinaturaTrocas.criadaEm))
      .limit(1);
    if (!linha) return null;
    const valorDe = money(linha.valorDe);
    const valorPara = money(linha.valorPara);
    return {
      id: linha.id,
      planoDe: linha.planoDe,
      planoPara: linha.planoPara,
      tierDe: linha.tierDe,
      tierPara: linha.tierPara,
      valorDe,
      valorPara,
      diferencaMensal: Math.round((valorPara - valorDe) * 100) / 100,
      efetivaEm: linha.efetivaEm.toISOString(),
      criadaEm: linha.criadaEm.toISOString(),
      obrasMantidas: linha.escolhas?.obras?.length ?? 0,
      membrosMantidos: linha.escolhas?.membros?.length ?? 0,
    };
  } catch (erro) {
    // 42P01: tabela ainda não criada neste ambiente.
    if ((erro as { code?: string })?.code === '42P01' || (erro as { cause?: { code?: string } })?.cause?.code === '42P01') return null;
    throw erro;
  }
}
