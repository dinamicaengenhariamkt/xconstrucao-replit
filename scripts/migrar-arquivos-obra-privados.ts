/**
 * EMP-02 — move para chave privada os arquivos de obra do xgestão que foram
 * gravados como públicos (anexos, contratos da equipe, fotos de galeria, de
 * diário e de ocorrência, capa e comprovantes).
 *
 * Para cada arquivo: copia o objeto de `.../public/...` para `.../private/...`
 * no R2, atualiza `user_files` (visibility, bucket_key, public_url = NULL) e só
 * então apaga o objeto público. Idempotente: arquivo já privado não entra na
 * seleção; se a cópia já existe (execução interrompida), a cópia é refeita por
 * cima e o resto segue.
 *
 * `medicoes.fotos` guarda URL pública permanente. Nas medições de obra do
 * xgestão, cada URL que aponta para um arquivo migrado é trocada pela
 * referência `xg-file:<id>`, que a leitura resolve para URL assinada
 * (`resolverFotosMedicao`). Sem isso a foto da atualização sumiria.
 *
 * Só obras do xgestão (sem contratante e com empreiteira). O marketplace não é
 * tocado.
 *
 *   npx tsx scripts/migrar-arquivos-obra-privados.ts --dry-run
 *   npx tsx scripts/migrar-arquivos-obra-privados.ts            (executa)
 */
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { sql } from "drizzle-orm";
import { db, pool } from "../shared/db/db";
import { getR2Client } from "../shared/lib/storage/r2";

const DRY_RUN = process.argv.includes("--dry-run");

interface Linha {
  id: string;
  kind: string;
  bucket_key: string;
  size_bytes: number;
  public_url: string | null;
}

const OBRAS_XG = sql`SELECT id FROM obras WHERE cliente_id IS NULL AND empreiteira_id IS NOT NULL`;

/**
 * A entrada de `medicoes.fotos` aponta para este arquivo? Termina em
 * `/<bucket_key>`. REV-14: sem `LIKE`, porque `_` e `%` da chave (nomes de
 * arquivo com sublinhado são comuns) virariam curinga e casariam outro arquivo.
 */
function casaFoto(l: Linha) {
  const sufixo = `/${l.bucket_key}`;
  return sql`(f = ${l.public_url ?? ""} OR right(f, ${sufixo.length}) = ${sufixo})`;
}

async function contarMedicoes(l: Linha): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(*)::int AS total FROM medicoes m
    WHERE m.obra_id IN (${OBRAS_XG})
      AND EXISTS (SELECT 1 FROM unnest(m.fotos) AS f WHERE ${casaFoto(l)})
  `);
  return Number((result as unknown as { rows: Array<{ total: number }> }).rows[0]?.total ?? 0);
}

async function reescreverMedicoes(l: Linha): Promise<void> {
  await db.execute(sql`
    UPDATE medicoes m
    SET fotos = ARRAY(
      SELECT CASE WHEN ${casaFoto(l)} THEN ${"xg-file:" + l.id} ELSE f END
      FROM unnest(m.fotos) WITH ORDINALITY AS t(f, ord)
      ORDER BY ord
    )
    WHERE m.obra_id IN (${OBRAS_XG})
      AND EXISTS (SELECT 1 FROM unnest(m.fotos) AS f WHERE ${casaFoto(l)})
  `);
}

/** Troca o primeiro segmento `public` por `private`, respeitando o prefixo dev/prod. */
export function chavePrivada(key: string): string | null {
  const partes = key.split("/");
  const idx = partes.indexOf("public");
  if (idx < 0 || idx > 1) return null;
  partes[idx] = "private";
  return partes.join("/");
}

async function selecionar(): Promise<Linha[]> {
  const result = await db.execute(sql`
    WITH obras_xg AS (
      SELECT id FROM obras WHERE cliente_id IS NULL AND empreiteira_id IS NOT NULL
    ),
    ids AS (
      SELECT file_id::text AS id FROM obra_fotos WHERE obra_id IN (SELECT id FROM obras_xg)
      UNION SELECT file_id::text FROM obra_anexos WHERE file_id IS NOT NULL AND obra_id IN (SELECT id FROM obras_xg)
      UNION SELECT foto_capa_file_id::text FROM obras WHERE foto_capa_file_id IS NOT NULL AND id IN (SELECT id FROM obras_xg)
      UNION SELECT unnest(foto_file_ids)::text FROM obra_diario WHERE obra_id IN (SELECT id FROM obras_xg)
      UNION SELECT foto_file_id::text FROM obra_ocorrencias WHERE foto_file_id IS NOT NULL AND obra_id IN (SELECT id FROM obras_xg)
      UNION SELECT contrato_file_id::text FROM obra_equipe WHERE contrato_file_id IS NOT NULL AND obra_id IN (SELECT id FROM obras_xg)
      UNION SELECT comprovante_file_id::text FROM financeiro WHERE comprovante_file_id IS NOT NULL AND obra_id IN (SELECT id FROM obras_xg)
    )
    SELECT uf.id, uf.kind, uf.bucket_key, uf.size_bytes, uf.public_url
    FROM user_files uf
    WHERE uf.deleted_at IS NULL
      AND uf.visibility = 'public'
      AND uf.id::text IN (SELECT id FROM ids)
    ORDER BY uf.created_at
  `);
  return (result as unknown as { rows: Linha[] }).rows;
}

async function main() {
  const linhas = await selecionar();
  const porKind = new Map<string, { qtd: number; bytes: number }>();
  for (const l of linhas) {
    const atual = porKind.get(l.kind) ?? { qtd: 0, bytes: 0 };
    atual.qtd += 1;
    atual.bytes += Number(l.size_bytes ?? 0);
    porKind.set(l.kind, atual);
  }
  const semChave = linhas.filter((l) => !chavePrivada(l.bucket_key));

  console.log(`[migrar-arquivos-obra-privados] ${DRY_RUN ? "DRY-RUN" : "EXECUÇÃO"}`);
  console.log(`arquivos públicos de obra xgestão: ${linhas.length}`);
  for (const [kind, v] of porKind) {
    console.log(`  ${kind}: ${v.qtd} arquivo(s), ${(v.bytes / 1_000_000).toFixed(2)} MB`);
  }
  if (semChave.length) console.log(`  sem segmento public/ reconhecível (ignorados): ${semChave.length}`);
  let fotosMedicao = 0;
  let medicoesTocadas = 0;
  for (const l of linhas) {
    if (!chavePrivada(l.bucket_key)) continue;
    const n = await contarMedicoes(l);
    if (n > 0) {
      fotosMedicao += 1;
      medicoesTocadas += n;
    }
  }
  console.log(`fotos de medição a reescrever para xg-file: ${fotosMedicao} arquivo(s) em ${medicoesTocadas} vínculo(s) de medição`);

  if (DRY_RUN || linhas.length === 0) {
    await pool.end();
    return;
  }

  const { client, config } = getR2Client();
  let ok = 0;
  let falhas = 0;
  for (const l of linhas) {
    const destino = chavePrivada(l.bucket_key);
    if (!destino) continue;
    try {
      await client.send(new CopyObjectCommand({
        Bucket: config.bucket,
        CopySource: `${config.bucket}/${l.bucket_key.split("/").map(encodeURIComponent).join("/")}`,
        Key: destino,
      }));
      await db.execute(sql`
        UPDATE user_files
        SET visibility = 'private', bucket_key = ${destino}, public_url = NULL
        WHERE id = ${l.id} AND visibility = 'public'
      `);
      await reescreverMedicoes(l);
      await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: l.bucket_key })).catch((err) => {
        console.warn(`  aviso: objeto público não apagado (${l.id}):`, err instanceof Error ? err.message : err);
      });
      ok += 1;
    } catch (err) {
      falhas += 1;
      console.error(`  falha em ${l.id}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`migrados: ${ok}; falhas: ${falhas}`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => null);
  process.exit(1);
});
