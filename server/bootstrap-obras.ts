import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente do schema de Obras (J03.A — Task #32).
 * Cria 4 enums novos, estende a tabela `obras` com 13 colunas novas,
 * cria a tabela `obra_anexos` + índices, e faz backfill de `visibilidade`
 * para linhas pré-existentes.
 *
 * Mesmo padrão de bootstrap-storage / bootstrap-superadmin: roda em toda
 * inicialização (idempotente, seguro re-rodar).
 */
export async function bootstrapObrasSchema(): Promise<void> {
  const enums: Array<{ name: string; values: string[] }> = [
    { name: "obra_visibilidade", values: ["rascunho", "publicada", "pausada", "arquivada"] },
    { name: "obra_modalidade", values: ["administracao", "empreitada_global", "empreitada_etapa"] },
    { name: "obra_materiais_por", values: ["contratante", "empreiteiro", "misto"] },
    {
      name: "obra_anexo_tipo",
      values: [
        "projeto_arquitetonico",
        "projeto_estrutural",
        "art_rrt",
        "alvara",
        "foto_local",
        "contrato",
        "outros",
      ],
    },
  ];

  for (const e of enums) {
    try {
      const valuesSql = e.values.map((v) => `'${v}'`).join(", ");
      await db.execute(
        sql.raw(`DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${e.name}') THEN
    CREATE TYPE ${e.name} AS ENUM (${valuesSql});
  END IF;
END$$;`),
      );
    } catch (err) {
      console.error(`[bootstrap-obras] enum ${e.name}:`, err);
    }
  }

  const obrasColumns: Array<{ name: string; ddl: string }> = [
    { name: "visibilidade", ddl: "visibilidade obra_visibilidade NOT NULL DEFAULT 'rascunho'" },
    { name: "tipo", ddl: "tipo TEXT" },
    { name: "descricao", ddl: "descricao TEXT" },
    { name: "cep", ddl: "cep TEXT" },
    { name: "cidade", ddl: "cidade TEXT" },
    { name: "uf", ddl: "uf VARCHAR(2)" },
    { name: "lat", ddl: "lat NUMERIC(10,7)" },
    { name: "lng", ddl: "lng NUMERIC(10,7)" },
    { name: "modalidade", ddl: "modalidade obra_modalidade" },
    { name: "materiais_por", ddl: "materiais_por obra_materiais_por" },
    { name: "area_m2", ddl: "area_m2 NUMERIC(10,2)" },
    { name: "padrao_acabamento", ddl: "padrao_acabamento TEXT" },
    { name: "acessibilidade_obs", ddl: "acessibilidade_obs TEXT" },
    { name: "created_at", ddl: "created_at TIMESTAMP DEFAULT NOW()" },
    { name: "updated_at", ddl: "updated_at TIMESTAMP DEFAULT NOW()" },
  ];

  for (const col of obrasColumns) {
    try {
      await db.execute(sql.raw(`ALTER TABLE obras ADD COLUMN IF NOT EXISTS ${col.ddl};`));
    } catch (err) {
      console.error(`[bootstrap-obras] add column obras.${col.name}:`, err);
    }
  }

  // Marcador idempotente: o backfill abaixo deve rodar **uma única vez** (semântica de
  // migration). Usamos uma mini-tabela schema_migrations pra gravar que já aplicamos —
  // garante que linhas futuras que casem com o predicate (ex: contratante salva rascunho
  // e depois muda status manualmente) não sejam sobrescritas pra 'publicada' silenciosamente.
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[bootstrap-obras] schema_migrations:", err);
  }

  try {
    const marker = "obras_backfill_visibilidade_v1";
    const res: any = await db.execute(sql`SELECT 1 AS ok FROM schema_migrations WHERE name = ${marker}`);
    const already = Array.isArray(res?.rows) ? res.rows.length > 0 : Array.isArray(res) ? res.length > 0 : false;
    if (!already) {
      await db.execute(sql`
        UPDATE obras
           SET visibilidade = 'publicada'
         WHERE visibilidade = 'rascunho'
           AND (empreiteira_id IS NOT NULL OR status <> 'planejamento')
      `);
      await db.execute(sql`INSERT INTO schema_migrations(name) VALUES(${marker}) ON CONFLICT (name) DO NOTHING`);
      console.info("[bootstrap-obras] backfill visibilidade aplicado (one-shot)");
    }
  } catch (err) {
    console.error("[bootstrap-obras] backfill visibilidade:", err);
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS obra_anexos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        file_id VARCHAR NOT NULL,
        tipo obra_anexo_tipo NOT NULL,
        observacao TEXT,
        created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[bootstrap-obras] create obra_anexos:", err);
  }

  // FK obra_anexos.file_id -> user_files(id) (criada à parte para não falhar caso
  // user_files ainda não exista no momento desta chamada; bootstrap-storage roda antes).
  try {
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_files')
           AND NOT EXISTS (
             SELECT 1 FROM information_schema.table_constraints
              WHERE table_name = 'obra_anexos' AND constraint_name = 'obra_anexos_file_id_fkey'
           ) THEN
          ALTER TABLE obra_anexos
            ADD CONSTRAINT obra_anexos_file_id_fkey
            FOREIGN KEY (file_id) REFERENCES user_files(id) ON DELETE CASCADE;
        END IF;
      END$$;
    `);
  } catch (err) {
    console.error("[bootstrap-obras] add fk obra_anexos.file_id:", err);
  }

  const indexes: Array<{ name: string; ddl: string }> = [
    {
      name: "idx_obras_visibilidade_uf_cidade",
      ddl: "CREATE INDEX IF NOT EXISTS idx_obras_visibilidade_uf_cidade ON obras(visibilidade, uf, cidade)",
    },
    {
      name: "idx_obras_cliente_id",
      ddl: "CREATE INDEX IF NOT EXISTS idx_obras_cliente_id ON obras(cliente_id)",
    },
    {
      name: "idx_obras_empreiteira_id",
      ddl: "CREATE INDEX IF NOT EXISTS idx_obras_empreiteira_id ON obras(empreiteira_id)",
    },
    {
      name: "idx_obra_anexos_obra_id_tipo",
      ddl: "CREATE INDEX IF NOT EXISTS idx_obra_anexos_obra_id_tipo ON obra_anexos(obra_id, tipo)",
    },
  ];

  for (const idx of indexes) {
    try {
      await db.execute(sql.raw(idx.ddl));
    } catch (err) {
      console.error(`[bootstrap-obras] index ${idx.name}:`, err);
    }
  }

  console.info("[bootstrap-obras] schema ready (obras estendida + obra_anexos)");
}
