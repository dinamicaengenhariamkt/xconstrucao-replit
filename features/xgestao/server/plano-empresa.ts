import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, empreiteiras, planos } from '@shared/db/schema';
import { assinaturaXgestaoVigente } from '../lib/acesso-plano';
import { getPlanCatalog, type PlanoTier } from '@shared/lib/plans-catalog';

type Leitor = Pick<typeof db, 'select'>;

const SEM_LIMITES = { obrasAtivas: 0, pessoasEmpresa: 0, linksPorObra: 0, valoresPublicos: 0 };

/**
 * Situação do plano xgestão de um titular. É a ÚNICA leitura de vigência:
 * escrita, limites, aba Plano e admin devem passar por aqui (ou por
 * `planoDaEmpresa`) para não discordarem entre si.
 */
export async function situacaoPlanoXgestao(titularId: string, leitor: Leitor = db): Promise<SituacaoPlano> {
  const situacao = await lerSituacao(titularId, leitor);
  // XG48 — descida de plano cuja data chegou: aplica na hora (idempotente) e
  // relê. Dentro de uma transação alheia só respeita o tier novo na leitura;
  // a escrita fica para a próxima leitura fora dela ou para o job do boot.
  if (situacao.descidaVencida) {
    if (leitor === db) {
      const { aplicarTrocasVencidas } = await import('./troca-marcas');
      await aplicarTrocasVencidas(titularId);
      return (await lerSituacao(titularId, leitor)).resultado;
    }
  }
  return situacao.resultado;
}

type SituacaoPlano = {
  somenteLeitura: boolean;
  tier: PlanoTier | null;
  limites: Record<string, number>;
  assinatura: Awaited<ReturnType<typeof consultarAssinatura>> | null;
};

async function consultarAssinatura(titularId: string, leitor: Leitor) {
  const [assinatura] = await leitor.select({
    id: assinaturas.id, status: assinaturas.status, provider: assinaturas.gatewayProvider,
    renovaEm: assinaturas.renovaEm, canceladaEm: assinaturas.canceladaEm,
    fimTesteEm: assinaturas.fimTesteEm, primeiroPagamentoEm: assinaturas.primeiroPagamentoEm,
    preco: planos.valorMensal, tier: planos.tier,
    // XG48 — tier de uma descida agendada cuja data já passou (ainda não aplicada).
    tierDescidaVencida: sql<string | null>`(
      SELECT t.tier_para FROM assinatura_trocas t
      WHERE t.assinatura_id = ${assinaturas.id} AND t.status = 'agendada' AND t.efetiva_em <= NOW()
      LIMIT 1
    )`,
  }).from(assinaturas).innerJoin(planos, eq(planos.id, assinaturas.planoId)).where(and(
    eq(assinaturas.userId, titularId),
    eq(assinaturas.persona, 'xgestao'), eq(planos.persona, 'xgestao'),
  )).orderBy(
    sql`CASE ${assinaturas.status} WHEN 'ativa' THEN 0 WHEN 'inadimplente' THEN 1 ELSE 2 END`,
    desc(assinaturas.createdAt),
  ).limit(1);
  return assinatura;
}

async function lerSituacao(titularId: string, leitor: Leitor) {
  const assinatura = await consultarAssinatura(titularId, leitor);
  const vigente = assinaturaXgestaoVigente(assinatura ?? null);
  // Compatibilidade de assinaturas sandbox antigas: mantém os direitos anteriores
  // sem alterar contratos externos, mas não oferece esses planos para compra.
  const tier = (assinatura?.tierDescidaVencida ?? assinatura?.tier) as PlanoTier | undefined;
  const limites = vigente && tier ? getPlanCatalog('xgestao', tier).limites : SEM_LIMITES;
  return {
    descidaVencida: Boolean(assinatura?.tierDescidaVencida),
    resultado: {
      somenteLeitura: !vigente,
      tier: vigente ? tier! : null,
      limites,
      assinatura: assinatura ?? null,
    } satisfies SituacaoPlano,
  };
}

export async function planoDaEmpresa(empreiteiraId: string, leitor: Leitor = db) {
  const [empresa] = await leitor.select({ titular: empreiteiras.userId }).from(empreiteiras)
    .where(eq(empreiteiras.id, empreiteiraId));
  if (!empresa?.titular) throw new Error('Empresa xgestão sem titular.');
  const { somenteLeitura, tier, limites } = await situacaoPlanoXgestao(empresa.titular, leitor);
  return { titular: empresa.titular, somenteLeitura, tier, limites };
}

export async function erroEscritaEmpresa(empreiteiraId: string): Promise<string | null> {
  const plano = await planoDaEmpresa(empreiteiraId);
  return plano.somenteLeitura
    ? 'Sua conta xgestão está somente para leitura. Assine um plano para continuar editando. Seus dados foram preservados.'
    : null;
}
