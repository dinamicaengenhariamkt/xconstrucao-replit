import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { criarCampanha, isZonaValida, listarCampanhas } from "@features/anuncios/anuncios-service";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const r = NextResponse.json(await listarCampanhas());
  setNoCacheHeaders(r);
  return r;
}

const createSchema = z.object({
  anuncianteId: z.string().min(1),
  titulo: z.string().trim().min(1).max(120),
  subtitulo: z.string().max(200).optional(),
  criativoUrl: z.string().url().optional(),
  ctaUrl: z.string().url().optional(),
  ctaTexto: z.string().max(40).optional(),
  zona: z.string().min(1),
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  orcamento: z.number().nonnegative().optional(),
  status: z.enum(["rascunho", "agendada", "ativa", "pausada", "expirada"]).optional(),
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
  if (!isZonaValida(parsed.data.zona)) {
    const r = NextResponse.json({ message: "Zona inválida." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  const created = await criarCampanha(parsed.data);
  void recordAudit({ actorId: guard.user.id, action: "anuncios.criar_campanha", payload: { anuncioId: created.id, zona: created.zona }, request });
  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
