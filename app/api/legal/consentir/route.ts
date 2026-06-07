import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { getClientIp } from "@features/auth/api/rate-limit";
import { registrarConsentimento } from "@features/legal/legal-service";

const bodySchema = z.object({
  tipos: z.array(z.enum(["termos", "privacidade"])).min(1),
});

/** POST /api/legal/consentir — registra re-consentimento do usuário logado. */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent");
  for (const tipo of parsed.data.tipos) {
    await registrarConsentimento({ userId: guard.user.id, tipo, ip, userAgent });
  }

  void recordAudit({
    actorId: guard.user.id,
    action: "legal.consentir",
    payload: { tipos: parsed.data.tipos },
    request,
  });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
