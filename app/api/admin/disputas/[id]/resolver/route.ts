import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { registrarAtividade } from "@features/atividades/api/registrar";
import { resolverDisputa } from "@features/disputas/disputas-service";
import { dispararNotificacaoDisputaResolvida } from "@features/notificacoes/disputa-dispatcher";

const bodySchema = z.object({
  resolucaoTipo: z.enum(["favor_contratante", "favor_empreiteiro", "meio_termo"]),
  resolucaoTexto: z.string().trim().min(10).max(2000),
  valorAjustado: z.number().nonnegative().optional().nullable(),
});

/** POST /api/admin/disputas/[id]/resolver — admin decide com efeito financeiro. */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos.", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const result = await resolverDisputa({
    id,
    adminId: guard.user.id,
    resolucaoTipo: parsed.data.resolucaoTipo,
    resolucaoTexto: parsed.data.resolucaoTexto,
    valorAjustado: parsed.data.valorAjustado ?? null,
  });

  if (!result.ok) {
    const status = result.code === "NAO_ENCONTRADA" ? 404 : 409;
    const message = result.code === "NAO_ENCONTRADA" ? "Disputa não encontrada." : "Disputa já resolvida.";
    const r = NextResponse.json({ message }, { status });
    setNoCacheHeaders(r);
    return r;
  }

  const d = result.disputa;
  void recordAudit({
    actorId: guard.user.id,
    action: "disputas.resolver",
    payload: { disputaId: id, resolucaoTipo: parsed.data.resolucaoTipo, valorAjustado: parsed.data.valorAjustado ?? null },
    request,
  });
  void registrarAtividade({
    tipo: "disputa_resolvida",
    actorUserId: guard.user.id,
    obraId: d.obraId,
    targetUserId: d.contraparteUserId,
    payload: { disputaId: id, resolucaoTipo: parsed.data.resolucaoTipo, alvoTipo: d.alvoTipo, alvoId: d.alvoId },
  });
  after(() => dispararNotificacaoDisputaResolvida({ disputaId: id }));

  const r = NextResponse.json(d);
  setNoCacheHeaders(r);
  return r;
}
