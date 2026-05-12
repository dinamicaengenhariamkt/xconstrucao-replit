import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { clearImpersonationCookie, readImpersonationFromRequest } from "@features/auth/api/impersonation";
import { recordAudit } from "@features/auth/api/audit";

function jsonNoStore(payload: unknown, status = 200): NextResponse {
  const r = NextResponse.json(payload, { status });
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest) {
  const imp = readImpersonationFromRequest(request);
  // Sair do modo deve funcionar mesmo durante impersonation; usamos guard só para
  // identificar o ator real. Como requireVerifiedUser bloqueia POST em impersonation,
  // lemos diretamente o cookie de access para o actor.
  const guard = await requireVerifiedUser(
    new NextRequest(new URL(request.url), {
      method: "GET",
      headers: request.headers,
    }),
  );

  const response = jsonNoStore({ ok: true });
  clearImpersonationCookie(response);

  if (imp && guard.user) {
    await recordAudit({
      actorId: imp.actorId,
      targetUserId: imp.targetId,
      action: "impersonate.exit",
      request,
    });
  }
  return response;
}
