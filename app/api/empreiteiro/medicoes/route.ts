import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { medicoes, obras, empreiteiras, obraEtapas, obraFotos, obraTarefas, userFiles } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited } from "@features/auth/api/rate-limit";
import { registrarAtividade } from "@features/atividades/api/registrar";
import { dispararNotificacaoMedicaoCriada } from "@features/notificacoes/medicao-dispatcher";
import { publicUrlForKey } from "@shared/lib/storage";

const bodySchema = z.object({
  obraId: z.string().min(1),
  etapa: z.string().trim().min(2).max(120),
  descricao: z.string().trim().max(2000).optional().nullable(),
  percentual: z.coerce.number().min(0.01).max(100),
  valor: z.coerce.number().min(0).optional(),
  fotos: z.array(z.string().min(1).max(256)).max(20).optional(),
  fotoFileIds: z.array(z.string().uuid()).max(20).optional(),
  tarefaId: z.string().uuid().optional(),
  tarefaProgresso: z.number().int().min(0).max(100).optional(),
  requestId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "empreiteiro") {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const rows = await db
    .select({
      id: medicoes.id,
      obraId: medicoes.obraId,
      obraNome: obras.nome,
      numero: medicoes.numero,
      etapa: medicoes.etapa,
      descricao: medicoes.descricao,
      percentual: medicoes.percentual,
      valor: medicoes.valor,
      fotos: medicoes.fotos,
      status: medicoes.status,
      motivoContestacao: medicoes.motivoContestacao,
      createdAt: medicoes.createdAt,
      decidedAt: medicoes.decidedAt,
    })
    .from(medicoes)
    .innerJoin(obras, eq(obras.id, medicoes.obraId))
    .where(eq(medicoes.empreiteiroId, guard.user.id))
    .orderBy(desc(medicoes.createdAt));

  const r = NextResponse.json(rows);
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "empreiteiro") {
    const r = NextResponse.json({ message: "Apenas empreiteiros podem registrar medições." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  if (isRateLimited(`medicoes.create:user:${guard.user.id}`, 30, 60 * 1000)) {
    const r = NextResponse.json(
      { message: "Muitas medições enviadas em pouco tempo. Aguarde um minuto." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const { obraId, etapa, descricao, percentual, valor, fotos, fotoFileIds, tarefaId, tarefaProgresso, requestId } = parsed.data;

  // Confirma que a obra existe e está atribuída a este empreiteiro.
  const [obra] = await db.select().from(obras).where(eq(obras.id, obraId));
  if (!obra) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const [emp] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, guard.user.id));
  if (!emp || obra.empreiteiraId !== emp.id) {
    const r = NextResponse.json({ message: "Você não está vinculado a esta obra." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  if ((tarefaId && tarefaProgresso === undefined) || (!tarefaId && tarefaProgresso !== undefined)) {
    const r = NextResponse.json({ message: "Tarefa e progresso da tarefa devem ser enviados juntos." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  let derivedFotoUrls: string[] = [];
  if (fotos?.length && !fotoFileIds?.length) {
    const r = NextResponse.json({ message: "Envie as fotos usando arquivos vinculados à sua conta." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  if (fotoFileIds?.length) {
    const files = await db
      .select({ id: userFiles.id, publicUrl: userFiles.publicUrl, bucketKey: userFiles.bucketKey })
      .from(userFiles)
      .where(and(
        inArray(userFiles.id, fotoFileIds),
        eq(userFiles.ownerUserId, guard.user.id),
        eq(userFiles.kind, "obra_foto"),
        eq(userFiles.visibility, "public"),
        isNull(userFiles.deletedAt),
      ));
    if (files.length !== new Set(fotoFileIds).size) {
      const r = NextResponse.json({ message: "Uma ou mais fotos são inválidas." }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
    const byId = new Map(files.map((file) => [file.id, file]));
    derivedFotoUrls = fotoFileIds.map((id) => {
      const file = byId.get(id)!;
      return file.publicUrl ?? publicUrlForKey(file.bucketKey);
    });
  }

  const ownWork = obra.clienteId === null;
  const result = await db.transaction(async (tx) => {
    const locked = await tx.execute(sql`
      SELECT progresso
      FROM obras
      WHERE id = ${obraId}
      FOR UPDATE
    `);
    const progressoAtualObra = Number((locked.rows[0] as { progresso?: number } | undefined)?.progresso ?? obra.progresso ?? 0);

    const [existingRequest] = requestId
      ? await tx
          .select()
          .from(medicoes)
          .where(and(eq(medicoes.empreiteiroId, guard.user.id), eq(medicoes.requestId, requestId)))
          .limit(1)
      : [];
    if (existingRequest) {
      return {
        created: existingRequest,
        approvalRequired: existingRequest.status === "pendente",
        obraProgresso: progressoAtualObra,
        duplicate: true,
      };
    }

    const [agg] = await tx
      .select({
        somaConsiderada: sql<string>`COALESCE(SUM(CASE WHEN status IN ('pendente','aprovada') THEN percentual ELSE 0 END), 0)`,
        proximo: sql<number>`COALESCE(MAX(numero), 0) + 1`,
      })
      .from(medicoes)
      .where(eq(medicoes.obraId, obraId));
    const base = ownWork ? progressoAtualObra : Number(agg?.somaConsiderada ?? 0);
    if (base + percentual > 100) {
      return { error: `Percentual ultrapassa 100% (atual: ${base}%, tentativa: +${percentual}%).` };
    }

    let tarefa: typeof obraTarefas.$inferSelect | undefined;
    if (tarefaId) {
      [tarefa] = await tx
        .select()
        .from(obraTarefas)
        .where(and(eq(obraTarefas.id, tarefaId), eq(obraTarefas.obraId, obraId)))
        .limit(1);
      if (!tarefa) return { error: "Tarefa não encontrada." };
      const atual = tarefa.progresso ?? 0;
      if (tarefaProgresso! < atual || tarefaProgresso! - atual !== percentual) {
        return { error: "O progresso da tarefa mudou. Recarregue a obra e tente novamente." };
      }
    }

    const now = new Date();
    const [created] = await tx
      .insert(medicoes)
      .values({
        obraId,
        empreiteiroId: guard.user.id,
        numero: Number(agg?.proximo ?? 1),
        etapa,
        descricao: descricao ?? null,
        percentual: String(percentual),
        valor: String(valor ?? 0),
        fotos: derivedFotoUrls,
        status: ownWork ? "aprovada" : "pendente",
        decidedAt: ownWork ? now : null,
        decidedBy: ownWork ? guard.user.id : null,
        requestId,
        tarefaId: tarefaId ?? null,
        tarefaProgresso: tarefaProgresso ?? null,
      })
      .returning();

    if (ownWork && tarefa && tarefaId) {
      await tx.update(obraTarefas).set({
        progresso: tarefaProgresso!,
        status: tarefaProgresso === 100 ? "concluido" : tarefa.status,
        updatedAt: now,
      }).where(eq(obraTarefas.id, tarefaId));
    }

    const novoProgresso = ownWork ? base + percentual : progressoAtualObra;
    if (ownWork) {
      await tx.update(obras).set({ progresso: novoProgresso, updatedAt: now }).where(eq(obras.id, obraId));
      if (tarefa?.etapaId) {
        const [avg] = await tx.select({
          progresso: sql<number>`COALESCE(ROUND(AVG(COALESCE(${obraTarefas.progresso}, 0))), 0)::int`,
        }).from(obraTarefas).where(eq(obraTarefas.etapaId, tarefa.etapaId));
        const etapaProgresso = Number(avg?.progresso ?? 0);
        await tx.update(obraEtapas).set({
          progresso: etapaProgresso,
          status: etapaProgresso === 100 ? "concluido" : etapaProgresso > 0 ? "em_andamento" : "pendente",
          updatedAt: now,
        }).where(and(eq(obraEtapas.id, tarefa.etapaId), eq(obraEtapas.obraId, obraId)));
      } else {
        const [etapaRow] = await tx.select().from(obraEtapas)
          .where(and(eq(obraEtapas.obraId, obraId), sql`lower(${obraEtapas.nome}) = lower(${etapa})`))
          .limit(1);
        if (etapaRow) {
          const etapaProgresso = Math.min(100, (etapaRow.progresso ?? 0) + percentual);
          await tx.update(obraEtapas).set({
            progresso: etapaProgresso,
            status: etapaProgresso === 100 ? "concluido" : "em_andamento",
            updatedAt: now,
          }).where(eq(obraEtapas.id, etapaRow.id));
        }
      }
    }

    if (fotoFileIds?.length) {
      const linked = await tx.select({ fileId: obraFotos.fileId }).from(obraFotos)
        .where(and(eq(obraFotos.obraId, obraId), inArray(obraFotos.fileId, fotoFileIds)));
      const linkedIds = new Set(linked.map((item) => item.fileId));
      const missing = fotoFileIds.filter((id) => !linkedIds.has(id));
      if (missing.length) {
        await tx.insert(obraFotos).values(missing.map((fileId) => ({
          obraId,
          autorId: guard.user.id,
          fileId,
          fase: "durante" as const,
          tag: etapa.slice(0, 40),
          enviadaAoContratante: !ownWork,
        })));
      }
    }

    return { created, approvalRequired: !ownWork, obraProgresso: novoProgresso, duplicate: false };
  });

  if ("error" in result) {
    const r = NextResponse.json({ message: result.error }, { status: 422 });
    setNoCacheHeaders(r);
    return r;
  }

  const { created } = result;
  const numero = created.numero;

  if (!result.duplicate) {
    await recordAudit({
      actorId: guard.user.id,
      action: "medicoes.create",
      targetUserId: null,
      payload: { medicaoId: created.id, obraId, numero, etapa, percentual, valor: valor ?? 0 },
      request,
    });
  }
  if (!result.duplicate) void registrarAtividade({
    tipo: ownWork ? "medicao_aprovada" : "medicao_criada",
    actorUserId: guard.user.id,
    obraId,
    payload: { medicaoId: created.id, numero, etapa, percentual, valor: valor ?? 0 },
  });

  // J06 — notificar contratante de nova medição aguardando avaliação.
  if (!ownWork && !result.duplicate) {
    after(() => dispararNotificacaoMedicaoCriada({ medicaoId: created.id }));
  }

  const r = NextResponse.json({
    ...created,
    approvalRequired: result.approvalRequired,
    obraProgresso: result.obraProgresso,
    duplicate: result.duplicate,
  }, { status: result.duplicate ? 200 : 201 });
  setNoCacheHeaders(r);
  return r;
}
