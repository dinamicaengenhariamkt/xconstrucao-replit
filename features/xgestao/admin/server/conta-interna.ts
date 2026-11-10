import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { auditLogs, users } from '@shared/db/schema';
import { listarAssinantesXgestao } from './escopo';

export const ACAO_AUDIT_CONTA_INTERNA = 'admin.xgestao.conta_interna';

/**
 * ADM-02 — marca ou desmarca a conta interna/teste de um responsável xgestão.
 *
 * Só vale para o titular (membro de equipe e conta de marketplace dão
 * `null`, e a rota responde 404 sem distinguir). A mudança e o registro em
 * `audit_logs` vão na mesma transação: não existe marcação sem rastro.
 */
export async function definirContaInterna(args: {
  userId: string;
  contaInterna: boolean;
  actorId: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<{ contaInterna: boolean; alterou: boolean } | null> {
  const [assinante] = await listarAssinantesXgestao({ userIds: [args.userId], internas: 'incluir' });
  if (!assinante) return null;
  if (assinante.contaInterna === args.contaInterna) return { contaInterna: args.contaInterna, alterou: false };

  await db.transaction(async (tx) => {
    await tx.update(users).set({ contaInterna: args.contaInterna }).where(eq(users.id, args.userId));
    await tx.insert(auditLogs).values({
      actorId: args.actorId,
      action: ACAO_AUDIT_CONTA_INTERNA,
      targetUserId: args.userId,
      payload: { de: assinante.contaInterna, para: args.contaInterna },
      ip: args.ip,
      userAgent: args.userAgent,
    });
  });
  return { contaInterna: args.contaInterna, alterou: true };
}
