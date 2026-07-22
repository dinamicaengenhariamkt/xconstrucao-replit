import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser } from "@features/auth/api/auth-utils";
import { listarFaqPorVisao } from "@features/admin/faq/api/faq-service";

/** GET /api/anunciante/faq — perguntas visíveis ao anunciante (J53). */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const items = await listarFaqPorVisao("anunciante");
  return NextResponse.json(items);
}
