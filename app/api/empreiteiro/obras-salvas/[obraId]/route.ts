import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obrasSalvas } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";

/**
 * DELETE /api/empreiteiro/obras-salvas/[obraId]
 * Remove favorito. Silenciosamente 200 mesmo se o favorito não existir
 * (anti-oracle de IDs). Rate-limit 30/user/min + 60/ip/min. Audit best-effort.
 */
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ obraId: string }> }) {
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

  const { obraId } = await ctx.params;

  const deleted = await db
    .delete(obrasSalvas)
    .where(and(eq(obrasSalvas.userId, guard.user.id), eq(obrasSalvas.obraId, obraId)))
    .returning({ id: obrasSalvas.id });

  await recordAudit({
    actorId: guard.user.id,
    action: "obras-salvas.remove",
    targetUserId: null,
    payload: { obraId, existed: deleted.length > 0 },
    request,
  });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
