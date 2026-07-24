import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getClientIp } from "@features/auth/api/rate-limit";
import { recordAudit } from "@features/auth/api/audit";
import { responderSurvey } from "@features/surveys/service";

const bodySchema = z.object({
  nota: z.number().int(),
  comentario: z.string().trim().max(1000).optional(),
});

/**
 * POST /api/surveys/[id]/responder — J20.
 * Registra a resposta de um convite de pesquisa. A validação de authz (dono do
 * survey), faixa por tipo (NPS 0-10 / CSAT 0-5) e unicidade da resposta ficam no
 * service. Consentimento implícito é registrado via IP/UA (LGPD).
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json({ error: "INVALID", details: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const outcome = await responderSurvey({
    surveyId: id,
    userId: guard.user.id,
    nota: parsed.data.nota,
    comentario: parsed.data.comentario ?? null,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  if (outcome === "not_found") {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (outcome === "forbidden") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  if (outcome === "already") {
    const r = NextResponse.json({ error: "ALREADY_ANSWERED" }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }
  if (outcome === "out_of_range") {
    const r = NextResponse.json({ error: "NOTA_FORA_DA_FAIXA" }, { status: 422 });
    setNoCacheHeaders(r);
    return r;
  }

  await recordAudit({
    actorId: guard.user.id,
    action: "surveys.responder",
    payload: { surveyId: id, nota: parsed.data.nota, temComentario: !!parsed.data.comentario },
    request,
  });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
