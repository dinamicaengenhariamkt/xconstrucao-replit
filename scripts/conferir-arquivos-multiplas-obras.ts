/**
 * REV-13 — conferência (só leitura): arquivos ligados a mais de uma obra.
 *
 * A exclusão e a visibilidade de um arquivo são decididas pelas obras ligadas a
 * ele. Um arquivo em duas obras (ex.: uma do xgestão e outra do marketplace)
 * pode receber a regra errada. Este script só conta e lista; não altera nada.
 *
 * Uso: npx tsx scripts/conferir-arquivos-multiplas-obras.ts [--limite=20]
 */
import { sql } from "drizzle-orm";
import { db, pool } from "@shared/db/db";

const VINCULOS = sql`
  SELECT file_id, obra_id, 'obra_fotos' AS origem FROM obra_fotos WHERE file_id IS NOT NULL
  UNION ALL SELECT file_id, obra_id, 'obra_anexos' FROM obra_anexos WHERE file_id IS NOT NULL
  UNION ALL SELECT foto_capa_file_id, id, 'capa' FROM obras WHERE foto_capa_file_id IS NOT NULL
  UNION ALL SELECT unnest(foto_file_ids), obra_id, 'diario' FROM obra_diario WHERE foto_file_ids IS NOT NULL
  UNION ALL SELECT foto_file_id, obra_id, 'ocorrencias' FROM obra_ocorrencias WHERE foto_file_id IS NOT NULL
  UNION ALL SELECT contrato_file_id, obra_id, 'equipe' FROM obra_equipe WHERE contrato_file_id IS NOT NULL
  UNION ALL SELECT comprovante_file_id, obra_id, 'financeiro' FROM financeiro WHERE comprovante_file_id IS NOT NULL AND obra_id IS NOT NULL
`;

async function main() {
  const limiteArg = process.argv.find((a) => a.startsWith("--limite="));
  const limite = Math.max(1, Math.min(500, Number(limiteArg?.split("=")[1] ?? 20) || 20));

  const total = await db.execute<{ arquivos: number; mistos: number }>(sql`
    WITH v AS (${VINCULOS}),
    multi AS (
      SELECT v.file_id
        FROM v JOIN obras o ON o.id = v.obra_id
       GROUP BY v.file_id
      HAVING count(DISTINCT v.obra_id) > 1
    ),
    mistos AS (
      SELECT v.file_id
        FROM v JOIN obras o ON o.id = v.obra_id
       GROUP BY v.file_id
      HAVING count(DISTINCT v.obra_id) > 1
         AND bool_or(o.cliente_id IS NULL AND o.empreiteira_id IS NOT NULL)
         AND bool_or(o.cliente_id IS NOT NULL)
    )
    SELECT (SELECT count(*) FROM multi)::int AS arquivos, (SELECT count(*) FROM mistos)::int AS mistos
  `);
  const t = total.rows[0];
  console.log(`arquivos ligados a mais de uma obra: ${t.arquivos}`);
  console.log(`  dos quais em obra xgestão E obra do marketplace: ${t.mistos}`);

  if (t.arquivos > 0) {
    const amostra = await db.execute<{ file_id: string; obras: number; origens: string; visibility: string | null }>(sql`
      WITH v AS (${VINCULOS})
      SELECT v.file_id, count(DISTINCT v.obra_id)::int AS obras,
             string_agg(DISTINCT v.origem, ',') AS origens, max(uf.visibility) AS visibility
        FROM v LEFT JOIN user_files uf ON uf.id = v.file_id
       GROUP BY v.file_id
      HAVING count(DISTINCT v.obra_id) > 1
       ORDER BY 2 DESC
       LIMIT ${limite}
    `);
    console.table(amostra.rows);
  }
}

main()
  .catch((err) => {
    console.error("[conferir-arquivos-multiplas-obras] falhou:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
