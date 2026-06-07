import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { adicionarPapel } from "@features/auth/api/roles-service";

const bodySchema = z.object({ role: z.enum(["contratante", "empreiteiro"]) });

/**
 * POST /api/anunciante/upgrade — adiciona o papel de cliente (contratante/
 * empreiteiro) ao usuário, reaproveitando o cadastro. Multi-role aditivo (D2).
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Papel inválido", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const ok = await adicionarPapel(guard.user.id, parsed.data.role);
  if (!ok) {
    const r = NextResponse.json({ message: "Não foi possível adicionar o papel" }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  void recordAudit({
    actorId: guard.user.id,
    action: "anunciante.upgrade",
    payload: { role: parsed.data.role },
    request,
  });

  const r = NextResponse.json({ ok: true, role: parsed.data.role });
  setNoCacheHeaders(r);
  return r;
}
