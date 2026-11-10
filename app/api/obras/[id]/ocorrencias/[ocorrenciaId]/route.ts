import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { atividades, obraOcorrencias, userFiles } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess } from "@features/obras/api/access";
import { ocorrenciaUpdateSchema, podeGerenciarOcorrencia } from "@features/obras/api/ocorrencia-schemas";
import { papelGestaoOcorrencias } from "@features/obras/api/ocorrencia-acesso";
import { descartarArquivos, erroVinculoArquivoXgestao } from "@features/xgestao/server/arquivos-obra";

type Ctx = { params: Promise<{ id: string; ocorrenciaId: string }> };

function resposta(body: unknown, status = 200) {
  const r = NextResponse.json(body, { status });
  setNoCacheHeaders(r);
  return r;
}

/**
 * Autorização comum a editar e excluir. A ordem importa: obra (404) antes de
 * permissão (403) antes do registro (404), e o registro sempre filtrado pela
 * obra da URL, para que um id de outra obra não revele que existe.
 */
async function carregar(request: NextRequest, ctx: Ctx) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return { erro: guard.error } as const;
  const { id, ocorrenciaId } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) return { erro: resposta({ message: "Obra não encontrada" }, 404) } as const;
  const papel = await papelGestaoOcorrencias(access, guard.user.id);
  if (papel === undefined) return { erro: resposta({ message: "Sem permissão." }, 403) } as const;
  const [ocorrencia] = await db.select().from(obraOcorrencias)
    .where(and(eq(obraOcorrencias.id, ocorrenciaId), eq(obraOcorrencias.obraId, id)));
  if (!ocorrencia) return { erro: resposta({ message: "Ocorrência não encontrada" }, 404) } as const;
  if (!podeGerenciarOcorrencia(guard.user.id, ocorrencia.autorId, papel)) {
    return { erro: resposta({ message: "Sem permissão." }, 403) } as const;
  }
  return { user: guard.user, obraId: id, ocorrencia } as const;
}

/** Edita título, descrição, gravidade, foto e, se resolvida, a observação. */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const c = await carregar(request, ctx);
  if ("erro" in c) return c.erro;
  const parsed = ocorrenciaUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return resposta({ message: "Dados inválidos", errors: parsed.error.flatten() }, 400);
  const data = parsed.data;
  if (data.observacaoResolucao !== undefined && c.ocorrencia.status !== "resolvida") {
    return resposta({ message: "A observação da resolução só vale para ocorrência resolvida." }, 400);
  }
  if (data.fotoFileId && data.fotoFileId !== c.ocorrencia.fotoFileId) {
    const [f] = await db.select({ ownerUserId: userFiles.ownerUserId, kind: userFiles.kind }).from(userFiles)
      .where(and(eq(userFiles.id, data.fotoFileId), isNull(userFiles.deletedAt)));
    if (!f || f.ownerUserId !== c.user.id || f.kind !== "obra_foto") {
      return resposta({ message: "Foto inválida." }, 400);
    }
    // EMP-04 — vínculo único e quota da obra (a rota só existe na obra do xgestão).
    const erro = await erroVinculoArquivoXgestao(c.obraId, data.fotoFileId);
    if (erro) return resposta(erro.body, erro.status);
  }
  const set: Partial<typeof obraOcorrencias.$inferInsert> = { atualizadoEm: new Date() };
  if (data.titulo !== undefined) set.titulo = data.titulo;
  if (data.descricao !== undefined) set.descricao = data.descricao;
  if (data.gravidade !== undefined) set.gravidade = data.gravidade;
  if (data.fotoFileId !== undefined) set.fotoFileId = data.fotoFileId;
  if (data.observacaoResolucao !== undefined) set.observacaoResolucao = data.observacaoResolucao;
  const [updated] = await db.update(obraOcorrencias).set(set)
    .where(and(eq(obraOcorrencias.id, c.ocorrencia.id), eq(obraOcorrencias.obraId, c.obraId)))
    .returning();
  // O estado anterior fica na auditoria: ocorrência é registro da obra.
  await recordAudit({
    actorId: c.user.id,
    action: "obras.ocorrencia.update",
    payload: {
      obraId: c.obraId,
      ocorrenciaId: c.ocorrencia.id,
      anterior: {
        titulo: c.ocorrencia.titulo,
        descricao: c.ocorrencia.descricao,
        gravidade: c.ocorrencia.gravidade,
        fotoFileId: c.ocorrencia.fotoFileId,
        observacaoResolucao: c.ocorrencia.observacaoResolucao,
      },
    },
    request,
  });
  // Foto trocada ou removida: o arquivo antigo não serve a mais nada (EMP-12).
  if (data.fotoFileId !== undefined && c.ocorrencia.fotoFileId && data.fotoFileId !== c.ocorrencia.fotoFileId) {
    await descartarArquivos([c.ocorrencia.fotoFileId], { route: "obras.ocorrencia.update", userId: c.user.id });
  }
  // O feed guarda o título no payload; um título corrigido não pode sobrar lá.
  if (data.titulo !== undefined && data.titulo !== c.ocorrencia.titulo) {
    await db.update(atividades)
      .set({ payload: sql`jsonb_set(${atividades.payload}::jsonb, '{titulo}', to_jsonb(${data.titulo}::text))` })
      .where(and(
        eq(atividades.obraId, c.obraId),
        sql`${atividades.payload}->>'ocorrenciaId' = ${c.ocorrencia.id}`,
      ));
  }
  return resposta(updated);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const c = await carregar(request, ctx);
  if ("erro" in c) return c.erro;
  await db.delete(obraOcorrencias)
    .where(and(eq(obraOcorrencias.id, c.ocorrencia.id), eq(obraOcorrencias.obraId, c.obraId)));
  await descartarArquivos([c.ocorrencia.fotoFileId], { route: "obras.ocorrencia.delete", userId: c.user.id });
  await recordAudit({
    actorId: c.user.id,
    action: "obras.ocorrencia.delete",
    payload: {
      obraId: c.obraId,
      ocorrenciaId: c.ocorrencia.id,
      titulo: c.ocorrencia.titulo,
      descricao: c.ocorrencia.descricao,
      gravidade: c.ocorrencia.gravidade,
      status: c.ocorrencia.status,
    },
    request,
  });
  return resposta({ ok: true });
}
