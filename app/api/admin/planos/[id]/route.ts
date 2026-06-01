import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { atualizarPlano } from "@features/planos/assinatura-service";

const patchSchema = z.object({
  nome: z.string().trim().min(2).max(120).optional(),
  descricao: z.string().trim().max(500).optional(),
  valorMensal: z.number().nonnegative().optional(),
  valorAnual: z.number().nonnegative().nullable().optional(),
  ativo: z.boolean().optional(),
  features: z.array(z.string()).optional(),
});

/** PATCH /api/admin/planos/[id] — edita preço/nome/features/ativo do plano. */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  const updated = await atualizarPlano(id, parsed.data);
  if (!updated) {
    const r = NextResponse.json({ message: "Plano não encontrado." }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  void recordAudit({ actorId: guard.user.id, action: "planos.atualizar", payload: { planoId: id, ...parsed.data }, request });
  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}
