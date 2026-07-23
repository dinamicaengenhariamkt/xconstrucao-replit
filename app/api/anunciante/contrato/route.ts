import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { getClientIp } from "@features/auth/api/rate-limit";
import {
  anuncianteAceitouContratoVigente,
  getVersaoVigente,
  registrarConsentimento,
} from "@features/legal/legal-service";

/**
 * J59 — Termo do Anunciante (gate de entrada para anunciar).
 *
 * GET  → estado do aceite do usuário + documento vigente (para o modal renderizar
 *        o texto e decidir se precisa pedir aceite).
 * POST → registra o aceite da versão vigente em `user_consents` (com IP/UA),
 *        reusando `registrarConsentimento`. Isolado do fluxo global de
 *        re-consentimento (não passa pelo ReconsentGate).
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const [aceitou, vigente] = await Promise.all([
    anuncianteAceitouContratoVigente(guard.user.id),
    getVersaoVigente("termo_anunciante"),
  ]);

  const r = NextResponse.json({
    aceitou,
    documento: vigente
      ? { versao: vigente.versao, titulo: vigente.titulo, conteudo: vigente.conteudo, vigenteEm: vigente.vigenteEm }
      : null,
  });
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const vigente = await getVersaoVigente("termo_anunciante");
  if (!vigente) {
    // Sem termo publicado não há o que aceitar (o gate é fail-open nesse estado).
    const r = NextResponse.json({ message: "Não há termo do anunciante vigente." }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent");
  await registrarConsentimento({ userId: guard.user.id, tipo: "termo_anunciante", ip, userAgent });

  void recordAudit({
    actorId: guard.user.id,
    action: "anunciante.contrato.aceitar",
    payload: { versao: vigente.versao },
    request,
  });

  const r = NextResponse.json({ ok: true, versao: vigente.versao });
  setNoCacheHeaders(r);
  return r;
}
