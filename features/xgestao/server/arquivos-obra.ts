import 'server-only';

import { inArray, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { obras, userFiles } from '@shared/db/schema';
import {
  createSignedReadUrl,
  deleteObject,
  kindPrivatizavel,
  publicUrlForKey,
  type UploadKind,
  type UploadVisibility,
} from '@shared/lib/storage';
import { logError } from '@/server/lib/logger';
import { verificarQuotaVinculo } from '@features/obras/api/storage-quota';
import { resolverEmpresaDoUsuario } from '@features/xgestao/equipe/server/access';

/**
 * Arquivos das obras do xgestão (EMP-02, EMP-03, EMP-04, EMP-07, EMP-12).
 *
 * Tudo aqui vale só para obra própria do empreiteiro (sem contratante e com
 * empreiteira, o mesmo recorte de `XGESTAO_OBRA`). O marketplace segue com os
 * arquivos públicos e o ciclo de vida que sempre teve.
 */

type Executor = Pick<typeof db, 'execute' | 'update'>;

export function ehObraXgestao(obra: { clienteId: string | null; empreiteiraId: string | null }): boolean {
  return obra.clienteId === null && obra.empreiteiraId !== null;
}

/**
 * Visibilidade do objeto que o presign vai montar.
 *
 * Com `obraId`, quem decide é a obra. Sem `obraId` (telas que ainda não mandam
 * a obra, como a foto de ocorrência), um usuário de empresa xgestão recebe
 * chave privada: na dúvida, o arquivo nasce fechado. `undefined` mantém a
 * regra padrão do kind (marketplace).
 */
export async function visibilidadeDoUpload(args: {
  kind: UploadKind;
  obraId?: string | null;
  userId: string;
  role: string;
}): Promise<UploadVisibility | undefined> {
  if (!kindPrivatizavel(args.kind)) return undefined;
  if (args.obraId) {
    const [obra] = await db
      .select({ clienteId: obras.clienteId, empreiteiraId: obras.empreiteiraId })
      .from(obras)
      .where(sql`${obras.id} = ${args.obraId}`);
    return obra && ehObraXgestao(obra) ? 'private' : undefined;
  }
  if (args.role !== 'empreiteiro') return undefined;
  return (await resolverEmpresaDoUsuario(args.userId)) ? 'private' : undefined;
}

/** URL de leitura: pública quando o objeto é público, assinada quando privado. */
export async function urlDeArquivo(
  file: { visibility: string | null; publicUrl: string | null; bucketKey: string; originalName?: string | null },
  opts: { download?: boolean } = {},
): Promise<string | null> {
  if (file.visibility === 'public') return file.publicUrl ?? publicUrlForKey(file.bucketKey);
  try {
    return await createSignedReadUrl({
      key: file.bucketKey,
      filename: opts.download ? (file.originalName ?? undefined) : undefined,
    });
  } catch {
    return null;
  }
}

/**
 * Todos os arquivos ligados a uma obra: galeria, documentos, capa, fotos de
 * diário e de ocorrência, contratos da equipe e comprovantes financeiros.
 */
export function sqlIdsArquivosDaObra(obraId: string) {
  return sql`
    SELECT file_id::text AS id FROM obra_fotos WHERE obra_id = ${obraId}
    UNION SELECT file_id::text FROM obra_anexos WHERE obra_id = ${obraId} AND file_id IS NOT NULL
    UNION SELECT foto_capa_file_id::text FROM obras WHERE id = ${obraId} AND foto_capa_file_id IS NOT NULL
    UNION SELECT unnest(foto_file_ids)::text FROM obra_diario WHERE obra_id = ${obraId}
    UNION SELECT foto_file_id::text FROM obra_ocorrencias WHERE obra_id = ${obraId} AND foto_file_id IS NOT NULL
    UNION SELECT contrato_file_id::text FROM obra_equipe WHERE obra_id = ${obraId} AND contrato_file_id IS NOT NULL
    UNION SELECT comprovante_file_id::text FROM financeiro WHERE obra_id = ${obraId} AND comprovante_file_id IS NOT NULL
  `;
}

export interface ArquivoParaDescartar {
  id: string;
  bucketKey: string;
}

export async function coletarArquivosDaObra(
  obraId: string,
  executor: Pick<typeof db, 'execute'> = db,
): Promise<ArquivoParaDescartar[]> {
  const result = await executor.execute(sql`
    SELECT uf.id, uf.bucket_key
    FROM user_files uf
    WHERE uf.deleted_at IS NULL AND uf.id::text IN (${sqlIdsArquivosDaObra(obraId)})
  `);
  const rows = (result as unknown as { rows: Array<{ id: string; bucket_key: string }> }).rows ?? [];
  return rows.map((r) => ({ id: r.id, bucketKey: r.bucket_key }));
}

/** Uso em bytes de uma obra do xgestão (arquivos distintos, sem os excluídos). */
export async function usoArquivosDaObra(obraId: string): Promise<{ bytes: number; arquivos: number }> {
  const result = await db.execute(sql`
    SELECT COALESCE(SUM(uf.size_bytes), 0)::bigint AS bytes, COUNT(*)::int AS total
    FROM user_files uf
    WHERE uf.deleted_at IS NULL AND uf.id::text IN (${sqlIdsArquivosDaObra(obraId)})
  `);
  const [row] = (result as unknown as { rows: Array<{ bytes: string | number; total: number }> }).rows ?? [];
  return { bytes: Number(row?.bytes ?? 0), arquivos: Number(row?.total ?? 0) };
}

/** O arquivo já está vinculado a alguma obra (qualquer origem)? */
export async function obrasComArquivo(fileId: string): Promise<string[]> {
  const result = await db.execute(sql`
    SELECT obra_id AS id FROM obra_fotos WHERE file_id = ${fileId}
    UNION SELECT obra_id FROM obra_anexos WHERE file_id = ${fileId}
    UNION SELECT id FROM obras WHERE foto_capa_file_id = ${fileId}
    UNION SELECT obra_id FROM obra_diario WHERE ${fileId} = ANY(foto_file_ids)
    UNION SELECT obra_id FROM obra_ocorrencias WHERE foto_file_id = ${fileId}
    UNION SELECT obra_id FROM obra_equipe WHERE contrato_file_id = ${fileId}
    UNION SELECT obra_id FROM financeiro WHERE comprovante_file_id = ${fileId} AND obra_id IS NOT NULL
  `);
  const rows = (result as unknown as { rows: Array<{ id: string }> }).rows ?? [];
  return rows.map((r) => r.id);
}

/** Soft delete em `user_files`. Roda dentro da transação de quem chama. */
export async function marcarArquivosExcluidos(ids: string[], executor: Executor = db): Promise<void> {
  if (ids.length === 0) return;
  await executor
    .update(userFiles)
    .set({ deletedAt: new Date() })
    .where(inArray(userFiles.id, ids));
}

/**
 * Remove os objetos do R2 DEPOIS do commit. Falha aqui não desfaz nada: o banco
 * já marcou o arquivo como excluído; o erro vai para `app_errors` para limpeza.
 */
export async function apagarObjetosR2(
  arquivos: ArquivoParaDescartar[],
  ctx: { route: string; userId: string },
): Promise<void> {
  for (const arquivo of arquivos) {
    try {
      await deleteObject(arquivo.bucketKey);
    } catch (error) {
      await logError('error', 'Falha ao apagar objeto do R2', {
        route: ctx.route,
        userId: ctx.userId,
        stack: error instanceof Error ? error.stack : undefined,
        meta: { fileId: arquivo.id, keyPrefix: arquivo.bucketKey.split('/').slice(0, -1).join('/') },
      });
    }
  }
}

/** Soft delete + remoção no R2, para exclusões pontuais fora de transação. */
export async function descartarArquivos(
  ids: Array<string | null | undefined>,
  ctx: { route: string; userId: string },
): Promise<void> {
  const unicos = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
  if (unicos.length === 0) return;
  const linhas = await db
    .select({ id: userFiles.id, bucketKey: userFiles.bucketKey, deletedAt: userFiles.deletedAt })
    .from(userFiles)
    .where(inArray(userFiles.id, unicos));
  const ativos = linhas.filter((l) => !l.deletedAt).map((l) => ({ id: l.id, bucketKey: l.bucketKey }));
  await marcarArquivosExcluidos(ativos.map((a) => a.id));
  await apagarObjetosR2(ativos, ctx);
}

/**
 * EMP-07 — dono ou gestor da empresa dona da obra do xgestão. Pode moderar
 * (excluir) foto e registro de diário de colaborador.
 */
export async function ehGestorDaObraXgestao(
  userId: string,
  obra: { clienteId: string | null; empreiteiraId: string | null },
): Promise<boolean> {
  if (!ehObraXgestao(obra)) return false;
  const empresa = await resolverEmpresaDoUsuario(userId);
  return Boolean(
    empresa &&
      empresa.empreiteiraId === obra.empreiteiraId &&
      (empresa.papel === 'dono' || empresa.papel === 'gestor'),
  );
}

/**
 * EMP-04 — confere, antes de vincular `fileIds` a uma obra do xgestão, que
 * nenhum deles já está em outra obra (ou nesta) e que a obra comporta o total.
 */
export async function erroVinculoArquivoXgestao(
  obraId: string,
  fileIds: string | string[],
): Promise<{ status: number; body: Record<string, unknown> } | null> {
  const ids = Array.from(new Set(Array.isArray(fileIds) ? fileIds : [fileIds]));
  for (const fileId of ids) {
    if ((await obrasComArquivo(fileId)).length > 0) {
      return {
        status: 409,
        body: { error: 'ARQUIVO_JA_VINCULADO', message: 'Este arquivo já está vinculado a uma obra. Envie o arquivo novamente.' },
      };
    }
  }
  const quota = await verificarQuotaVinculo(obraId, ids);
  if (!quota.ok) {
    return { status: 413, body: { error: 'QUOTA_EXCEDIDA', message: quota.message, uso: quota.uso } };
  }
  return null;
}

/**
 * Fotos de medição em obra do xgestão. `medicoes.fotos` guardava a URL pública
 * permanente; com a foto privada, o que se grava é uma referência ao arquivo
 * (`xg-file:<id>`), resolvida aqui para URL assinada a cada leitura. Entradas
 * que já são URL passam como estão (marketplace e histórico).
 */
export const PREFIXO_FOTO_MEDICAO = 'xg-file:';

export function referenciaFotoMedicao(fileId: string): string {
  return `${PREFIXO_FOTO_MEDICAO}${fileId}`;
}

export async function resolverFotosMedicao<T extends { fotos: string[] }>(linhas: T[]): Promise<T[]> {
  const ids = Array.from(new Set(linhas.flatMap((l) => l.fotos ?? [])
    .filter((f) => f.startsWith(PREFIXO_FOTO_MEDICAO))
    .map((f) => f.slice(PREFIXO_FOTO_MEDICAO.length))));
  if (ids.length === 0) return linhas;
  const files = await db
    .select({
      id: userFiles.id,
      bucketKey: userFiles.bucketKey,
      visibility: userFiles.visibility,
      publicUrl: userFiles.publicUrl,
      deletedAt: userFiles.deletedAt,
    })
    .from(userFiles)
    .where(inArray(userFiles.id, ids));
  const urls = new Map<string, string>();
  await Promise.all(files.filter((f) => !f.deletedAt).map(async (f) => {
    const url = await urlDeArquivo(f);
    if (url) urls.set(f.id, url);
  }));
  return linhas.map((l) => ({
    ...l,
    fotos: (l.fotos ?? []).flatMap((f) => {
      if (!f.startsWith(PREFIXO_FOTO_MEDICAO)) return [f];
      const url = urls.get(f.slice(PREFIXO_FOTO_MEDICAO.length));
      return url ? [url] : [];
    }),
  }));
}
