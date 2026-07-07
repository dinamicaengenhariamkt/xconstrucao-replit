// J22 — camada de persistência do 2FA (tabela user_totp).
// Mantém as queries isoladas do helper puro (totp.ts) e dos endpoints.
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { userTotp, type UserTotp } from "@shared/db/schema";

export async function getTotpByUser(userId: string): Promise<UserTotp | undefined> {
  const [row] = await db.select().from(userTotp).where(eq(userTotp.userId, userId));
  return row;
}

/** true se a conta tem 2FA confirmado e ativo (usado no caminho de login). */
export async function isTotpEnabled(userId: string): Promise<boolean> {
  const row = await getTotpByUser(userId);
  return Boolean(row?.enabled);
}

/**
 * Grava (ou regrava) um secret pendente de confirmação. Usa upsert por user_id:
 * reiniciar o setup sobrescreve um secret anterior ainda não confirmado.
 * NUNCA derruba um 2FA já ativo aqui — o caller garante esse invariante.
 */
export async function salvarSecretPendente(userId: string, secret: string): Promise<void> {
  await db
    .insert(userTotp)
    .values({ userId, secret, enabled: false, recoveryCodes: [], confirmadoEm: null })
    .onConflictDoUpdate({
      target: userTotp.userId,
      set: { secret, enabled: false, recoveryCodes: [], confirmadoEm: null, atualizadoEm: new Date() },
    });
}

/** Ativa o 2FA após a confirmação do primeiro código, gravando os hashes de recovery. */
export async function ativarTotp(userId: string, recoveryHashes: string[]): Promise<void> {
  await db
    .update(userTotp)
    .set({ enabled: true, recoveryCodes: recoveryHashes, confirmadoEm: new Date(), atualizadoEm: new Date() })
    .where(eq(userTotp.userId, userId));
}

/** Remove por completo a config de 2FA da conta (desativar). */
export async function removerTotp(userId: string): Promise<void> {
  await db.delete(userTotp).where(eq(userTotp.userId, userId));
}

/** Persiste a lista de recovery hashes após consumir um (uso único). */
export async function atualizarRecoveryCodes(userId: string, hashes: string[]): Promise<void> {
  await db
    .update(userTotp)
    .set({ recoveryCodes: hashes, atualizadoEm: new Date() })
    .where(eq(userTotp.userId, userId));
}
