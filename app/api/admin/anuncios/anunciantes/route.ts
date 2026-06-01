import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { criarAnunciante, listarAnunciantes } from "@features/anuncios/anuncios-service";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const r = NextResponse.json(await listarAnunciantes());
  setNoCacheHeaders(r);
  return r;
}

const createSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  sigla: z.string().max(8).optional(),
  contato: z.string().max(120).optional(),
  email: z.string().email().optional(),
  telefone: z.string().max(40).optional(),
  status: z.enum(["ativo", "inativo"]).optional(),
});

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  const created = await criarAnunciante(parsed.data);
  void recordAudit({ actorId: guard.user.id, action: "anuncios.criar_anunciante", payload: { anuncianteId: created.id }, request });
  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
