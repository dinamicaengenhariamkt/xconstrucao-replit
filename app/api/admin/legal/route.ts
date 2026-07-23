import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { listarVersoes, publicarVersao, type LegalTipo } from "@features/legal/legal-service";

/** GET /api/admin/legal — histórico de versões dos documentos legais. */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const url = new URL(request.url);
  const tipo = url.searchParams.get("tipo");
  const versoes = await listarVersoes(
    tipo === "termos" || tipo === "privacidade" ? (tipo as LegalTipo) : undefined,
  );
  const r = NextResponse.json({ versoes });
  setNoCacheHeaders(r);
  return r;
}

const publicarSchema = z.object({
  tipo: z.enum(["termos", "privacidade", "termo_anunciante"]),
  titulo: z.string().trim().min(2).max(160),
  conteudo: z.string().trim().min(10, "Conteúdo muito curto"),
  vigenteEm: z.string().datetime().optional().nullable(),
});

/** POST /api/admin/legal — publica nova versão (admin). */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const body = await request.json().catch(() => ({}));
  const parsed = publicarSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const doc = await publicarVersao({
    tipo: parsed.data.tipo,
    titulo: parsed.data.titulo,
    conteudo: parsed.data.conteudo,
    vigenteEm: parsed.data.vigenteEm ? new Date(parsed.data.vigenteEm) : null,
    criadoPor: guard.user.id,
  });

  void recordAudit({
    actorId: guard.user.id,
    action: "legal.publicar",
    payload: { tipo: doc.tipo, versao: doc.versao },
    request,
  });

  const r = NextResponse.json({ documento: doc }, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
