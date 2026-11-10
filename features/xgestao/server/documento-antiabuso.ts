import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturaEventos, assinaturas, empreiteiras, users } from '@shared/db/schema';
import { documentoXgestaoValido } from '../lib/documento-fiscal';

type Leitor = Pick<typeof db, 'select' | 'insert' | 'update' | 'execute'>;

/**
 * XG50 — teste grátis e mês bônus valem uma vez por CPF/CNPJ, não só por conta.
 * Sem isso bastava criar outra conta com o mesmo documento para ganhar outro
 * teste de 90 dias e outro mês sem cobrança.
 *
 * O documento é comparado por três fontes: o gravado na assinatura
 * (`documento_fiscal`, fica mesmo se a outra conta trocar o cadastro), o CNPJ
 * da empresa e o CPF/CNPJ da conta. Sempre só dígitos.
 */
export async function documentoDoUsuario(userId: string, leitor: Leitor = db): Promise<string | undefined> {
  const [linha] = await leitor.select({ cnpj: empreiteiras.cnpj, cpfCnpj: users.cpfCnpj })
    .from(users).leftJoin(empreiteiras, eq(empreiteiras.userId, users.id))
    .where(eq(users.id, userId)).limit(1);
  return documentoXgestaoValido(linha?.cnpj, linha?.cpfCnpj);
}

export type UsoDoDocumento = 'teste' | 'bonus';

/**
 * Outra conta com o mesmo documento já teve teste (`teste`) ou já teve teste
 * ou recebeu o mês bônus (`bonus`). Contas internas também contam.
 */
export async function documentoUsadoEmOutraConta(
  documento: string,
  userId: string,
  uso: UsoDoDocumento,
  leitor: Leitor = db,
): Promise<boolean> {
  const condicaoUso = uso === 'teste'
    ? sql`a.gateway_provider = 'trial'`
    : sql`(a.gateway_provider = 'trial' OR a.fim_teste_em IS NOT NULL)`;
  const r = await leitor.execute<{ ok: number }>(sql`
    SELECT 1 AS ok
      FROM assinaturas a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN empreiteiras e ON e.user_id = a.user_id
     WHERE a.persona = 'xgestao'
       AND a.user_id <> ${userId}
       AND ${condicaoUso}
       AND (
         a.documento_fiscal = ${documento}
         OR regexp_replace(coalesce(e.cnpj, ''), '\\D', '', 'g') = ${documento}
         OR regexp_replace(coalesce(u.cpf_cnpj, ''), '\\D', '', 'g') = ${documento}
       )
     LIMIT 1
  `);
  return r.rows.length > 0;
}

/** Grava o documento na assinatura, se ainda não tem (idempotente). */
export async function gravarDocumentoNaAssinatura(assinaturaId: string, documento: string | undefined, leitor: Leitor = db) {
  if (!documento) return;
  await leitor.update(assinaturas).set({ documentoFiscal: documento })
    .where(and(eq(assinaturas.id, assinaturaId), isNull(assinaturas.documentoFiscal)));
}

/**
 * Registra uma tentativa bloqueada (`bonus_negado` ou `teste_negado`) na conta.
 * `unicaPorConta`: o início automático do teste roda a cada acesso; ali só o
 * primeiro bloqueio é registrado, para o contador do admin não inflar.
 */
export async function registrarTentativaNegada(args: {
  userId: string;
  tipo: 'bonus_negado' | 'teste_negado';
  assinaturaId?: string | null;
  motivo: string;
  unicaPorConta?: boolean;
}, leitor: Leitor = db) {
  if (args.unicaPorConta) {
    const [ja] = await leitor.select({ id: assinaturaEventos.id }).from(assinaturaEventos)
      .where(and(eq(assinaturaEventos.userId, args.userId), eq(assinaturaEventos.tipo, args.tipo), isNotNull(assinaturaEventos.userId)))
      .limit(1);
    if (ja) return;
  }
  // Sem o documento no payload: dado pessoal não vai para o histórico.
  await leitor.insert(assinaturaEventos).values({
    assinaturaId: args.assinaturaId ?? null,
    userId: args.userId,
    tipo: args.tipo,
    payloadJson: { motivo: args.motivo },
  });
}
