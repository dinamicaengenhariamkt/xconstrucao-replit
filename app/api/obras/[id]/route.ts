import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  candidaturas,
  clientes,
  empreiteiras,
  medicoes,
  obras,
  obraAnexos,
  obraEtapas,
  users,
  userFiles,
} from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { insertObraSchema, insertObraSchemaStrict } from "@features/obras/schemas";
import { recordAudit } from "@features/auth/api/audit";
import { createSignedReadUrl, publicUrlForKey } from "@shared/lib/storage";
import { registrarAtividade } from "@features/atividades/api/registrar";
import { dispararSurveyObraConcluida } from "@features/surveys/triggers";

/**
 * Helper de scoping: devolve a obra se o usuário tiver acesso de leitura,
 * senão null (caller responde 404 — anti-enumeração).
 */
async function findObraWithAccess(
  obraId: string,
  user: { id: string; role: string },
): Promise<{ obra: typeof obras.$inferSelect; clienteId: string | null; empreiteiraId: string | null } | null> {
  const [obra] = await db.select().from(obras).where(eq(obras.id, obraId));
  if (!obra) return null;

  if (isAdminLike(user.role)) {
    return { obra, clienteId: null, empreiteiraId: null };
  }

  if (user.role === "contratante") {
    const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, user.id));
    if (!cli || obra.clienteId !== cli.id) return null;
    return { obra, clienteId: cli.id, empreiteiraId: null };
  }

  if (user.role === "empreiteiro") {
    const [emp] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, user.id));
    const isPublicaAvailable =
      obra.visibilidade === "publicada" &&
      obra.empreiteiraId === null &&
      obra.statusModeracao === "aprovada";
    const isAssigned = emp && obra.empreiteiraId === emp.id;
    if (!isPublicaAvailable && !isAssigned) return null;
    return { obra, clienteId: null, empreiteiraId: emp?.id ?? null };
  }

  return null;
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const access = await findObraWithAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Anexos com URL: signed se file privado, public caso contrário.
  const anexosRows = await db
    .select({
      id: obraAnexos.id,
      tipo: obraAnexos.tipo,
      observacao: obraAnexos.observacao,
      createdAt: obraAnexos.createdAt,
      fileId: obraAnexos.fileId,
      bucketKey: userFiles.bucketKey,
      originalName: userFiles.originalName,
      mime: userFiles.mime,
      sizeBytes: userFiles.sizeBytes,
      publicUrl: userFiles.publicUrl,
      visibility: userFiles.visibility,
    })
    .from(obraAnexos)
    .innerJoin(userFiles, eq(userFiles.id, obraAnexos.fileId))
    .where(and(eq(obraAnexos.obraId, id), isNull(userFiles.deletedAt)));

  const anexos = await Promise.all(
    anexosRows.map(async (a) => {
      const url = a.visibility === "public"
        ? (a.publicUrl ?? publicUrlForKey(a.bucketKey))
        : await createSignedReadUrl({ key: a.bucketKey, filename: a.originalName }).catch(() => null);
      return {
        id: a.id,
        tipo: a.tipo,
        observacao: a.observacao,
        createdAt: a.createdAt,
        fileId: a.fileId,
        originalName: a.originalName,
        mime: a.mime,
        sizeBytes: a.sizeBytes,
        url,
      };
    }),
  );

  const isContratante = guard.user.role === "contratante";
  const isAdmin = isAdminLike(guard.user.role);
  const isEmpreiteiro = guard.user.role === "empreiteiro";

  // Queries em paralelo: candidaturas, medições, empreiteira, foto capa.
  const [
    candidaturasCountResult,
    medicoesRows,
    empreiteiraRow,
    fotoCapa,
    minhaCandidaturaRows,
  ] = await Promise.all([
    // Contagem de candidaturas pendentes (só útil ao contratante/admin).
    isContratante || isAdmin
      ? db
          .select({ c: count() })
          .from(candidaturas)
          .where(and(eq(candidaturas.obraId, id), eq(candidaturas.status, "pendente")))
      : Promise.resolve([{ c: 0 }]),

    // Medições (contratante + admin veem todas).
    isContratante || isAdmin
      ? db
          .select({
            id: medicoes.id,
            numero: medicoes.numero,
            etapa: medicoes.etapa,
            descricao: medicoes.descricao,
            percentual: medicoes.percentual,
            valor: medicoes.valor,
            status: medicoes.status,
            motivoContestacao: medicoes.motivoContestacao,
            createdAt: medicoes.createdAt,
            decidedAt: medicoes.decidedAt,
          })
          .from(medicoes)
          .where(eq(medicoes.obraId, id))
      : Promise.resolve([]),

    // Dados da empreiteira vinculada (nome, contato).
    access.obra.empreiteiraId
      ? db
          .select({
            id: empreiteiras.id,
            nome: empreiteiras.nome,
            responsavel: empreiteiras.responsavel,
            telefone: empreiteiras.telefone,
            email: users.email,
            userImage: users.image,
            empreiteiraAvatarUrl: empreiteiras.avatarUrl,
          })
          .from(empreiteiras)
          .innerJoin(users, eq(users.id, empreiteiras.userId))
          .where(eq(empreiteiras.id, access.obra.empreiteiraId))
          .limit(1)
      : Promise.resolve([]),

    // URL da foto de capa (pública ou signed).
    access.obra.fotoCapaFileId
      ? db
          .select({
            bucketKey: userFiles.bucketKey,
            publicUrl: userFiles.publicUrl,
            visibility: userFiles.visibility,
          })
          .from(userFiles)
          .where(and(eq(userFiles.id, access.obra.fotoCapaFileId), isNull(userFiles.deletedAt)))
          .limit(1)
      : Promise.resolve([]),

    // Candidatura DO PRÓPRIO empreiteiro logado nesta obra (J40 P0 #1).
    // Sem isto o adapter caía em `applicationStatus: 'nao_aplicado'` fixo, e o
    // empreiteiro que já se candidatou continuava vendo o CTA "Candidatar-se",
    // com o chat travado mesmo após a candidatura ser aceita.
    // Usa idx_candidaturas_obra_empreiteiro. Escopado ao user do JWT — nunca
    // expõe candidatura de concorrente.
    isEmpreiteiro
      ? db
          .select({ status: candidaturas.status })
          .from(candidaturas)
          .where(and(eq(candidaturas.obraId, id), eq(candidaturas.empreiteiroId, guard.user.id)))
          .orderBy(desc(candidaturas.createdAt))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const candidaturasCount = Number((candidaturasCountResult[0] as { c: number | string } | undefined)?.c ?? 0);

  // Resolve URL da foto de capa.
  let fotoCapaUrl: string | null = null;
  if (fotoCapa[0]) {
    const f = fotoCapa[0] as { bucketKey: string; publicUrl: string | null; visibility: string };
    fotoCapaUrl = f.visibility === "public"
      ? (f.publicUrl ?? publicUrlForKey(f.bucketKey))
      : await createSignedReadUrl({ key: f.bucketKey }).catch(() => null);
  }

  // Dias restantes até dataPrevisao.
  let diasRestantes = 0;
  if (access.obra.dataPrevisao) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const previsao = new Date(access.obra.dataPrevisao);
    diasRestantes = Math.max(0, Math.ceil((previsao.getTime() - hoje.getTime()) / 86_400_000));
  }

  // Empreiteiro: sanitizar PII do contratante.
  const obraOut = guard.user.role === "empreiteiro"
    ? (() => { const { clienteId, ...rest } = access.obra; return rest; })()
    : access.obra;

  // Enum do banco (`pendente|aceita|rejeitada`) → enum da UI (`ApplicationStatus`).
  // Sem candidatura → 'nao_aplicado'. Só é computado para empreiteiro.
  const minhaCandidaturaStatus = (minhaCandidaturaRows[0] as { status: string } | undefined)?.status;
  const applicationStatus = !isEmpreiteiro
    ? undefined
    : minhaCandidaturaStatus === "pendente"
      ? "aplicado"
      : minhaCandidaturaStatus === "aceita"
        ? "aceito"
        : minhaCandidaturaStatus === "rejeitada"
          ? "rejeitado"
          : "nao_aplicado";

  // Escopo planejado pelo contratante. Alimenta o bloco "Escopo e Fases
  // Previstas" no detalhe da obra — antes o adapter devolvia `[]` fixo e o
  // card aparecia sempre vazio para o empreiteiro.
  const etapasRows = await db
    .select({
      id: obraEtapas.id,
      nome: obraEtapas.nome,
      descricao: obraEtapas.descricao,
      ordem: obraEtapas.ordem,
      status: obraEtapas.status,
      prazo: obraEtapas.prazo,
    })
    .from(obraEtapas)
    .where(eq(obraEtapas.obraId, id))
    .orderBy(asc(obraEtapas.ordem), asc(obraEtapas.createdAt));

  const r = NextResponse.json({
    ...obraOut,
    anexos,
    etapas: etapasRows,
    candidaturasCount,
    ...(applicationStatus ? { applicationStatus } : {}),
    medicoes: medicoesRows,
    empreiteiraInfo: empreiteiraRow[0]
    ? {
        ...empreiteiraRow[0],
        avatarUrl: empreiteiraRow[0].userImage || empreiteiraRow[0].empreiteiraAvatarUrl || null,
      }
    : null,
    fotoCapaUrl,
    diasRestantes,
  });
  setNoCacheHeaders(r);
  return r;
}

/**
 * PATCH /api/obras/[id]
 *  - Ownership (contratante dono) OU isAdminLike.
 *  - Permite transição rascunho→publicada com validação completa.
 *  - Bloqueia edição de clienteId/empreiteiraId (este último vem de J05).
 *  - Edição de valorTotal/descricao em obra com empreiteiraId != null → 409.
 */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const access = await findObraWithAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  // empreiteiro nunca edita
  if (guard.user.role === "empreiteiro") {
    const r = NextResponse.json({ message: "Sem permissão para editar." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const {
    clienteId: _c,
    empreiteiraId: _e,
    id: _i,
    // Moderação é exclusiva do admin via endpoints /api/admin/obras/[id]/(aprovar|rejeitar) (Task #86).
    statusModeracao: _modS,
    motivoModeracao: _modM,
    moderadoEm: _modE,
    moderadoPor: _modP,
    ...safeBody
  } = body ?? {};

  // Valida apenas os campos enviados (partial — sem superRefine de endereço).
  // Permite patches pontuais como { fotoCapaFileId } sem exigir campos de publicação.
  const incomingParsed = insertObraSchema.partial().safeParse(safeBody);
  if (!incomingParsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: incomingParsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Quando transitando para 'publicada', valida o objeto merged com o schema estrito
  // (endereço, CEP, tipo, modalidade etc. obrigatórios).
  const indoPublicar =
    "visibilidade" in safeBody &&
    safeBody.visibilidade === "publicada" &&
    access.obra.visibilidade !== "publicada";
  if (indoPublicar) {
    const merged = { ...access.obra, ...incomingParsed.data };
    const strictParsed = insertObraSchemaStrict.safeParse(merged);
    if (!strictParsed.success) {
      const r = NextResponse.json(
        { message: "Dados inválidos", errors: strictParsed.error.flatten() },
        { status: 400 },
      );
      setNoCacheHeaders(r);
      return r;
    }
  }

  // Bloqueio: valorTotal/descricao não podem ser alterados após vínculo com empreiteira.
  if (access.obra.empreiteiraId !== null) {
    const valorMudou = "valorTotal" in safeBody && String(safeBody.valorTotal) !== String(access.obra.valorTotal);
    const descMudou = "descricao" in safeBody && safeBody.descricao !== access.obra.descricao;
    if (valorMudou || descMudou) {
      const r = NextResponse.json(
        {
          error: "OBRA_LOCKED_AFTER_BIND",
          message: "Obra já vinculada a uma empreiteira. Use aditivo (J10) para alterar valor ou escopo.",
        },
        { status: 409 },
      );
      setNoCacheHeaders(r);
      return r;
    }
  }

  // Anti-IDOR: `fotoCapaFileId` referencia um userFiles.id. Só o dono do arquivo
  // (ou um admin) pode vinculá-lo como capa — senão um contratante poderia apontar
  // a capa da própria obra para o arquivo PRIVADO de outro usuário e lê-lo via a
  // signed URL que o GET resolve. Espelha a checagem `invalid_capa` do admin/J25.
  if ("fotoCapaFileId" in safeBody && safeBody.fotoCapaFileId != null) {
    const fileId = String(safeBody.fotoCapaFileId);
    const ownerFilter = isAdminLike(guard.user.role)
      ? undefined
      : eq(userFiles.ownerUserId, guard.user.id);
    const [f] = await db
      .select({ id: userFiles.id })
      .from(userFiles)
      .where(and(eq(userFiles.id, fileId), isNull(userFiles.deletedAt), ownerFilter))
      .limit(1);
    if (!f) {
      const r = NextResponse.json({ message: "Capa inválida." }, { status: 422 });
      setNoCacheHeaders(r);
      return r;
    }
  }

  // J58 — enquanto o contrato entre as partes não está `assinado`, este PATCH
  // genérico não pode promover a obra a `em_andamento`. Só a rota de assinatura
  // (app/api/obras/[id]/contrato/assinar) efetiva a obra. Blinda um vetor secundário
  // (o campo `status` faz parte do insertObraSchema.partial()).
  if (
    "status" in safeBody &&
    safeBody.status === "em_andamento" &&
    access.obra.contratoStatus != null &&
    access.obra.contratoStatus !== "assinado"
  ) {
    const r = NextResponse.json(
      {
        error: "CONTRATO_PENDENTE",
        message: "A obra só inicia após a assinatura do contrato por ambas as partes.",
      },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Aplica apenas os campos enviados (não sobrescreve com merged completo).
  const updateData: Record<string, unknown> = {};
  for (const k of Object.keys(safeBody)) {
    updateData[k] = (incomingParsed.data as any)[k];
  }
  updateData.updatedAt = new Date();

  // J03 — Task #86: transição para 'publicada' reseta moderação para 'pendente'
  // (cobre primeira publicação e re-submissão após rejeição). Não vale para admin
  // empurrando alteração administrativa sem mudar visibilidade.
  // `indoPublicar` foi computado acima (junto à validação estrita).
  if (indoPublicar) {
    updateData.statusModeracao = "pendente";
    updateData.motivoModeracao = null;
    updateData.moderadoEm = null;
    updateData.moderadoPor = null;
  }

  const [updated] = await db.update(obras).set(updateData).where(eq(obras.id, id)).returning();

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.update",
    targetUserId: null,
    payload: {
      obraId: id,
      changes: Object.keys(safeBody),
      visibilidadeAnterior: access.obra.visibilidade,
      visibilidadeNova: updated.visibilidade,
    },
    request,
  });

  // J07: a atividade "obra_publicada" agora é emitida pelo endpoint de
  // aprovação admin (Task #86), não mais aqui. Publicar só envia para moderação.

  // J20 — dispara NPS quando a obra transita para 'concluida'. Fire-and-forget
  // (padrão registrarAtividade): não bloqueia a resposta e é idempotente.
  if (access.obra.status !== "concluida" && updated.status === "concluida") {
    void dispararSurveyObraConcluida(id);
  }

  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}

/**
 * DELETE /api/obras/[id]
 *  - Ownership ou isAdminLike.
 *  - 409 se há candidatura pendente. Cliente deve PATCH visibilidade='arquivada'.
 *  - Sem candidaturas → hard delete; cascade derruba obra_anexos.
 */
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const access = await findObraWithAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (guard.user.role === "empreiteiro") {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  // Transação + SELECT ... FOR UPDATE na row da obra para fechar a janela de
  // corrida entre "tem candidatura pendente?" e o DELETE. Se uma candidatura
  // for criada concorrentemente, ou ela vê a row travada e espera (e o count
  // posterior a enxerga → 409) ou o DELETE roda primeiro e o INSERT da
  // candidatura falha por FK.
  const txResult = await db.transaction(async (tx) => {
    const locked = await tx
      .select({ id: obras.id })
      .from(obras)
      .where(eq(obras.id, id))
      .for("update");
    if (locked.length === 0) {
      return { kind: "not_found" as const };
    }

    const pendentes = await tx
      .select({ id: candidaturas.id })
      .from(candidaturas)
      .where(and(eq(candidaturas.obraId, id), eq(candidaturas.status, "pendente")));
    if (pendentes.length > 0) {
      return { kind: "conflict" as const, count: pendentes.length };
    }

    await tx.delete(obras).where(eq(obras.id, id));
    return { kind: "deleted" as const };
  });

  if (txResult.kind === "not_found") {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (txResult.kind === "conflict") {
    const r = NextResponse.json(
      {
        error: "OBRA_HAS_PENDING_CANDIDATURAS",
        message: `Há ${txResult.count} candidatura(s) pendente(s). Arquive a obra em vez de excluir (PATCH visibilidade='arquivada').`,
      },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.delete",
    targetUserId: null,
    payload: { obraId: id, nome: access.obra.nome },
    request,
  });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
