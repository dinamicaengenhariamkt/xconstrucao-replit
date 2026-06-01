import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listarPlanos } from "@features/planos/assinatura-service";

/** GET /api/planos — planos ativos visíveis para a persona do usuário. */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const persona = guard.user.role === "empreiteiro" ? "empreiteiro" : "contratante";
  const r = NextResponse.json(await listarPlanos(persona));
  setNoCacheHeaders(r);
  return r;
}
