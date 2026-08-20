import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listarPlanos } from "@features/planos/assinatura-service";
import { assertXgestaoUser } from "@features/xgestao/lib/entitlement";

/** GET /api/planos — planos ativos visíveis para a persona do usuário. */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const requestedPersona = request.nextUrl.searchParams.get("persona");
  let persona: "empreiteiro" | "contratante" | "xgestao";
  if (requestedPersona === "xgestao") {
    const entitlement = await assertXgestaoUser(guard.user.id);
    if (!entitlement) {
      const r = NextResponse.json({ message: "Acesso xgestão não autorizado." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
    persona = "xgestao";
  } else {
    if (requestedPersona) {
      const r = NextResponse.json({ message: "Persona inválida." }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
    persona = guard.user.role === "empreiteiro" ? "empreiteiro" : "contratante";
  }
  const r = NextResponse.json(await listarPlanos(persona));
  setNoCacheHeaders(r);
  return r;
}
