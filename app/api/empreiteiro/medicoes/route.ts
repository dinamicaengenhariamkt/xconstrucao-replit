import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { medicoes, obras, empreiteiras } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited } from "@features/auth/api/rate-limit";

const bodySchema = z.object({
  obraId: z.string().min(1),
  etapa: z.string().trim().min(2).max(120),
  descricao: z.string().trim().max(2000).optional().nullable(),
  percentual: z.coerce.number().min(0.01).max(100),
  valor: z.coerce.number().min(0).optional(),
  fotos: z.array(z.string().min(1).max(256)).max(20).optional(),
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

  const { obraId, etapa, descricao, percentual, valor, fotos } = parsed.data;

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

  // Valida que soma de % (pendentes + aprovadas + nova) não estoura 100.
  const [agg] = await db
    .select({
      somaConsiderada: sql<string>`COALESCE(SUM(CASE WHEN status IN ('pendente','aprovada') THEN percentual ELSE 0 END), 0)`,
      proximo: sql<number>`COALESCE(MAX(numero), 0) + 1`,
    })
    .from(medicoes)
    .where(eq(medicoes.obraId, obraId));

  const soma = Number(agg?.somaConsiderada ?? 0);
  if (soma + percentual > 100) {
    const r = NextResponse.json(
      { message: `Percentual ultrapassa 100% (atual: ${soma}%, tentativa: +${percentual}%).` },
      { status: 422 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const numero = Number(agg?.proximo ?? 1);

  const [created] = await db
    .insert(medicoes)
    .values({
      obraId,
      empreiteiroId: guard.user.id,
      numero,
      etapa,
      descricao: descricao ?? null,
      percentual: String(percentual),
      valor: String(valor ?? 0),
      fotos: fotos ?? [],
    })
    .returning();

  await recordAudit({
    actorId: guard.user.id,
    action: "medicoes.create",
    targetUserId: null,
    payload: { medicaoId: created.id, obraId, numero, etapa, percentual, valor: valor ?? 0 },
    request,
  });

  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
