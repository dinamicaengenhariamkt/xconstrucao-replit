import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da J11/Tarefas — operação da obra (Task #76).
 * 4 tabelas: obra_tarefas, obra_checklists, obra_checklist_itens, obra_equipe.
 */
export async function bootstrapObraOperacaoSchema(): Promise<void> {
  try {
    await db.execute(sql.raw(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='obra_tarefa_status') THEN
          CREATE TYPE obra_tarefa_status AS ENUM ('pendente','em_andamento','bloqueado','concluido');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='obra_tarefa_prioridade') THEN
          CREATE TYPE obra_tarefa_prioridade AS ENUM ('alta','media','baixa');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='obra_checklist_tipo') THEN
          CREATE TYPE obra_checklist_tipo AS ENUM ('seguranca','diario','etapa');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='obra_checklist_status') THEN
          CREATE TYPE obra_checklist_status AS ENUM ('pendente','em_andamento','completo');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='obra_equipe_tipo') THEN
          CREATE TYPE obra_equipe_tipo AS ENUM ('contratante','engenheiro','mestre','equipe');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='obra_equipe_permissao') THEN
          CREATE TYPE obra_equipe_permissao AS ENUM ('visualizar','editar','admin');
        END IF;
      END$$;
    `));

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS obra_tarefas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        etapa_id VARCHAR REFERENCES obra_etapas(id) ON DELETE SET NULL,
        etapa TEXT NOT NULL DEFAULT '',
        titulo TEXT NOT NULL,
        descricao TEXT,
        responsavel TEXT NOT NULL DEFAULT '',
        prazo TEXT NOT NULL DEFAULT '',
        status obra_tarefa_status NOT NULL DEFAULT 'pendente',
        prioridade obra_tarefa_prioridade NOT NULL DEFAULT 'media',
        progresso INTEGER,
        bloqueio_motivo TEXT,
        bloqueio_info TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_obra_tarefas_obra_id ON obra_tarefas(obra_id, created_at)`);
    await db.execute(sql`ALTER TABLE medicoes ADD COLUMN IF NOT EXISTS tarefa_id VARCHAR REFERENCES obra_tarefas(id) ON DELETE SET NULL`);
    await db.execute(sql`ALTER TABLE medicoes ADD COLUMN IF NOT EXISTS tarefa_progresso INTEGER`);
    // Recupera fotos de atualizações próprias gravadas antes da correção que
    // passou a marcá-las como compartilháveis no momento do vínculo.
    await db.execute(sql`
      UPDATE obra_fotos AS of
      SET enviada_ao_contratante = TRUE
      FROM user_files AS uf
      WHERE of.file_id = uf.id
        AND of.enviada_ao_contratante = FALSE
        AND EXISTS (
          SELECT 1
          FROM obras o
          JOIN medicoes m ON m.obra_id = o.id AND m.status = 'aprovada'
          WHERE o.id = of.obra_id
            AND o.cliente_id IS NULL
            AND EXISTS (
              SELECT 1
              FROM unnest(m.fotos) AS foto_url
              WHERE foto_url = uf.public_url
                 OR foto_url LIKE ('%/' || uf.bucket_key)
            )
        )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS obra_checklists (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        descricao TEXT NOT NULL DEFAULT '',
        tipo obra_checklist_tipo NOT NULL DEFAULT 'seguranca',
        status obra_checklist_status NOT NULL DEFAULT 'pendente',
        completado_em TEXT,
        assinado_por TEXT,
        assinado_em TEXT,
        registro_profissional TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_obra_checklists_obra_id ON obra_checklists(obra_id, created_at)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS obra_checklist_itens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        checklist_id VARCHAR NOT NULL REFERENCES obra_checklists(id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        concluida BOOLEAN NOT NULL DEFAULT FALSE,
        ordem INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_obra_checklist_itens_checklist_id ON obra_checklist_itens(checklist_id, ordem)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS obra_equipe (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        nome TEXT NOT NULL,
        papel TEXT NOT NULL DEFAULT '',
        tipo obra_equipe_tipo NOT NULL DEFAULT 'equipe',
        cor TEXT NOT NULL DEFAULT 'bg-primary',
        telefone TEXT,
        email TEXT,
        registro TEXT,
        membros TEXT,
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        permissao obra_equipe_permissao,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_obra_equipe_obra_id ON obra_equipe(obra_id, created_at)`);

    console.info("[bootstrap-obra-operacao] schema ready");
  } catch (err) {
    console.error("[bootstrap-obra-operacao] failed:", err);
    throw err;
  }
}
