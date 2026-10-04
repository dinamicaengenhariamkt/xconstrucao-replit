import 'server-only';

import { and, count, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, financeiro, obras, planos, users } from '@shared/db/schema';
import { getPlanCatalog } from '@shared/lib/plans-catalog';
import {
  filtroObrasXgestao,
  listarMembrosEmpreiteirasXgestao,
  listarAssinantesXgestao as listarBase,
  type XgestaoAssinanteBase,
  type XgestaoMembroEmpresa,
} from './escopo';
import { expirarTestesVencidos, TESTE_PROVIDER } from '@features/xgestao/teste/server/teste-service';

export type XgestaoTier = 'free' | 'pro' | 'enterprise';

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
  obrasGerenciadas: number;
  obrasAtivas: number;
  /**
   * XG36 — uso do plano pela mesma regra do limite (`create-obra.ts`): obras não
   * concluídas. `limiteObras >= 9999` significa sem limite (fase de teste, XG39).
   */
  uso: { obrasEmAberto: number; limiteObras: number };
  /** XG36 — último login do responsável (`users.last_login_at`). */
  ultimoAcessoEm: string | null;
  /** Pessoas vinculadas à empresa; não entram na contagem de assinantes. */
  membros: Array<Pick<XgestaoMembroEmpresa, 'userId' | 'nome' | 'email' | 'papel' | 'status' | 'obras'>>;
}

export interface XgestaoFaturamento {
  /**
   * Receita da plataforma com as assinaturas do produto — o que entra para
   * nós. Não confundir com o lucro das obras, que é do assinante.
   */
  receitaAcumulada: number;
  /** Soma do valor mensal das assinaturas pagas ativas. */
  receitaRecorrenteMensal: number;
  assinantesPagantes: number;
  assinantesFree: number;
  distribuicaoPlanos: Record<XgestaoTier, number>;
}

function money(valor: unknown): number {
  const parsed = Number(valor ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Assinantes com plano, contagem de obras e situação da cobrança.
 *
 * Uma consulta por dimensão, agregada em memória sobre a lista de assinantes —
 * evita repetir subquery por linha e mantém o custo constante no número de
 * assinantes, não no de obras.
 */
export async function listarAssinantesDetalhados(): Promise<XgestaoAssinanteDetalhe[]> {
  // XG35 — teste vencido não pode aparecer como plano ativo na lista.
  await expirarTestesVencidos();
  const base = await listarBase();
  if (base.length === 0) return [];

  const userIds = base.map((assinante) => assinante.userId);
  const empreiteiraIds = base.map((assinante) => assinante.empreiteiraId);
  // `base.length === 0` já retornou acima, então o filtro nunca é nulo aqui —
  // mas checar em vez de castar preserva a garantia se a ordem mudar.
  const escopo = filtroObrasXgestao(empreiteiraIds);
  if (!escopo) return [];

  const [assinaturaRows, obraRows, planoFree, membros, acessos] = await Promise.all([
    db
      .select({
        userId: assinaturas.userId,
        status: assinaturas.status,
        provider: assinaturas.gatewayProvider,
        renovaEm: assinaturas.renovaEm,
        tier: planos.tier,
        nome: planos.nome,
        valorMensal: planos.valorMensal,
      })
      .from(assinaturas)
      .innerJoin(planos, eq(planos.id, assinaturas.planoId))
      .where(and(eq(assinaturas.persona, 'xgestao'), inArray(assinaturas.userId, userIds)))
      .orderBy(desc(assinaturas.iniciadaEm)),
    db
      .select({
        empreiteiraId: obras.empreiteiraId,
        total: count(),
        ativas: sql<number>`count(*) filter (where ${obras.status} = 'em_andamento')::int`,
        emAberto: sql<number>`count(*) filter (where ${obras.status} <> 'concluida')::int`,
      })
      .from(obras)
      .where(escopo)
      .groupBy(obras.empreiteiraId),
    db
      .select({ nome: planos.nome, valorMensal: planos.valorMensal })
      .from(planos)
      .where(and(eq(planos.persona, 'xgestao'), eq(planos.tier, 'free')))
      .limit(1),
    listarMembrosEmpreiteirasXgestao([...new Set(empreiteiraIds)]),
    db.select({ id: users.id, lastLoginAt: users.lastLoginAt }).from(users).where(inArray(users.id, userIds)),
  ]);
  const ultimoAcesso = new Map(acessos.map((linha) => [linha.id, linha.lastLoginAt]));

  // Só assinatura **ativa** define o tier, o mesmo critério de `dashboard.ts`.
  // Pegar a mais recente de qualquer status faria quem cancelou o pro e voltou
  // ao free aparecer como pro aqui e como free no painel — duas telas do mesmo
  // produto discordando. A consulta já vem da mais recente para a mais antiga.
  const porUsuario = new Map<string, (typeof assinaturaRows)[number]>();
  for (const linha of assinaturaRows) {
    if (linha.status !== 'ativa') continue;
    if (!porUsuario.has(linha.userId)) porUsuario.set(linha.userId, linha);
  }
  const obrasPorEmpreiteira = new Map(obraRows.map((linha) => [linha.empreiteiraId, linha]));
  const membrosPorEmpreiteira = new Map<string, XgestaoMembroEmpresa[]>();
  for (const membro of membros) {
    const lista = membrosPorEmpreiteira.get(membro.empreiteiraId) ?? [];
    lista.push(membro);
    membrosPorEmpreiteira.set(membro.empreiteiraId, lista);
  }

  return base.map((assinante) => {
    const assinatura = porUsuario.get(assinante.userId);
    const obrasDoAssinante = obrasPorEmpreiteira.get(assinante.empreiteiraId);
    const tier = (assinatura?.tier ?? 'free') as XgestaoTier;
    const acesso = ultimoAcesso.get(assinante.userId);
    return {
      ...assinante,
      plano: {
        tier,
        nome: assinatura?.nome ?? planoFree[0]?.nome ?? 'Freemium',
        valorMensal: money(assinatura?.valorMensal ?? planoFree[0]?.valorMensal),
        status: assinatura?.status ?? null,
        renovaEm: assinatura?.renovaEm ? assinatura.renovaEm.toISOString() : null,
        emTeste: assinatura?.provider === TESTE_PROVIDER,
      },
      obrasGerenciadas: obrasDoAssinante?.total ?? 0,
      obrasAtivas: obrasDoAssinante?.ativas ?? 0,
      uso: {
        obrasEmAberto: Number(obrasDoAssinante?.emAberto) || 0,
        limiteObras: getPlanCatalog('xgestao', tier).limites.obrasAtivas ?? 0,
      },
      ultimoAcessoEm: acesso ? acesso.toISOString() : null,
      membros: (membrosPorEmpreiteira.get(assinante.empreiteiraId) ?? [])
        .map(({ userId, nome, email, papel, status, obras }) => ({ userId, nome, email, papel, status, obras })),
    };
  });
}

/**
 * Receita que o produto gera para a plataforma.
 *
 * A receita acumulada sai dos lançamentos já registrados em `financeiro`
 * (`categoria = 'assinatura'`), a mesma fonte do painel do marketplace. O
 * recorrente é derivado do catálogo, pelas assinaturas ativas.
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
      distribuicaoPlanos: { free: 0, pro: 0, enterprise: 0 },
    };
  }

  // O recorte é pela **persona da assinatura de origem**, não pelo pagador: a
  // mesma conta pode ter assinatura de marketplace e de xgestão ao mesmo tempo
  // (schema.ts, `assinaturas.persona`), e filtrar por usuário somaria a receita
  // do marketplace justamente na tela que existe para separar as duas.
  // `origemId` aponta para `assinaturas.id` (ver `criarLancamentoPlataforma`).
  const [receitaRow] = await db
    .select({
      total: sql<string>`coalesce(sum(${financeiro.valor}), 0)`,
    })
    .from(financeiro)
    .innerJoin(assinaturas, eq(assinaturas.id, financeiro.origemId))
    .where(and(
      eq(financeiro.categoria, 'assinatura'),
      eq(financeiro.tipo, 'entrada'),
      eq(financeiro.status, 'pago'),
      eq(financeiro.origemTipo, 'assinatura'),
      eq(assinaturas.persona, 'xgestao'),
    ));

  const distribuicaoPlanos: Record<XgestaoTier, number> = { free: 0, pro: 0, enterprise: 0 };
  let receitaRecorrenteMensal = 0;
  let assinantesPagantes = 0;

  for (const assinante of assinantes) {
    distribuicaoPlanos[assinante.plano.tier] += 1;
    // Só assinatura paga e ativa entra no recorrente: inadimplente e cancelada
    // não são receita esperada para o próximo ciclo.
    // XG35 — teste grátis não é receita recorrente.
    if (assinante.plano.tier !== 'free' && assinante.plano.status === 'ativa' && !assinante.plano.emTeste) {
      receitaRecorrenteMensal += assinante.plano.valorMensal;
      assinantesPagantes += 1;
    }
  }

  return {
    receitaAcumulada: money(receitaRow?.total),
    receitaRecorrenteMensal,
    assinantesPagantes,
    assinantesFree: distribuicaoPlanos.free,
    distribuicaoPlanos,
  };
}
