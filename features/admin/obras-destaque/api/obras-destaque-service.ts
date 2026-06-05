// Obras em Destaque na Home (J25) — curadoria admin + leitura pública.
//
// Capa "congelada": a obra guarda `foto_capa_file_id` (escolhido pelo admin entre
// as fotos que o contratante já cadastrou). Se o contratante trocar/remover fotos
// depois, a capa do destaque NÃO muda. Se o arquivo for deletado, a FK vira NULL
// (ON DELETE SET NULL) e a obra sai do carrossel (nunca publica imagem não-curada).
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obras, obraFotos, userFiles } from "@shared/db/schema";
import { publicUrlForKey } from "@shared/lib/storage";

export const LIMITE_DESTAQUES = 10;

export interface ObraDestaqueAdmin {
  id: string;
  nome: string;
  cidade: string | null;
  uf: string | null;
  tipo: string | null;
  status: string;
  visibilidade: string;
  statusModeracao: string;
  destaque: boolean;
  destaqueOrdem: number | null;
  fotoCapaFileId: string | null;
  capaUrl: string | null;
}

export interface ObraDestaquePublico {
  id: string;
  nome: string;
  cidade: string | null;
  uf: string | null;
  tipo: string | null;
  capaUrl: string;
}

/** Resolve a URL pública de um arquivo de capa, ou null se ausente/privado/deletado. */
async function resolverCapaUrl(fileId: string | null): Promise<string | null> {
  if (!fileId) return null;
  const [f] = await db
    .select({
      bucketKey: userFiles.bucketKey,
      publicUrl: userFiles.publicUrl,
      visibility: userFiles.visibility,
    })
    .from(userFiles)
    .where(and(eq(userFiles.id, fileId), isNull(userFiles.deletedAt)))
    .limit(1);
  if (!f || f.visibility !== "public") return null;
  return f.publicUrl ?? publicUrlForKey(f.bucketKey);
}

export async function contarDestaques(): Promise<number> {
  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(obras)
    .where(eq(obras.destaque, true));
  return count;
}

/** Lista as obras atualmente em destaque (para a tela de curadoria). */
export async function listarObrasDestaqueAdmin(): Promise<ObraDestaqueAdmin[]> {
  const rows = await db
    .select({
      id: obras.id,
      nome: obras.nome,
      cidade: obras.cidade,
      uf: obras.uf,
      tipo: obras.tipo,
      status: obras.status,
      visibilidade: obras.visibilidade,
      statusModeracao: obras.statusModeracao,
      destaque: obras.destaque,
      destaqueOrdem: obras.destaqueOrdem,
      fotoCapaFileId: obras.fotoCapaFileId,
    })
    .from(obras)
    .where(eq(obras.destaque, true))
    .orderBy(asc(obras.destaqueOrdem), desc(obras.createdAt));

  return Promise.all(
    rows.map(async (r) => ({
      ...r,
      capaUrl: await resolverCapaUrl(r.fotoCapaFileId),
    })),
  );
}

export type ToggleDestaqueResult =
  | { kind: "ok" }
  | { kind: "not_found" }
  | { kind: "limit" }
  | { kind: "invalid_capa" };

export interface ToggleDestaqueArgs {
  obraId: string;
  destaque: boolean;
  ordem?: number | null;
  fotoCapaFileId?: string | null;
}

/**
 * Liga/desliga o destaque de uma obra. Ao LIGAR:
 * - valida o limite de {@link LIMITE_DESTAQUES} (transação) — rejeita o (N+1)º;
 * - exige uma `fotoCapaFileId` que pertença a uma `obra_foto` da própria obra
 *   (não-deletada). Sem capa válida não entra no carrossel.
 */
export async function toggleDestaque(args: ToggleDestaqueArgs): Promise<ToggleDestaqueResult> {
  return db.transaction(async (tx) => {
    const [obra] = await tx
      .select({ id: obras.id, destaque: obras.destaque })
      .from(obras)
      .where(eq(obras.id, args.obraId))
      .limit(1)
      .for("update");
    if (!obra) return { kind: "not_found" };

    if (!args.destaque) {
      await tx
        .update(obras)
        .set({ destaque: false, destaqueOrdem: null, fotoCapaFileId: null })
        .where(eq(obras.id, args.obraId));
      return { kind: "ok" };
    }

    // Ativando: valida a capa (precisa ser uma foto da própria obra, não-deletada).
    if (!args.fotoCapaFileId) return { kind: "invalid_capa" };
    const [foto] = await tx
      .select({ fileId: obraFotos.fileId })
      .from(obraFotos)
      .innerJoin(userFiles, and(eq(userFiles.id, obraFotos.fileId), isNull(userFiles.deletedAt)))
      .where(and(eq(obraFotos.obraId, args.obraId), eq(obraFotos.fileId, args.fotoCapaFileId)))
      .limit(1);
    if (!foto) return { kind: "invalid_capa" };

    // Limite só conta quando a obra ainda NÃO é destaque (reativar não soma).
    if (!obra.destaque) {
      const [{ count } = { count: 0 }] = await tx
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(obras)
        .where(eq(obras.destaque, true));
      if (count >= LIMITE_DESTAQUES) return { kind: "limit" };
    }

    await tx
      .update(obras)
      .set({
        destaque: true,
        destaqueOrdem: args.ordem ?? null,
        fotoCapaFileId: args.fotoCapaFileId,
      })
      .where(eq(obras.id, args.obraId));
    return { kind: "ok" };
  });
}

/**
 * Lista as obras em destaque para a HOME (público). Whitelist de campos seguros;
 * exige capa congelada presente + obra publicada e aprovada (some sozinha se a
 * obra mudar de estado ou perder a capa).
 */
export async function listarDestaquesPublicos(): Promise<ObraDestaquePublico[]> {
  const rows = await db
    .select({
      id: obras.id,
      nome: obras.nome,
      cidade: obras.cidade,
      uf: obras.uf,
      tipo: obras.tipo,
      bucketKey: userFiles.bucketKey,
      publicUrl: userFiles.publicUrl,
      visibility: userFiles.visibility,
    })
    .from(obras)
    .innerJoin(
      userFiles,
      and(eq(userFiles.id, obras.fotoCapaFileId), isNull(userFiles.deletedAt)),
    )
    .where(
      and(
        eq(obras.destaque, true),
        eq(obras.visibilidade, "publicada"),
        eq(obras.statusModeracao, "aprovada"),
      ),
    )
    .orderBy(asc(obras.destaqueOrdem), desc(obras.createdAt));

  return rows
    .map((r) => ({
      id: r.id,
      nome: r.nome,
      cidade: r.cidade,
      uf: r.uf,
      tipo: r.tipo,
      capaUrl: r.visibility === "public" ? (r.publicUrl ?? publicUrlForKey(r.bucketKey)) : "",
    }))
    .filter((o) => o.capaUrl); // descarta capa privada/sem URL
}
