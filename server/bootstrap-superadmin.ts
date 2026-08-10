import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

const SUPERADMIN_EMAIL = "admin@xconstrucao.com";

export async function bootstrapSuperAdmin(): Promise<void> {
  const enumCheck = await db.execute(sql`
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'superadmin'
    LIMIT 1
  `);
  const enumRows = (enumCheck as unknown as { rows: unknown[] }).rows ?? (enumCheck as unknown as unknown[]);
  const hasSuperadmin = Array.isArray(enumRows) ? enumRows.length > 0 : false;
  if (!hasSuperadmin) {
    try {
      await db.execute(sql`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin' BEFORE 'admin'`);
      console.info("[bootstrap-superadmin] enum value 'superadmin' added");
    } catch (err) {
      console.error("[bootstrap-superadmin] não foi possível adicionar enum 'superadmin':", err);
      return;
    }
  }

  await ensureColumn("users", "must_change_password", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE`);
  await ensureColumn("users", "created_by", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL`);
  await ensureColumn("users", "ativo", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE`);
  await ensureColumn("users", "can_manage_users", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN NOT NULL DEFAULT FALSE`);
  // XG06 — escopo do admin. DEFAULT 'global' é o que garante retrocompatibilidade:
  // toda linha existente passa a valer "global" sem nenhum UPDATE.
  await ensureColumn("users", "admin_escopo", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_escopo TEXT NOT NULL DEFAULT 'global'`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      target_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      ip TEXT,
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS password_setup_tokens (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  const promoted = await db.execute(sql`
    UPDATE users
       SET role = 'superadmin'::user_role
     WHERE email = ${SUPERADMIN_EMAIL}
       AND role <> 'superadmin'
     RETURNING id
  `);
  const promotedRows = (promoted as unknown as { rows: unknown[] }).rows ?? (promoted as unknown as unknown[]);
  if (Array.isArray(promotedRows) && promotedRows.length > 0) {
    console.info(`[bootstrap-superadmin] ${SUPERADMIN_EMAIL} promovido para superadmin`);
  }
}

async function ensureColumn(_table: string, _col: string, statement: ReturnType<typeof sql>) {
  try {
    await db.execute(statement);
  } catch (err) {
    console.error("[bootstrap-superadmin] ensureColumn falhou:", err);
  }
}
