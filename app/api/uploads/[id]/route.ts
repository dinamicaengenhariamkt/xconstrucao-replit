import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  empreiteiroDocumentos,
  empreiteiroPortfolio,
  financeiro,
  obraAnexos,
  obraDiario,
  obraEquipe,
  obraFotos,
  obraOcorrencias,
  obras,
  userFiles,
  users,
} from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { deleteObject } from "@shared/lib/storage";
import { erroSomenteLeituraUpload } from "@features/xgestao/server/guard-mutacao";
import {
  canAccessObraFinanceCategory,
  canWriteObraArea,
  findObraAccess,
} from "@features/obras/api/access";

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const [file] = await db.select().from(userFiles).where(eq(userFiles.id, id));
  if (!file || file.deletedAt) {
    const r = NextResponse.json({ message: "Arquivo não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (file.ownerUserId !== guard.user.id && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  // Arquivos pessoais que já foram vinculados a conteúdo de obra não podem ser
  // removidos por um membro somente-leitura apenas por serem seus uploads.
  // EMP-05 — diário, ocorrência e contrato de equipe também são conteúdo da
  // obra: sem eles, um membro sem acesso à área apagava o arquivo pelo id.
  const [anexos, fotos, capas, lancamentos, diarios, ocorrencias, contratos] = await Promise.all([
    db.select({ obraId: obraAnexos.obraId }).from(obraAnexos).where(eq(obraAnexos.fileId, id)),
    db.select({ obraId: obraFotos.obraId }).from(obraFotos).where(eq(obraFotos.fileId, id)),
    db.select({ obraId: obras.id }).from(obras).where(eq(obras.fotoCapaFileId, id)),
    db.select({ obraId: financeiro.obraId, categoria: financeiro.categoria })
      .from(financeiro).where(eq(financeiro.comprovanteFileId, id)),
    db.select({ obraId: obraDiario.obraId }).from(obraDiario)
      .where(sql`${id} = ANY(${obraDiario.fotoFileIds})`),
    db.select({ obraId: obraOcorrencias.obraId }).from(obraOcorrencias).where(eq(obraOcorrencias.fotoFileId, id)),
    db.select({ obraId: obraEquipe.obraId }).from(obraEquipe).where(eq(obraEquipe.contratoFileId, id)),
  ]);
  const linkedResources = [
    ...anexos.map((row) => ({ obraId: row.obraId, area: "equipe" as const })),
    ...fotos.map((row) => ({ obraId: row.obraId, area: "diario" as const })),
    ...capas.map((row) => ({ obraId: row.obraId, area: "diario" as const })),
    ...diarios.map((row) => ({ obraId: row.obraId, area: "diario" as const })),
    ...ocorrencias.map((row) => ({ obraId: row.obraId, area: "ocorrencias" as const })),
    ...contratos.map((row) => ({ obraId: row.obraId, area: "equipe" as const })),
    ...lancamentos.filter((row) => row.obraId).map((row) => ({
      obraId: row.obraId!,
      area: "financeiro" as const,
      categoria: row.categoria,
    })),
  ];
  // EMP-05 — conta xgestão somente leitura não apaga arquivo de obra.
  // REV-06 — decide pelas obras ligadas ao arquivo: só bloqueia se alguma for
  // obra xgestão; ligado só ao marketplace segue livre. Sem vínculo: arquivo
  // privado é conteúdo do xgestão (EMP-02) e vale o somente leitura da conta;
  // público sem vínculo não é bloqueado.
  const obrasDoArquivo = linkedResources.map((r) => r.obraId);
  const erroLeitura = await erroSomenteLeituraUpload(
    guard.user,
    file.kind,
    obrasDoArquivo.length > 0 ? obrasDoArquivo : file.visibility === "private" ? undefined : [],
  );
  if (erroLeitura) {
    const r = NextResponse.json({ code: "XGESTAO_SOMENTE_LEITURA", message: erroLeitura }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const uniqueResources = new Map(linkedResources.map((resource) => [
    `${resource.obraId}:${resource.area}:${"categoria" in resource ? resource.categoria : ""}`,
    resource,
  ]));
  for (const resource of uniqueResources.values()) {
    const { obraId, area } = resource;
    const access = await findObraAccess(obraId, { id: guard.user.id, role: guard.user.role });
    if (!access || !canWriteObraArea(access, area)) {
      const r = NextResponse.json({ message: "Sem permissão para remover arquivo desta obra." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
    if ("categoria" in resource && !canAccessObraFinanceCategory(access, resource.categoria)) {
      const r = NextResponse.json({ message: "Sem permissão para remover arquivo desta obra." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
  }

  // Limpa denormalizações.
  if (file.kind === "avatar") {
    await db
      .update(users)
      .set({ avatarUrl: null, avatarFileId: null })
      .where(eq(users.id, file.ownerUserId));
  } else if (file.kind === "portfolio_imagem" || file.kind === "portfolio_doc") {
    await db.delete(empreiteiroPortfolio).where(eq(empreiteiroPortfolio.fileId, file.id));
  } else if (file.kind === "empreiteiro_documento") {
    await db.delete(empreiteiroDocumentos).where(eq(empreiteiroDocumentos.fileId, file.id));
  }

  await deleteObject(file.bucketKey).catch((err) => {
    console.error("[uploads.delete] r2:", err);
  });
  await db.update(userFiles).set({ deletedAt: new Date() }).where(eq(userFiles.id, id));

  if (file.kind === "empreiteiro_documento") {
    await recordAudit({
      actorId: guard.user.id,
      action: "uploads.delete.documento",
      payload: { fileId: file.id, key: file.bucketKey },
      request,
    });
  }

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
