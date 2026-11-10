import { and, desc, eq, gte, inArray, lt, ne, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturaEventos, assinaturas, planos } from '@shared/db/schema';
import { getConfigTesteXgestao } from '@features/admin/platform-settings/server/settings-reader';
import {
  bloqueioDoTeste,
  primeiraCobrancaComBonus,
  TOLERANCIA_FIM_TESTE_MS,
} from '@features/xgestao/lib/acesso-plano';

/**
 * XG35 — teste grátis do xgestão.
 *
 * O teste é uma **assinatura de verdade** (`persona = 'xgestao'`, `status = 'ativa'`)
 * com `gateway_provider = 'trial'` e `renova_em` = fim do teste. Assim, limites,
 * aba Plano e admin enxergam o plano do teste sem nenhuma mudança de schema, e o
 * índice único `(user_id, persona) WHERE status = 'ativa'` impede dois testes
 * (ou teste + plano pago) ativos ao mesmo tempo.
 *
 * O vencimento é **preguiçoso**: `expirarTestesVencidos` roda na leitura do plano
 * e no boot. Não depende de cron, que não existe no deploy atual. A conta só
 * fica somente leitura 24h depois do fim do prazo (`TOLERANCIA_FIM_TESTE_MS`).
 *
 * 09/11/2026: o teste é do plano Basic e começa sozinho no primeiro acesso do
 * responsável (`iniciarTesteAutomatico`), sem depender de botão.
 *
 * Eventos em `assinatura_eventos`: `teste_iniciado`, `teste_expirado` e
 * `teste_aviso_confirmado` (o assinante viu o fim e seguiu em somente leitura).
 */
export const TESTE_PROVIDER = 'trial';

/**
 * Condição "assinatura vigente" que ignora teste já vencido, mesmo antes de o
 * vencimento preguiçoso gravar `expirada`. Usada onde o tier é resolvido.
 * Sem `server-only` neste arquivo de propósito: `assinatura-service` o importa e
 * roda também nos testes com `tsx`, fora do Next.
 */
export function naoEhTesteVencido(): SQL {
  const limite = new Date(Date.now() - TOLERANCIA_FIM_TESTE_MS);
  return or(ne(assinaturas.gatewayProvider, TESTE_PROVIDER), gte(assinaturas.renovaEm, limite)) as SQL;
}

export type EstadoTeste = {
  /** Nunca teve teste e não tem plano pago ativo: pode iniciar. */
  elegivel: boolean;
  /**
   * 10/11/2026 — a conta nunca teve teste, mas o CPF/CNPJ dela já usou o teste
   * em outra conta (XG50). A tela de planos explica sem citar a outra conta.
   */
  testeNegadoPorDocumento: boolean;
  emTeste: boolean;
  /** ISO do fim do teste ativo, ou do último teste vencido. */
  fimTeste: string | null;
  /** ISO de quando a conta fica somente leitura: fim do teste + 24h. */
  bloqueioEm: string | null;
  /** O prazo acabou, mas ainda está nas 24h antes do somente leitura. */
  emTolerancia: boolean;
  /**
   * ISO da 1ª cobrança de quem assina agora (+1 mês após o fim do teste).
   * Nulo quando o bônus não vale mais (XG50: já usado na conta ou no CPF/CNPJ).
   */
  primeiraCobrancaComBonus: string | null;
  /** XG50 — assinar agora ainda dá o +1 mês (uma vez por conta e por CPF/CNPJ). */
  bonusDisponivel: boolean;
  diasRestantes: number | null;
  /** Teste venceu e o assinante ainda não respondeu ao aviso. */
  avisoFimPendente: boolean;
  duracaoDias: number;
  tierTeste: 'basic' | 'basic_plus' | 'premium';
};

export class TesteError extends Error {
  constructor(public code: 'JA_USOU_TESTE' | 'JA_ASSINANTE' | 'PLANO_INDISPONIVEL') {
    super(code);
  }
}

/** Vence os testes cujo prazo passou. Idempotente; `userId` restringe a uma conta. */
export async function expirarTestesVencidos(userId?: string): Promise<number> {
  const vencidos = await db
    .update(assinaturas)
    .set({ status: 'expirada', canceladaEm: new Date() })
    .where(and(
      eq(assinaturas.gatewayProvider, TESTE_PROVIDER),
      eq(assinaturas.persona, 'xgestao'),
      eq(assinaturas.status, 'ativa'),
      lt(assinaturas.renovaEm, new Date(Date.now() - TOLERANCIA_FIM_TESTE_MS)),
      ...(userId ? [eq(assinaturas.userId, userId)] : []),
    ))
    .returning({ id: assinaturas.id });
  if (vencidos.length > 0) {
    await db.insert(assinaturaEventos).values(
      vencidos.map((v) => ({ assinaturaId: v.id, tipo: 'teste_expirado', payloadJson: {} })),
    );
  }
  return vencidos.length;
}

export async function getEstadoTeste(userId: string): Promise<EstadoTeste> {
  await expirarTestesVencidos(userId);
  const config = await getConfigTesteXgestao();

  const [ativa] = await db
    .select({ provider: assinaturas.gatewayProvider, renovaEm: assinaturas.renovaEm })
    .from(assinaturas)
    .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao'), eq(assinaturas.status, 'ativa')))
    .limit(1);

  const [ultimoTeste] = await db
    .select({ id: assinaturas.id, status: assinaturas.status, renovaEm: assinaturas.renovaEm })
    .from(assinaturas)
    .where(and(
      eq(assinaturas.userId, userId),
      eq(assinaturas.persona, 'xgestao'),
      eq(assinaturas.gatewayProvider, TESTE_PROVIDER),
    ))
    .orderBy(desc(assinaturas.createdAt))
    .limit(1);

  const emTeste = ativa?.provider === TESTE_PROVIDER;
  const fim = ultimoTeste?.renovaEm ?? null;

  let avisoFimPendente = false;
  // Aviso só faz sentido se o teste venceu e a conta não assinou depois.
  if (!ativa && ultimoTeste?.status === 'expirada') {
    const [confirmado] = await db
      .select({ id: assinaturaEventos.id })
      .from(assinaturaEventos)
      .where(and(
        eq(assinaturaEventos.assinaturaId, ultimoTeste.id),
        eq(assinaturaEventos.tipo, 'teste_aviso_confirmado'),
      ))
      .limit(1);
    avisoFimPendente = !confirmado;
  }

  // XG50 — teste e bônus valem uma vez por conta e por CPF/CNPJ.
  let elegivel = !ativa && !ultimoTeste;
  let testeNegadoPorDocumento = false;
  let bonusDisponivel = emTeste;
  if (elegivel || bonusDisponivel) {
    const { documentoDoUsuario, documentoUsadoEmOutraConta } = await import('@features/xgestao/server/documento-antiabuso');
    const documento = await documentoDoUsuario(userId);
    if (elegivel && documento && await documentoUsadoEmOutraConta(documento, userId, 'teste')) {
      elegivel = false;
      testeNegadoPorDocumento = true;
    }
    if (bonusDisponivel) {
      const [usado] = await db.select({ id: assinaturas.id }).from(assinaturas).where(and(
        eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao'), sql`${assinaturas.fimTesteEm} IS NOT NULL`,
      )).limit(1);
      bonusDisponivel = !usado && !(documento && await documentoUsadoEmOutraConta(documento, userId, 'bonus'));
    }
  }

  const agora = Date.now();
  return {
    elegivel,
    testeNegadoPorDocumento,
    bonusDisponivel,
    emTeste,
    fimTeste: fim ? fim.toISOString() : null,
    bloqueioEm: fim ? bloqueioDoTeste(fim).toISOString() : null,
    emTolerancia: emTeste && fim !== null && fim.getTime() <= agora,
    primeiraCobrancaComBonus: emTeste && fim && bonusDisponivel ? primeiraCobrancaComBonus(fim).toISOString() : null,
    diasRestantes: emTeste && fim ? Math.max(0, Math.ceil((fim.getTime() - agora) / 86_400_000)) : null,
    avisoFimPendente,
    duracaoDias: config.dias,
    tierTeste: config.tier,
  };
}

/** Inicia o teste. Uma vez por conta, e só sem plano pago ativo. */
export async function iniciarTeste(userId: string): Promise<{ fimTeste: string }> {
  await expirarTestesVencidos(userId);
  const config = await getConfigTesteXgestao();

  const [plano] = await db
    .select({ id: planos.id })
    .from(planos)
    .where(and(eq(planos.persona, 'xgestao'), eq(planos.tier, config.tier), eq(planos.ativo, true)))
    .limit(1);
  if (!plano) throw new TesteError('PLANO_INDISPONIVEL');

  // XG50 — um teste por CPF/CNPJ: outra conta com o mesmo documento já teve
  // teste. Desde 10/11/2026 o responsável informa o documento no 1º passo do
  // wizard, antes do 1º acesso ao `/xgestao` (o layout espera o wizard), então
  // a conferência vale já no início automático. Conta antiga sem documento
  // segue como antes: o mês bônus é conferido no checkout.
  const { documentoDoUsuario, documentoUsadoEmOutraConta, registrarTentativaNegada } = await import('@features/xgestao/server/documento-antiabuso');
  const documento = await documentoDoUsuario(userId);
  if (documento && await documentoUsadoEmOutraConta(documento, userId, 'teste')) {
    await registrarTentativaNegada({ userId, tipo: 'teste_negado', motivo: 'documento_em_outra_conta', unicaPorConta: true });
    throw new TesteError('JA_USOU_TESTE');
  }

  return db.transaction(async (tx) => {
    // Serializa tentativas concorrentes da mesma conta.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`xgestao-teste:${userId}`}))`);

    const existentes = await tx
      .select({ provider: assinaturas.gatewayProvider, status: assinaturas.status })
      .from(assinaturas)
      .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')));
    if (existentes.some((a) => a.provider === TESTE_PROVIDER)) throw new TesteError('JA_USOU_TESTE');
    if (existentes.some((a) => a.status === 'ativa')) throw new TesteError('JA_ASSINANTE');

    const fim = new Date(Date.now() + config.dias * 86_400_000);
    const [nova] = await tx
      .insert(assinaturas)
      .values({
        userId,
        planoId: plano.id,
        persona: 'xgestao',
        status: 'ativa',
        ciclo: 'mensal',
        renovaEm: fim,
        gatewayProvider: TESTE_PROVIDER,
        documentoFiscal: documento ?? null,
      })
      .returning({ id: assinaturas.id });
    await tx.insert(assinaturaEventos).values({
      assinaturaId: nova.id,
      tipo: 'teste_iniciado',
      payloadJson: { dias: config.dias, tier: config.tier },
    });
    return { fimTeste: fim.toISOString() };
  });
}

/**
 * Começa o teste no primeiro acesso do responsável. Só para quem nunca teve
 * nenhuma assinatura xgestão (teste ou paga): ex-assinante não ganha teste novo
 * sozinho. Nunca lança: falhar aqui não pode derrubar a página.
 */
export async function iniciarTesteAutomatico(userId: string): Promise<boolean> {
  try {
    const [qualquer] = await db
      .select({ id: assinaturas.id })
      .from(assinaturas)
      .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')))
      .limit(1);
    if (qualquer) return false;
    await iniciarTeste(userId);
    return true;
  } catch (err) {
    if (!(err instanceof TesteError)) console.error('[xgestao-teste] início automático falhou:', err);
    return false;
  }
}

/** Registra que o assinante viu o fim do teste e escolheu seguir em somente leitura. */
export async function confirmarContinuarFree(userId: string): Promise<boolean> {
  const [ultimoTeste] = await db
    .select({ id: assinaturas.id })
    .from(assinaturas)
    .where(and(
      eq(assinaturas.userId, userId),
      eq(assinaturas.persona, 'xgestao'),
      eq(assinaturas.gatewayProvider, TESTE_PROVIDER),
      eq(assinaturas.status, 'expirada'),
    ))
    .orderBy(desc(assinaturas.createdAt))
    .limit(1);
  if (!ultimoTeste) return false;
  await db.insert(assinaturaEventos).values({
    assinaturaId: ultimoTeste.id,
    tipo: 'teste_aviso_confirmado',
    payloadJson: {},
  });
  return true;
}

/** Fim do teste ativo por usuário, para o admin (XG36). */
export async function fimTestePorUsuario(userIds: string[]): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  if (userIds.length === 0) return mapa;
  const linhas = await db
    .select({ userId: assinaturas.userId, renovaEm: assinaturas.renovaEm })
    .from(assinaturas)
    .where(and(
      inArray(assinaturas.userId, userIds),
      eq(assinaturas.persona, 'xgestao'),
      eq(assinaturas.gatewayProvider, TESTE_PROVIDER),
      eq(assinaturas.status, 'ativa'),
      gte(assinaturas.renovaEm, new Date(Date.now() - TOLERANCIA_FIM_TESTE_MS)),
    ));
  for (const l of linhas) if (l.renovaEm) mapa.set(l.userId, l.renovaEm.toISOString());
  return mapa;
}
