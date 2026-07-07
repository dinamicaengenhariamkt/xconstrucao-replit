import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { listarFaqAdmin, criarFaqAdmin } from "@features/admin/faq/api/faq-service";

function adminGuard(request: NextRequest): { ok: true; userId: string } | { ok: false; res: NextResponse } {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return { ok: false, res: NextResponse.json({ message: "Não autenticado" }, { status: 401 }) };
  if (!isAdminLike(payload.role)) return { ok: false, res: NextResponse.json({ message: "Acesso negado" }, { status: 403 }) };
  return { ok: true, userId: payload.sub };
}

export async function GET(request: NextRequest) {
  const guard = adminGuard(request);
  if (!guard.ok) return guard.res;
  const items = await listarFaqAdmin();
  return NextResponse.json(items);
}

const faqSchema = z.object({
  question: z.string().trim().min(10, "Pergunta muito curta").max(500),
  answer: z.string().trim().min(20, "Resposta muito curta").max(5000),
  category: z.string().trim().min(1, "Categoria obrigatória").max(80),
  visao: z.enum(["contratante", "empreiteiro", "ambos"]),
  ordem: z.number().int().min(0).max(9999),
  ativo: z.boolean(),
});

/** POST /api/admin/faq — cria uma nova pergunta (J32). */
export async function POST(request: NextRequest) {
  const guard = adminGuard(request);
  if (!guard.ok) return guard.res;

  const body = await request.json().catch(() => ({}));
  const parsed = faqSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id } = await criarFaqAdmin(parsed.data);
  void recordAudit({
    actorId: guard.userId,
    action: "admin.faq.criar",
    payload: { faqId: id, visao: parsed.data.visao },
    request,
  });

  const r = NextResponse.json({ id }, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
