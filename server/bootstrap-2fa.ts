import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da tabela de 2FA/TOTP (J22).
 * - user_totp: uma linha por conta com 2FA configurado (UNIQUE user_id, FK CASCADE).
 *   `secret` é o segredo TOTP base32; `recovery_codes` guarda HASHES (uso único);
 *   `enabled` só vira true após o usuário confirmar o primeiro código.
 * Índice parcial pra resolver "este usuário tem 2FA ativo?" rápido no login.
 */
export async function bootstrap2faSchema(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_totp (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        secret TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT FALSE,
        recovery_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
        confirmado_em TIMESTAMP,
        criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT user_totp_user_unique UNIQUE (user_id)
      )
    `);

    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_user_totp_enabled ON user_totp(user_id) WHERE enabled = TRUE`,
    );

    console.info("[bootstrap-2fa] schema pronto (user_totp + índice)");
  } catch (err) {
    console.error("[bootstrap-2fa] falha:", err);
  }
}
