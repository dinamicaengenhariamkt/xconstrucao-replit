import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da camada de uploads (R2).
 * Cria enum + tabelas user_files / empreiteiro_documentos se faltarem.
 * Mesmo padrão de bootstrap-superadmin: roda em toda inicialização.
 */
export async function bootstrapStorageSchema(): Promise<void> {
  try {
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_file_visibility') THEN
          CREATE TYPE user_file_visibility AS ENUM ('public', 'private');
        END IF;
      END$$;
    `);
  } catch (err) {
    console.error("[bootstrap-storage] enum user_file_visibility:", err);
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_files (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        visibility user_file_visibility NOT NULL,
        bucket_key TEXT NOT NULL UNIQUE,
        original_name TEXT NOT NULL,
        mime TEXT NOT NULL,
        size_bytes INTEGER NOT NULL DEFAULT 0,
        public_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_files_owner ON user_files(owner_user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_files_kind ON user_files(kind)`);
  } catch (err) {
    console.error("[bootstrap-storage] tabela user_files:", err);
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS empreiteiro_documentos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        empreiteiro_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_id VARCHAR NOT NULL REFERENCES user_files(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'enviado',
        observacao TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`ALTER TABLE empreiteiro_documentos ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'enviado'`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_emp_docs_user ON empreiteiro_documentos(empreiteiro_user_id)`);
  } catch (err) {
    console.error("[bootstrap-storage] tabela empreiteiro_documentos:", err);
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS empreiteiro_portfolio (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        empreiteiro_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_id VARCHAR NOT NULL REFERENCES user_files(id) ON DELETE CASCADE,
        titulo TEXT,
        descricao TEXT,
        ordem INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_emp_portfolio_user ON empreiteiro_portfolio(empreiteiro_user_id)`);
  } catch (err) {
    console.error("[bootstrap-storage] tabela empreiteiro_portfolio:", err);
  }

  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_file_id VARCHAR REFERENCES user_files(id) ON DELETE SET NULL`);
  } catch (err) {
    console.error("[bootstrap-storage] users.avatar_file_id:", err);
  }
}
