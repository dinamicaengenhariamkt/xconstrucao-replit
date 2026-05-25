import { NextRequest, NextResponse } from "next/server";
import { and, eq, desc, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { candidaturas, candidaturaAnexos, obras, userFiles } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { createSignedReadUrl } from "@shared/lib/storage";

/**
 * Allowlist explícita: somente campos que o empreiteiro pode submeter no form
 * de aplicar. Bloqueia mass-assignment de status / motivoRejeicao /
 * canceladaPeloEmpreiteiro / decididaEm / mensagemContratante /
 * notificacaoDisparada / empreiteiroId etc. via payload malicioso.
 */
const candidaturaCreateSchema = z.object({
  obraId: z.string().min(1),
  valorProposta: z.union([z.string(), z.number()]).transform((v) => String(v)),
  prazoEstimado: z.number().int().positive().nullable().optional(),
  dataInicio: z.string().nullable().optional(),
  dataTermino: z.string().nullable().optional(),
  descricao: z.string().max(5000).nullable().optional(),
  atividades: z.string().max(20000).nullable().optional(),
  observacoesPrazo: z.string().max(2000).nullable().optional(),
  observacoesFinanceiras: z.string().max(2000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "empreiteiro" && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  // Lista candidaturas do empreiteiro logado com dados da obra para a tela
  // /empreiteiro/minhas-candidaturas. Mantém compat com consumidores antigos
  // (array direto, não envelope paginado).
  const rows = await db
    .select({
      id: candidaturas.id,
      obraId: candidaturas.obraId,
      status: candidaturas.status,
      valorProposta: candidaturas.valorProposta,
      prazoEstimado: candidaturas.prazoEstimado,
      dataInicio: candidaturas.dataInicio,
      dataTermino: candidaturas.dataTermino,
      descricao: candidaturas.descricao,
      atividades: candidaturas.atividades,
      observacoesPrazo: candidaturas.observacoesPrazo,
      observacoesFinanceiras: candidaturas.observacoesFinanceiras,
      motivoRejeicao: candidaturas.motivoRejeicao,
      mensagemContratante: candidaturas.mensagemContratante,
      canceladaPeloEmpreiteiro: candidaturas.canceladaPeloEmpreiteiro,
      createdAt: candidaturas.createdAt,
      decididaEm: candidaturas.decididaEm,
      obraNome: obras.nome,
      obraCidade: obras.cidade,
      obraUf: obras.uf,
      obraTipo: obras.tipo,
      obraVisibilidade: obras.visibilidade,
      obraEmpreiteiraId: obras.empreiteiraId,
    })
    .from(candidaturas)
    .leftJoin(obras, eq(obras.id, candidaturas.obraId))
    .where(eq(candidaturas.empreiteiroId, guard.user.id))
    .orderBy(desc(candidaturas.createdAt));

  // Anexa lista de anexos por candidatura, com signed URLs (1 query agregada).
  const candIds = rows.map((r) => r.id);
  const anexosByCand = new Map<string, Array<{ id: string; fileId: string; originalName: string; mime: string; sizeBytes: number; createdAt: Date | null; url: string | null }>>();
  if (candIds.length > 0) {
    const anexosRows = await db
      .select({
        id: candidaturaAnexos.id,
        candidaturaId: candidaturaAnexos.candidaturaId,
        fileId: candidaturaAnexos.fileId,
        createdAt: candidaturaAnexos.createdAt,
        bucketKey: userFiles.bucketKey,
        originalName: userFiles.originalName,
        mime: userFiles.mime,
        sizeBytes: userFiles.sizeBytes,
      })
      .from(candidaturaAnexos)
      .innerJoin(userFiles, eq(userFiles.id, candidaturaAnexos.fileId))
      .where(and(inArray(candidaturaAnexos.candidaturaId, candIds), isNull(userFiles.deletedAt)))
      .orderBy(desc(candidaturaAnexos.createdAt));

    const signed = await Promise.all(
      anexosRows.map(async (a) => ({
        candidaturaId: a.candidaturaId,
        anexo: {
          id: a.id,
          fileId: a.fileId,
          originalName: a.originalName,
          mime: a.mime,
          sizeBytes: a.sizeBytes,
          createdAt: a.createdAt,
          url: await createSignedReadUrl({ key: a.bucketKey, filename: a.originalName }).catch(() => null),
        },
      })),
    );
    for (const s of signed) {
      const arr = anexosByCand.get(s.candidaturaId) ?? [];
      arr.push(s.anexo);
      anexosByCand.set(s.candidaturaId, arr);
    }
  }

  const enriched = rows.map((r) => ({ ...r, anexos: anexosByCand.get(r.id) ?? [] }));

  const r = NextResponse.json(enriched);
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (guard.user.role !== "empreiteiro") {
    const r = NextResponse.json(
      { message: "Apenas empreiteiros podem se candidatar a obras" },
      { status: 403 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const userId = guard.user.id;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  const parsed = candidaturaCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Anti-tamper: obra precisa existir, estar publicada e ainda sem empreiteira.
  const obraId = parsed.data.obraId;
  const [obra] = await db.select().from(obras).where(eq(obras.id, obraId));
  if (!obra) {
    return NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
  }
  if (obra.visibilidade !== "publicada") {
    return NextResponse.json(
      { message: "Esta obra não está aberta para candidaturas" },
      { status: 409 },
    );
  }
  if (obra.empreiteiraId) {
    return NextResponse.json(
      { message: "Esta obra já tem empreiteira contratada" },
      { status: 409 },
    );
  }

  // Server-side build: força campos sensíveis a valores seguros e ignora
  // qualquer tentativa de injetar status/motivoRejeicao/decididaEm/etc.
  const insertValues = {
    obraId: parsed.data.obraId,
    empreiteiroId: userId,
    valorProposta: parsed.data.valorProposta,
    prazoEstimado: parsed.data.prazoEstimado ?? null,
    dataInicio: parsed.data.dataInicio ?? null,
    dataTermino: parsed.data.dataTermino ?? null,
    descricao: parsed.data.descricao ?? null,
    atividades: parsed.data.atividades ?? null,
    observacoesPrazo: parsed.data.observacoesPrazo ?? null,
    observacoesFinanceiras: parsed.data.observacoesFinanceiras ?? null,
    status: "pendente" as const,
    canceladaPeloEmpreiteiro: false,
    notificacaoDisparada: false,
    motivoRejeicao: null,
    mensagemContratante: null,
    decididaEm: null,
  };

  // INSERT confiando no UNIQUE(obra_id, empreiteiro_id) para detectar duplicata.
  // Fallback: caso o índice não tenha sido aplicado (duplicatas legadas no
  // bootstrap), tenta um pre-check best-effort — não-racy quando o UNIQUE
  // está ativo, racy-mas-seguro quando não.
  try {
    const existing = await db
      .select({ id: candidaturas.id })
      .from(candidaturas)
      .where(and(eq(candidaturas.obraId, obraId), eq(candidaturas.empreiteiroId, userId)))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Você já se candidatou a esta obra" },
        { status: 409 },
      );
    }
    const [inserted] = await db.insert(candidaturas).values(insertValues).returning();
    void recordAudit({
      actorId: userId,
      action: "candidaturas.criar",
      targetUserId: null,
      payload: { obraId, candidaturaId: inserted.id },
      request,
    });
    const r = NextResponse.json(inserted, { status: 201 });
    setNoCacheHeaders(r);
    return r;
  } catch (err: any) {
    // 23505 = unique_violation no Postgres
    if (err?.code === "23505" || err?.cause?.code === "23505") {
      return NextResponse.json(
        { message: "Você já se candidatou a esta obra" },
        { status: 409 },
      );
    }
    console.error("[POST /api/empreiteiro/candidaturas]", err);
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
