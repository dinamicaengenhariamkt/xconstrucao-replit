import { NextRequest, NextResponse } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  financeiro,
  obraAnexos,
  obraDiario,
  obraEquipe,
  obraFotos,
  obraOcorrencias,
  obras,
  userFiles,
} from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { createSignedReadUrl } from "@shared/lib/storage";
import {
  canAccessObraArea,
  canAccessObraFinanceCategory,
  findObraAccess,
} from "@features/obras/api/access";
import { ehObraXgestao } from "@features/xgestao/server/arquivos-obra";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const sp = new URL(request.url).searchParams;
  const key = sp.get("key");
  const id = sp.get("id");
  if (!key && !id) {
    const r = NextResponse.json({ message: "key ou id obrigatório" }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const [file] = key
    ? await db.select().from(userFiles).where(eq(userFiles.bucketKey, key))
    : await db.select().from(userFiles).where(eq(userFiles.id, id!));
  if (!file || file.deletedAt) {
    const r = NextResponse.json({ message: "Arquivo não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Possessing the original upload is not a substitute for area access after
  // the file has been attached to obra content.
  const [photoLinks, attachmentLinks, coverLinks, financeLinks, diaryLinks, incidentLinks, contractLinks] = await Promise.all([
    db.select({ obraId: obraFotos.obraId }).from(obraFotos).where(eq(obraFotos.fileId, file.id)),
    db.select({ obraId: obraAnexos.obraId }).from(obraAnexos).where(eq(obraAnexos.fileId, file.id)),
    db.select({ obraId: obras.id }).from(obras).where(eq(obras.fotoCapaFileId, file.id)),
    db.select({ obraId: financeiro.obraId, categoria: financeiro.categoria })
      .from(financeiro).where(eq(financeiro.comprovanteFileId, file.id)),
    db.select({ obraId: obraDiario.obraId }).from(obraDiario)
      .where(sql`${file.id} = ANY(${obraDiario.fotoFileIds})`),
    db.select({ obraId: obraOcorrencias.obraId }).from(obraOcorrencias)
      .where(eq(obraOcorrencias.fotoFileId, file.id)),
    db.select({ obraId: obraEquipe.obraId }).from(obraEquipe).where(eq(obraEquipe.contratoFileId, file.id)),
  ]);
  const scopedLinks = [
    ...photoLinks.map((link) => ({ obraId: link.obraId, area: "diario" as const, categoria: null })),
    ...attachmentLinks.map((link) => ({ obraId: link.obraId, area: "equipe" as const, categoria: null })),
    ...coverLinks.map((link) => ({ obraId: link.obraId, area: "diario" as const, categoria: null })),
    ...financeLinks.map((link) => ({
      obraId: link.obraId,
      area: "financeiro" as const,
      categoria: link.categoria,
    })),
    ...diaryLinks.map((link) => ({ obraId: link.obraId, area: "diario" as const, categoria: null })),
    ...incidentLinks.map((link) => ({ obraId: link.obraId, area: "ocorrencias" as const, categoria: null })),
    ...contractLinks.map((link) => ({ obraId: link.obraId, area: "equipe" as const, categoria: null })),
  ];

  // Apenas o dono ou super admin pode assinar. EMP-02 — numa obra do xgestão o
  // arquivo é da empresa, não de quem o enviou: o gestor precisa abrir o
  // comprovante ou o contrato que o colaborador anexou. Vale só quando TODOS os
  // vínculos são de obra xgestão; o acesso à área é conferido logo abaixo.
  if (file.ownerUserId !== guard.user.id && guard.user.role !== "superadmin") {
    const obraIds = Array.from(new Set(scopedLinks.map((l) => l.obraId).filter((v): v is string => Boolean(v))));
    const xgestao = obraIds.length > 0
      ? await db.select({ clienteId: obras.clienteId, empreiteiraId: obras.empreiteiraId })
        .from(obras).where(inArray(obras.id, obraIds))
      : [];
    const todosXgestao = xgestao.length === obraIds.length && obraIds.length > 0 &&
      xgestao.every((o) => ehObraXgestao(o));
    if (!todosXgestao || guard.user.role !== "empreiteiro") {
      const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
  }
  for (const link of scopedLinks) {
    if (!link.obraId) continue;
    const access = await findObraAccess(link.obraId, { id: guard.user.id, role: guard.user.role });
    if (
      !access ||
      !canAccessObraArea(access, link.area) ||
      (link.area === "financeiro" && !canAccessObraFinanceCategory(access, link.categoria))
    ) {
      const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
  }

  if (file.visibility === "public" && file.publicUrl) {
    const r = NextResponse.json({ url: file.publicUrl, signed: false });
    setNoCacheHeaders(r);
    return r;
  }

  const url = await createSignedReadUrl({ key: file.bucketKey, filename: file.originalName });
  const r = NextResponse.json({ url, signed: true, expiresIn: 15 * 60 });
  setNoCacheHeaders(r);
  return r;
}
