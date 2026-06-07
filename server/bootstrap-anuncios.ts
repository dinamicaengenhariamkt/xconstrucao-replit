import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da Jornada 12 — Gestão de Anúncios.
 * - Enums: anuncio_status, anuncio_evento_tipo, anunciante_status.
 * - Tabelas: anunciantes, anuncios, anuncio_eventos.
 * - Índices para o hot path GET /api/anuncios (zona+status) e tracking.
 */
export async function bootstrapAnunciosSchema(): Promise<void> {
  try {
    await db.execute(sql`DO $$ BEGIN CREATE TYPE anuncio_status AS ENUM ('rascunho','agendada','ativa','pausada','expirada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await db.execute(sql`DO $$ BEGIN CREATE TYPE anuncio_evento_tipo AS ENUM ('impressao','clique'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await db.execute(sql`DO $$ BEGIN CREATE TYPE anunciante_status AS ENUM ('ativo','inativo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS anunciantes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        sigla VARCHAR(8),
        contato TEXT,
        email TEXT,
        telefone TEXT,
        cnpj TEXT,
        status anunciante_status NOT NULL DEFAULT 'ativo',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS anuncios (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        anunciante_id VARCHAR NOT NULL REFERENCES anunciantes(id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        subtitulo TEXT,
        criativo_url TEXT,
        cta_url TEXT,
        cta_texto TEXT,
        zona TEXT NOT NULL,
        inicio TEXT,
        fim TEXT,
        orcamento NUMERIC(15,2) NOT NULL DEFAULT 0,
        status anuncio_status NOT NULL DEFAULT 'rascunho',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS anuncio_eventos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        anuncio_id VARCHAR NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
        tipo anuncio_evento_tipo NOT NULL,
        user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // J24 — Anúncios ricos: template selecionável + conteúdo estruturado por template.
    // `ADD COLUMN ... NOT NULL DEFAULT` faz backfill → todo anúncio existente vira 'imagem-card'.
    await db.execute(sql`ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS template TEXT NOT NULL DEFAULT 'imagem-card'`);
    await db.execute(sql`ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS conteudo JSONB`);

    // J24 — Master toggle por seção/zona (Opção B): interruptor explícito,
    // independente de haver campanha ativa. `chave` única para upsert.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS anuncio_config (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        chave TEXT NOT NULL UNIQUE,
        visivel BOOLEAN NOT NULL DEFAULT true,
        atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_anuncios_zona_status ON anuncios(zona, status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_anuncios_anunciante ON anuncios(anunciante_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_anuncio_eventos_anuncio_tipo ON anuncio_eventos(anuncio_id, tipo)`);
  } catch (err) {
    console.error("[bootstrap-anuncios] falha:", err);
    return;
  }

  console.info("[bootstrap-anuncios] schema ready (anunciantes + anuncios[+template,conteudo] + anuncio_eventos + anuncio_config)");
}
