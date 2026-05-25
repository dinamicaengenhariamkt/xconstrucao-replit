import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da J06 — Medições & Diário de Obra (Task #72).
 * Cria 4 enums + 4 tabelas + índices. Re-rodável.
 */
export async function bootstrapMedicoesExtrasSchema(): Promise<void> {
  try {
    await db.execute(sql.raw(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='obra_etapa_status') THEN
          CREATE TYPE obra_etapa_status AS ENUM ('pendente','em_andamento','bloqueado','concluido');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='obra_ocorrencia_gravidade') THEN
          CREATE TYPE obra_ocorrencia_gravidade AS ENUM ('critico','medio','baixo');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='obra_ocorrencia_status') THEN
          CREATE TYPE obra_ocorrencia_status AS ENUM ('aberta','resolvida');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='obra_foto_fase') THEN
          CREATE TYPE obra_foto_fase AS ENUM ('antes','durante','agora');
        END IF;
      END$$;
    `));

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS obra_etapas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        descricao TEXT,
        ordem INTEGER NOT NULL DEFAULT 0,
        progresso INTEGER NOT NULL DEFAULT 0,
        status obra_etapa_status NOT NULL DEFAULT 'pendente',
        responsavel TEXT,
        prazo TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_obra_etapas_obra_id ON obra_etapas(obra_id, ordem)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS obra_diario (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        autor_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        texto TEXT NOT NULL,
        foto_file_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_obra_diario_obra_id ON obra_diario(obra_id, created_at DESC)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS obra_ocorrencias (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        autor_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        gravidade obra_ocorrencia_gravidade NOT NULL DEFAULT 'medio',
        status obra_ocorrencia_status NOT NULL DEFAULT 'aberta',
        foto_file_id VARCHAR REFERENCES user_files(id) ON DELETE SET NULL,
        resolvido_por_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        resolvido_em TIMESTAMP,
        notificacao_disparada BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_obra_ocorrencias_obra_id ON obra_ocorrencias(obra_id, created_at DESC)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS obra_fotos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        autor_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_id VARCHAR NOT NULL REFERENCES user_files(id) ON DELETE CASCADE,
        fase obra_foto_fase,
        tag TEXT,
        enviada_ao_contratante BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_obra_fotos_obra_id ON obra_fotos(obra_id, created_at DESC)`);

    console.info("[bootstrap-medicoes-extras] schema ready");
  } catch (err) {
    console.error("[bootstrap-medicoes-extras] failed:", err);
  }
}
