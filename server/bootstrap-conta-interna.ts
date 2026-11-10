import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * ADM-02 — bootstrap idempotente de `users.conta_interna`.
 *
 * Conta interna ou de teste (equipe, QA, demonstração) não entra nas métricas
 * nem nas listas do admin xgestão. `ADD COLUMN ... DEFAULT FALSE` não reescreve
 * a tabela (Postgres 11+), então roda no boot sem lock longo. Espelha
 * `migrations/0013_users_conta_interna.sql`.
 */
export async function bootstrapContaInternaSchema(): Promise<void> {
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS conta_interna BOOLEAN NOT NULL DEFAULT FALSE`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_conta_interna ON users (id) WHERE conta_interna = TRUE`);
}
