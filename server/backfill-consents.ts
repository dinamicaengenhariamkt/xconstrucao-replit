import { db } from "./db";
import { users, userConsents } from "@shared/db/schema";
import { sql } from "drizzle-orm";

/**
 * Backfill idempotente de user_consents para contas antigas/seed
 * que não tinham linhas em user_consents (causa do "Pendente" eterno).
 * Usa versão "1.0" e marca como aceito agora. Não toca em consents existentes.
 */
export async function backfillConsents() {
  try {
    await db.execute(sql`
      INSERT INTO user_consents (user_id, documento, versao, aceito_em)
      SELECT u.id, 'termos'::consent_document, '1.0', NOW()
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM user_consents c
        WHERE c.user_id = u.id AND c.documento = 'termos'
      );
    `);
    await db.execute(sql`
      INSERT INTO user_consents (user_id, documento, versao, aceito_em)
      SELECT u.id, 'privacidade'::consent_document, '1.0', NOW()
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM user_consents c
        WHERE c.user_id = u.id AND c.documento = 'privacidade'
      );
    `);
  } catch (err) {
    console.error("[backfillConsents] failed:", err);
  }
}
