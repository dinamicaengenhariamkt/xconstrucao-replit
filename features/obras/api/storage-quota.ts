import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obraAnexos, obraFotos, obras, userFiles } from "@shared/db/schema";
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

function montarUso(usadoBytes: number, arquivos: number): ObraStorageUso {
  const limiteBytes = QUOTA_OBRA_BYTES;
  return {
    usadoBytes,
    limiteBytes,
    arquivos,
    percentual: Math.min(100, Math.round((usadoBytes / limiteBytes) * 100)),
    disponivelBytes: Math.max(0, limiteBytes - usadoBytes),
  };
}

export async function calcularUsoObra(obraId: string): Promise<ObraStorageUso> {
  // EMP-04 — numa obra do xgestão a conta inclui todo arquivo ligado a ela
  // (fotos de diário e de ocorrência, capa, contratos da equipe, comprovantes),
  // sem contar duas vezes o mesmo arquivo. O marketplace segue com a regra
  // original (anexos + galeria).
  const [obra] = await db
    .select({ clienteId: obras.clienteId, empreiteiraId: obras.empreiteiraId })
    .from(obras)
    .where(eq(obras.id, obraId));
  if (obra && obra.clienteId === null && obra.empreiteiraId !== null) {
    const { usoArquivosDaObra } = await import("@features/xgestao/server/arquivos-obra");
    const uso = await usoArquivosDaObra(obraId);
    return montarUso(uso.bytes, uso.arquivos);
  }

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
  return montarUso(usadoBytes, arquivos);
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

/**
 * EMP-04 — reconfere a quota no VÍNCULO (POST fotos/anexos/diário). O presign
 * e o commit checam com o tamanho do arquivo, mas o vínculo é o que de fato
 * coloca o arquivo na obra; sem esta checagem, arquivos enviados sem `obraId`
 * (ou o mesmo arquivo em várias obras) escapavam do limite.
 */
export async function verificarQuotaVinculo(obraId: string, fileIds: string[]): Promise<QuotaCheck> {
  const ids = Array.from(new Set(fileIds));
  if (ids.length === 0) return { ok: true, uso: await calcularUsoObra(obraId) };
  const [linha] = await db
    .select({ bytes: sql<string>`COALESCE(SUM(${userFiles.sizeBytes}), 0)` })
    .from(userFiles)
    .where(and(inArray(userFiles.id, ids), isNull(userFiles.deletedAt)));
  return verificarQuotaObra(obraId, Number(linha?.bytes ?? 0));
}
