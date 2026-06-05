import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { atualizarStatusLead } from "@features/admin/marketplace-leads/api/marketplace-leads-service";

const patchSchema = z.object({
  status: z.enum(["pendente", "notificado", "descartado"]),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const result = await atualizarStatusLead(id, parsed.data.status);
  if (!result) {
    const r = NextResponse.json({ message: "Lead não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  await recordAudit({
    actorId: guard.userId,
    action: "admin.marketplace_lead.status",
    payload: { leadId: id, status: parsed.data.status, statusAnterior: result.statusAnterior },
    request,
  });

  const r = NextResponse.json(result.lead);
  setNoCacheHeaders(r);
  return r;
}
