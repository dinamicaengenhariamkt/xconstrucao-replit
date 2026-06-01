import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { getSaidas, registrarSaidaManual } from "@features/admin/financeiro/api/caixa-service";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const q = new URL(request.url).searchParams;
  const r = NextResponse.json(
    await getSaidas(q.get("periodo"), Date.now(), { from: q.get("from"), to: q.get("to") }),
  );
  setNoCacheHeaders(r);
  return r;
}

const postSchema = z.object({
  descricao: z.string().trim().min(3).max(200),
  valor: z.number().positive(),
  categoria: z.string().trim().min(2).max(60),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["pendente", "pago"]).optional(),
});

/** POST /api/admin/saidas — registra despesa manual de plataforma (escopo=plataforma). */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const parsed = postSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  const created = await registrarSaidaManual(parsed.data);
  void recordAudit({ actorId: guard.user.id, action: "financeiro.saida_manual", payload: { ...parsed.data, id: created.id }, request });
  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
