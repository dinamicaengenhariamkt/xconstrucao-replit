import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { criarCampanha, isZonaValida, listarCampanhas, templateAceitoNaZona } from "@features/anuncios/anuncios-service";
import { CONTEUDO_SCHEMAS, isTemplateValido } from "@features/shared/anuncios/templates/schemas";

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
  template: z.string().optional(),
  conteudo: z.unknown().optional(),
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
  // J24 — valida template (contra o registry) e compatibilidade com a zona,
  // depois valida o shape do `conteudo` pelo schema do template. Não confia no client.
  const template = parsed.data.template ?? "imagem-card";
  if (!isTemplateValido(template)) {
    const r = NextResponse.json({ message: "Template inválido." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  if (!templateAceitoNaZona(template, parsed.data.zona)) {
    const r = NextResponse.json({ message: "Template incompatível com a zona." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  const cParsed = CONTEUDO_SCHEMAS[template].safeParse(parsed.data.conteudo ?? null);
  if (!cParsed.success) {
    const r = NextResponse.json({ message: "Conteúdo inválido para o template.", errors: cParsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  const created = await criarCampanha({ ...parsed.data, template, conteudo: cParsed.data });
  void recordAudit({ actorId: guard.user.id, action: "anuncios.criar_campanha", payload: { anuncioId: created.id, zona: created.zona }, request });
  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
