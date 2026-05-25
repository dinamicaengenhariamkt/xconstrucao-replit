import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { candidaturas, obras, obrasSalvas } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";

/**
 * GET /api/empreiteiro/obras-salvas
 * Lista favoritos do empreiteiro filtrando apenas obras ainda visíveis
 * (publicada AND empreiteira_id IS NULL). Mantém anti-self para coerência
 * com o feed (se ele se candidatou, sai da lista também).
 * PII do contratante sanitizada (clienteId omitido).
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (guard.user.role !== "empreiteiro") {
    const r = NextResponse.json({ message: "Perfil sem acesso" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const url = new URL(request.url);
  const idsOnly = url.searchParams.get("idsOnly") === "true";

  const whereClause = and(
    eq(obrasSalvas.userId, guard.user.id),
    eq(obras.visibilidade, "publicada"),
    isNull(obras.empreiteiraId),
    sql`NOT EXISTS (
      SELECT 1 FROM ${candidaturas}
      WHERE ${candidaturas.obraId} = ${obras.id}
        AND ${candidaturas.empreiteiroId} = ${guard.user.id}
    )`,
  );

  if (idsOnly) {
    const idRows = await db
      .select({ id: obras.id })
      .from(obrasSalvas)
      .innerJoin(obras, eq(obras.id, obrasSalvas.obraId))
      .where(whereClause);
    const r = NextResponse.json({ ids: idRows.map((r) => r.id) });
    setNoCacheHeaders(r);
    return r;
  }

  const pageRaw = Number(url.searchParams.get("page") ?? "1");
  const pageSizeRaw = Number(url.searchParams.get("pageSize") ?? "20");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(100, Math.max(1, Math.floor(pageSizeRaw)))
    : 20;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(obrasSalvas)
    .innerJoin(obras, eq(obras.id, obrasSalvas.obraId))
    .where(whereClause);

  const rows = await db
    .select({ obra: obras, savedAt: obrasSalvas.createdAt })
    .from(obrasSalvas)
    .innerJoin(obras, eq(obras.id, obrasSalvas.obraId))
    .where(whereClause)
    .orderBy(desc(obrasSalvas.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const out = rows.map(({ obra, savedAt }) => {
    const { clienteId, ...rest } = obra;
    return { ...rest, savedAt };
  });

  const totalPages = Math.max(1, Math.ceil((total ?? 0) / pageSize));

  const r = NextResponse.json({
    rows: out,
    total: total ?? 0,
    page,
    pageSize,
    totalPages,
  });
  setNoCacheHeaders(r);
  return r;
}

/**
 * POST /api/empreiteiro/obras-salvas  body { obraId }
 * Idempotente (ON CONFLICT DO NOTHING).
 * 404 se a obra não existe para o empreiteiro (não é publicada ou já vinculada).
 * 403 para outros perfis. Rate-limit 30/user/min + 60/ip/min.
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (guard.user.role !== "empreiteiro") {
    const r = NextResponse.json({ message: "Perfil sem acesso" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const ip = getClientIp(request);
  if (isRateLimited(`obras-salvas.write:${guard.user.id}`, 30, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`obras-salvas.write.ip:${ip}`, 60, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const obraId = typeof body?.obraId === "string" ? body.obraId : null;
  if (!obraId) {
    const r = NextResponse.json({ message: "obraId obrigatório" }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  // Visibilidade: obra precisa estar publicada e sem vínculo (mesmo gate do feed).
  // Se não passar, 404 (anti-enumeração — não confirma existência).
  const [obra] = await db
    .select({ id: obras.id })
    .from(obras)
    .where(
      and(
        eq(obras.id, obraId),
        eq(obras.visibilidade, "publicada"),
        isNull(obras.empreiteiraId),
      ),
    );
  if (!obra) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  await db
    .insert(obrasSalvas)
    .values({ userId: guard.user.id, obraId })
    .onConflictDoNothing({ target: [obrasSalvas.userId, obrasSalvas.obraId] });

  await recordAudit({
    actorId: guard.user.id,
    action: "obras-salvas.add",
    targetUserId: null,
    payload: { obraId },
    request,
  });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
