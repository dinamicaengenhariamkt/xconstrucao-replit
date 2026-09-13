import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obraAnexos, obraFotos, userFiles } from "@shared/db/schema";
import { QUOTA_OBRA_BYTES } from "@shared/lib/storage/validation";

/**
 * XG10 — consumo de armazenamento por obra.
 *
 * O limite é acumulado (200 MB por obra, ver `QUOTA_OBRA_BYTES`), não por
 * arquivo: "uns 200 megas por obra tá ótimo" (22:00). Conta anexos E fotos,
 * porque ambos ocupam o mesmo bucket — somar só os documentos deixaria a
 * galeria de fotos crescer sem controle.
 *
 * Arquivos com `deletedAt` não contam: o soft delete já liberou o espaço do
 * ponto de vista do usuário.
 */

export interface ObraStorageUso {
  usadoBytes: number;
  limiteBytes: number;
  arquivos: number;
  /** 0–100, arredondado, limitado a 100 para a barra não estourar. */
  percentual: number;
  disponivelBytes: number;
}

export async function calcularUsoObra(obraId: string): Promise<ObraStorageUso> {
  // Uma query por origem; `UNION` exigiria montar SQL cru sem ganho real.
  const [anexos] = await db
    .select({
      bytes: sql<string>`COALESCE(SUM(${userFiles.sizeBytes}), 0)`,
      total: sql<number>`COUNT(*)::int`,
    })
    .from(obraAnexos)
    .innerJoin(userFiles, eq(userFiles.id, obraAnexos.fileId))
    .where(and(eq(obraAnexos.obraId, obraId), isNull(userFiles.deletedAt)));

  const [fotos] = await db
    .select({
      bytes: sql<string>`COALESCE(SUM(${userFiles.sizeBytes}), 0)`,
      total: sql<number>`COUNT(*)::int`,
    })
    .from(obraFotos)
    .innerJoin(userFiles, eq(userFiles.id, obraFotos.fileId))
    .where(and(eq(obraFotos.obraId, obraId), isNull(userFiles.deletedAt)));

  const usadoBytes = Number(anexos?.bytes ?? 0) + Number(fotos?.bytes ?? 0);
  const arquivos = (anexos?.total ?? 0) + (fotos?.total ?? 0);
  const limiteBytes = QUOTA_OBRA_BYTES;

  return {
    usadoBytes,
    limiteBytes,
    arquivos,
    percentual: Math.min(100, Math.round((usadoBytes / limiteBytes) * 100)),
    disponivelBytes: Math.max(0, limiteBytes - usadoBytes),
  };
}

export interface QuotaCheck {
  ok: boolean;
  uso: ObraStorageUso;
  message?: string;
}

/**
 * Verifica se cabe mais `novoArquivoBytes` na obra. Chamado no presign (antes
 * de gastar banda do usuário) e de novo no commit (o presign sozinho não é
 * garantia: entre um e outro, outro upload pode ter consumido o espaço).
 */
export async function verificarQuotaObra(
  obraId: string,
  novoArquivoBytes: number,
): Promise<QuotaCheck> {
  const uso = await calcularUsoObra(obraId);
  if (uso.usadoBytes + novoArquivoBytes <= uso.limiteBytes) {
    return { ok: true, uso };
  }
  const mb = (n: number) => (n / 1_000_000).toFixed(0);
  return {
    ok: false,
    uso,
    message:
      `Esta obra já usa ${mb(uso.usadoBytes)} MB de ${mb(uso.limiteBytes)} MB. ` +
      `O arquivo tem ${mb(novoArquivoBytes)} MB e não cabe — remova algum arquivo antes.`,
  };
}
