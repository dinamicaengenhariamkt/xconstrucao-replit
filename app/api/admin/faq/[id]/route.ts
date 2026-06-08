import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { editarFaqAdmin, deletarFaqAdmin } from "@features/admin/faq/api/faq-service";

function adminGuard(request: NextRequest): { ok: true; userId: string } | { ok: false; res: NextResponse } {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return { ok: false, res: NextResponse.json({ message: "Não autenticado" }, { status: 401 }) };
  if (!isAdminLike(payload.role)) return { ok: false, res: NextResponse.json({ message: "Acesso negado" }, { status: 403 }) };
  return { ok: true, userId: payload.sub };
}

const patchSchema = z.object({
  question: z.string().trim().min(10).max(500).optional(),
  answer: z.string().trim().min(20).max(5000).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  visao: z.enum(["contratante", "empreiteiro", "ambos"]).optional(),
  ordem: z.number().int().min(0).max(9999).optional(),
  ativo: z.boolean().optional(),
});

/** PATCH /api/admin/faq/[id] — edita uma pergunta (J32). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = adminGuard(request);
  if (!guard.ok) return guard.res;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const ok = await editarFaqAdmin(id, parsed.data);
  if (!ok) {
    const r = NextResponse.json({ message: "Pergunta não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  void recordAudit({ actorId: guard.userId, action: "admin.faq.editar", payload: { faqId: id }, request });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}

/** DELETE /api/admin/faq/[id] — exclui uma pergunta (J32). */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = adminGuard(request);
  if (!guard.ok) return guard.res;

  const { id } = await params;
  const ok = await deletarFaqAdmin(id);
  if (!ok) {
    const r = NextResponse.json({ message: "Pergunta não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  void recordAudit({ actorId: guard.userId, action: "admin.faq.excluir", payload: { faqId: id }, request });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
