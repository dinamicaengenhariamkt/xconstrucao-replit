import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { pendenciasReconsent } from "@features/legal/legal-service";
import { getPlatformSetting } from "@features/admin/platform-settings/server/settings-reader";

/**
 * GET /api/legal/pendencias — para o usuário logado: documentos com versão vigente
 * maior que a aceita (re-consentimento pendente) + o modo (avisar|bloquear).
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const pendencias = await pendenciasReconsent(guard.user.id);
  const legal = (await getPlatformSetting("legal").catch(() => ({}))) as Record<string, unknown>;
  const modo = legal.reconsentModo === "bloquear" ? "bloquear" : "avisar";

  const r = NextResponse.json({ pendencias, modo });
  setNoCacheHeaders(r);
  return r;
}
