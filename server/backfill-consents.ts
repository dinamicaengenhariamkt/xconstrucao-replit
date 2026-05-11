import { db } from "./db";
import { users, userConsents } from "@shared/db/schema";
import { sql } from "drizzle-orm";

/**
 * Backfill idempotente de user_consents para contas antigas/seed
 * que não tinham linhas em user_consents (causa do "Pendente" eterno).
 * Usa versão "1.0" e marca como aceito na data de criação do usuário
 * (created_at) para preservar histórico. Não toca em consents existentes.
 *
 * Retorna o nº total de linhas inseridas para servir como sinal de saúde
 * no boot — diferente de catch silencioso, falhas devem ser visíveis.
 */
export async function backfillConsents(): Promise<{ ok: boolean; inserted: number; error?: string }> {
  let inserted = 0;
  try {
    const r1 = await db.execute(sql`
      INSERT INTO user_consents (user_id, documento, versao, aceito_em)
      SELECT u.id, 'termos'::consent_document, '1.0', COALESCE(u.created_at, NOW())
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM user_consents c
        WHERE c.user_id = u.id AND c.documento = 'termos'
      )
      ON CONFLICT (user_id, documento, versao) DO NOTHING;
    `);
    const r2 = await db.execute(sql`
      INSERT INTO user_consents (user_id, documento, versao, aceito_em)
      SELECT u.id, 'privacidade'::consent_document, '1.0', COALESCE(u.created_at, NOW())
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM user_consents c
        WHERE c.user_id = u.id AND c.documento = 'privacidade'
      )
      ON CONFLICT (user_id, documento, versao) DO NOTHING;
    `);
    inserted = (r1.rowCount ?? 0) + (r2.rowCount ?? 0);
    console.info(`[backfillConsents] ok — inserted ${inserted} consent row(s)`);
    return { ok: true, inserted };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[backfillConsents] FAILED — legacy users will stay 'Pendente':", message);
    return { ok: false, inserted, error: message };
  }
}
