import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * CRM-03/CRM-07 — bootstrap idempotente do CRM do admin xgestão:
 * - `assinaturas.motivo_cancelamento` e `motivo_cancelamento_texto` (motivo
 *   opcional informado ao cancelar);
 * - `xgestao_admin_contatos` (contatos do admin com o responsável).
 * `ADD COLUMN` sem default não reescreve a tabela. Espelha
 * `migrations/0014_xgestao_admin_crm.sql`.
 */
export async function bootstrapXgestaoAdminCrmSchema(): Promise<void> {
  await db.execute(sql`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT`);
  await db.execute(sql`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS motivo_cancelamento_texto TEXT`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS xgestao_admin_contatos (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      empreiteira_id VARCHAR REFERENCES empreiteiras(id) ON DELETE SET NULL,
      admin_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
      canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'email', 'telefone', 'outro')),
      nota TEXT CHECK (nota IS NULL OR char_length(nota) <= 1000),
      criado_em TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_xgestao_admin_contatos_user ON xgestao_admin_contatos (user_id, criado_em)`);
}
