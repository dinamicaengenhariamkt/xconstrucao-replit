import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, empreiteiras, planos } from '@shared/db/schema';
import { assinaturaXgestaoVigente } from '../lib/acesso-plano';
import { getPlanCatalog, type PlanoTier } from '@shared/lib/plans-catalog';

type Leitor = Pick<typeof db, 'select'>;

export async function planoDaEmpresa(empreiteiraId: string, leitor: Leitor = db) {
  const [empresa] = await leitor.select({ titular: empreiteiras.userId }).from(empreiteiras)
    .where(eq(empreiteiras.id, empreiteiraId));
  if (!empresa?.titular) throw new Error('Empresa xgestão sem titular.');
  const [assinatura] = await leitor.select({
    id: assinaturas.id, status: assinaturas.status, provider: assinaturas.gatewayProvider,
    renovaEm: assinaturas.renovaEm, preco: planos.valorMensal, tier: planos.tier,
  }).from(assinaturas).innerJoin(planos, eq(planos.id, assinaturas.planoId)).where(and(
    eq(assinaturas.userId, empresa.titular),
    eq(assinaturas.persona, 'xgestao'), eq(planos.persona, 'xgestao'),
  )).orderBy(sql`CASE WHEN ${assinaturas.status} = 'ativa' THEN 0 ELSE 1 END`, desc(assinaturas.createdAt)).limit(1);
  const vigente = assinaturaXgestaoVigente(assinatura ?? null);
  // Compatibilidade de assinaturas sandbox antigas: mantém os direitos anteriores
  // sem alterar contratos externos, mas não oferece esses planos para compra.
  const tier = assinatura?.tier as PlanoTier | undefined;
  const limites = vigente && tier ? getPlanCatalog('xgestao', tier).limites : {
    obrasAtivas: 0, pessoasEmpresa: 0, linksPorObra: 0, valoresPublicos: 0,
  };
  return { titular: empresa.titular, somenteLeitura: !vigente, tier: vigente ? tier! : null, limites };
}

export async function erroEscritaEmpresa(empreiteiraId: string): Promise<string | null> {
  const plano = await planoDaEmpresa(empreiteiraId);
  return plano.somenteLeitura
    ? 'Sua conta xgestão está somente para leitura. Inicie o teste gratuito ou assine um plano para continuar editando. Seus dados foram preservados.'
    : null;
}
