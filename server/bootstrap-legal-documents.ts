import { readFileSync } from "fs";
import { join } from "path";
import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da Jornada 28 — Documentos Legais Versionados.
 *
 * Cria a tabela `legal_documents` e faz o SEED da versão 1 de Termos e Privacidade
 * a partir do texto MIGRADO das páginas hardcoded (server/legal-seed/*.md). O seed é
 * idempotente: só insere a v1 se ainda não existir nenhuma versão daquele tipo —
 * nunca sobrescreve uma versão publicada pelo jurídico depois.
 *
 * O CONTEÚDO é dado (jurídico publica novas versões pelo painel admin), não código.
 */
function lerSeed(arquivo: string): string {
  try {
    return readFileSync(join(process.cwd(), "server", "legal-seed", arquivo), "utf8");
  } catch (err) {
    console.error(`[bootstrap-legal-documents] falha ao ler seed ${arquivo}:`, err);
    return "";
  }
}

export async function bootstrapLegalDocumentsSchema(): Promise<void> {
  try {
    // O enum consent_document ('termos','privacidade') já existe (user_consents).
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS legal_documents (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tipo consent_document NOT NULL,
        versao INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        vigente_em TIMESTAMP NOT NULL DEFAULT NOW(),
        ativo BOOLEAN NOT NULL DEFAULT true,
        criado_por VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS legal_documents_tipo_versao_uniq ON legal_documents(tipo, versao)`,
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_legal_documents_tipo_ativo ON legal_documents(tipo, ativo)`,
    );

    // Seed v1 — só se o tipo ainda não tem nenhuma versão (não sobrescreve o jurídico).
    const termos = lerSeed("termos-v1.md");
    const privacidade = lerSeed("privacidade-v1.md");
    const termoAnunciante = lerSeed("termo-anunciante-v1.md"); // J59

    if (termos) {
      await db.execute(sql`
        INSERT INTO legal_documents (tipo, versao, titulo, conteudo)
        SELECT 'termos', 1, 'Termos de Uso', ${termos}
        WHERE NOT EXISTS (SELECT 1 FROM legal_documents WHERE tipo = 'termos')
      `);
    }
    if (privacidade) {
      await db.execute(sql`
        INSERT INTO legal_documents (tipo, versao, titulo, conteudo)
        SELECT 'privacidade', 1, 'Política de Privacidade', ${privacidade}
        WHERE NOT EXISTS (SELECT 1 FROM legal_documents WHERE tipo = 'privacidade')
      `);
      // J55 — o .md é a fonte de verdade do seed da v1. Sincroniza o conteúdo da v1
      // com o arquivo (esclarecimento sobre processador de pagamentos), sem bump de
      // versão. Só toca a v1 seedada; versões publicadas (>1) são imutáveis e intactas.
      await db.execute(sql`
        UPDATE legal_documents SET conteudo = ${privacidade}
        WHERE tipo = 'privacidade' AND versao = 1 AND conteudo <> ${privacidade}
      `);
    }
    // J59 — termo do anunciante (gate de entrada para anunciar). Mesmo padrão:
    // seed idempotente da v1 + sync do conteúdo da v1 seedada com o .md (fonte de
    // verdade), sem bump de versão; versões publicadas (>1) permanecem imutáveis.
    if (termoAnunciante) {
      await db.execute(sql`
        INSERT INTO legal_documents (tipo, versao, titulo, conteudo)
        SELECT 'termo_anunciante', 1, 'Termo do Anunciante', ${termoAnunciante}
        WHERE NOT EXISTS (SELECT 1 FROM legal_documents WHERE tipo = 'termo_anunciante')
      `);
      await db.execute(sql`
        UPDATE legal_documents SET conteudo = ${termoAnunciante}
        WHERE tipo = 'termo_anunciante' AND versao = 1 AND conteudo <> ${termoAnunciante}
      `);
    }
  } catch (err) {
    console.error("[bootstrap-legal-documents] falha:", err);
    return;
  }

  console.info("[bootstrap-legal-documents] schema ready (legal_documents + seed v1 termos/privacidade/termo_anunciante)");
}
