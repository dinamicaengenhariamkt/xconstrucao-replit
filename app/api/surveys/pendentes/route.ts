import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listarSurveysPendentes } from "@features/surveys/service";

/**
 * GET /api/surveys/pendentes — J20.
 * Convites de pesquisa pendentes do usuário logado (qualquer persona). Alimenta
 * o card "responder pesquisa" nas telas de notificações.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const pendentes = await listarSurveysPendentes(guard.user.id);
  const r = NextResponse.json(
    pendentes.map((s) => ({
      id: s.id,
      tipo: s.tipo,
      persona: s.persona,
      obraId: s.obraId,
      enviadoEm: s.enviadoEm,
    })),
  );
  setNoCacheHeaders(r);
  return r;
}
