import { and, desc, eq, gte, inArray, lt, ne, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturaEventos, assinaturas, planos } from '@shared/db/schema';
import { getConfigTesteXgestao } from '@features/admin/platform-settings/server/settings-reader';

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
 * e no boot. Não depende de cron, que não existe no deploy atual.
 *
 * Eventos em `assinatura_eventos`: `teste_iniciado`, `teste_expirado` e
 * `teste_aviso_confirmado` (o assinante escolheu continuar no Free).
 */
export const TESTE_PROVIDER = 'trial';

/**
 * Condição "assinatura vigente" que ignora teste já vencido, mesmo antes de o
 * vencimento preguiçoso gravar `expirada`. Usada onde o tier é resolvido.
 * Sem `server-only` neste arquivo de propósito: `assinatura-service` o importa e
 * roda também nos testes com `tsx`, fora do Next.
 */
export function naoEhTesteVencido(): SQL {
  return or(ne(assinaturas.gatewayProvider, TESTE_PROVIDER), gte(assinaturas.renovaEm, new Date())) as SQL;
}

export type EstadoTeste = {
  /** Nunca teve teste e não tem plano pago ativo: pode iniciar. */
  elegivel: boolean;
  emTeste: boolean;
  /** ISO do fim do teste ativo, ou do último teste vencido. */
  fimTeste: string | null;
  diasRestantes: number | null;
  /** Teste venceu e o assinante ainda não respondeu ao aviso. */
  avisoFimPendente: boolean;
  duracaoDias: number;
  tierTeste: 'pro' | 'enterprise';
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
      lt(assinaturas.renovaEm, new Date()),
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

  return {
    elegivel: !ativa && !ultimoTeste,
    emTeste,
    fimTeste: fim ? fim.toISOString() : null,
    diasRestantes: emTeste && fim ? Math.max(0, Math.ceil((fim.getTime() - Date.now()) / 86_400_000)) : null,
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

/** Registra que o assinante viu o fim do teste e escolheu continuar no Free. */
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
      gte(assinaturas.renovaEm, new Date()),
    ));
  for (const l of linhas) if (l.renovaEm) mapa.set(l.userId, l.renovaEm.toISOString());
  return mapa;
}
