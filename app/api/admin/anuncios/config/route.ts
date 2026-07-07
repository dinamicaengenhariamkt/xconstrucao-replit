import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { listConfig, setConfigVisivel, isZonaValida } from "@features/anuncios/anuncios-service";

/**
 * GET/PATCH /api/admin/anuncios/config — master toggle por seção/zona (J24, Opção B).
 * Interruptor explícito, independente de campanha ativa.
 */
function guardError(role: string): NextResponse | null {
  if (!isAdminLike(role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const forbidden = guardError(guard.user.role);
  if (forbidden) return forbidden;

  const r = NextResponse.json(await listConfig());
  setNoCacheHeaders(r);
  return r;
}

const patchSchema = z.object({
  chave: z.string().trim().min(1).max(120),
  visivel: z.boolean(),
});

/** Allowlist de chaves: a seção fixa + qualquer zona válida (`zona:<id>`). */
function chaveValida(chave: string): boolean {
  if (chave === "secao:mercado-em-foco") return true;
  if (chave.startsWith("zona:")) return isZonaValida(chave.slice("zona:".length));
  return false;
}

export async function PATCH(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const forbidden = guardError(guard.user.role);
  if (forbidden) return forbidden;

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  if (!chaveValida(parsed.data.chave)) {
    const r = NextResponse.json({ message: "Chave de configuração inválida." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  await setConfigVisivel(parsed.data.chave, parsed.data.visivel);
  void recordAudit({ actorId: guard.user.id, action: "anuncios.toggle_config", payload: parsed.data, request });
  const r = NextResponse.json({ ok: true, ...parsed.data });
  setNoCacheHeaders(r);
  return r;
}
