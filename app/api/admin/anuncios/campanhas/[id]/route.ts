import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { atualizarCampanha, deletarCampanha, getZonaTemplateDoAnuncio, isZonaValida, templateAceitoNaZona } from "@features/anuncios/anuncios-service";
import { CONTEUDO_SCHEMAS, isTemplateValido } from "@features/shared/anuncios/templates/schemas";

const patchSchema = z.object({
  titulo: z.string().trim().min(1).max(120).optional(),
  subtitulo: z.string().max(200).optional(),
  criativoUrl: z.string().url().optional(),
  ctaUrl: z.string().url().optional(),
  ctaTexto: z.string().max(40).optional(),
  zona: z.string().optional(),
  template: z.string().optional(),
  conteudo: z.unknown().optional(),
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  orcamento: z.number().nonnegative().optional(),
  status: z.enum(["rascunho", "agendada", "ativa", "pausada", "expirada"]).optional(),
});

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
  if (parsed.data.zona !== undefined && !isZonaValida(parsed.data.zona)) {
    const r = NextResponse.json({ message: "Zona inválida." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  // J24 — sempre que zona, template ou conteudo mudarem, revalida o par
  // template×zona EFETIVO (o novo valor, senão o já persistido na row) e valida
  // o `conteudo` contra o template efetivo. Carrega zona+template atuais da row
  // uma única vez para resolver os valores omitidos no patch.
  let conteudoValidado: unknown | undefined;
  if (parsed.data.zona !== undefined || parsed.data.template !== undefined || parsed.data.conteudo !== undefined) {
    const atual = await getZonaTemplateDoAnuncio(id);
    if (!atual) {
      const r = NextResponse.json({ message: "Campanha não encontrada." }, { status: 404 });
      setNoCacheHeaders(r);
      return r;
    }
    const zonaEfetiva = parsed.data.zona ?? atual.zona;
    const templateEfetivo = parsed.data.template ?? atual.template;

    if (!isTemplateValido(templateEfetivo)) {
      const r = NextResponse.json({ message: "Template inválido." }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
    if (!templateAceitoNaZona(templateEfetivo, zonaEfetiva)) {
      const r = NextResponse.json({ message: "Template incompatível com a zona." }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
    if (parsed.data.conteudo !== undefined) {
      const cParsed = CONTEUDO_SCHEMAS[templateEfetivo].safeParse(parsed.data.conteudo ?? null);
      if (!cParsed.success) {
        const r = NextResponse.json({ message: "Conteúdo inválido para o template.", errors: cParsed.error.flatten() }, { status: 400 });
        setNoCacheHeaders(r);
        return r;
      }
      conteudoValidado = cParsed.data;
    }
  }
  const updated = await atualizarCampanha(id, {
    ...parsed.data,
    ...(conteudoValidado !== undefined ? { conteudo: conteudoValidado } : {}),
  });
  if (!updated) {
    const r = NextResponse.json({ message: "Campanha não encontrada." }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  void recordAudit({ actorId: guard.user.id, action: "anuncios.atualizar_campanha", payload: { anuncioId: id, ...parsed.data }, request });
  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const { id } = await ctx.params;
  const ok = await deletarCampanha(id);
  if (!ok) {
    const r = NextResponse.json({ message: "Campanha não encontrada." }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  void recordAudit({ actorId: guard.user.id, action: "anuncios.deletar_campanha", payload: { anuncioId: id }, request });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
