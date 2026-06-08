import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser } from "@features/auth/api/auth-utils";
import { listarFaqPorVisao } from "@features/admin/faq/api/faq-service";

/** GET /api/empreiteiro/faq — perguntas visíveis ao empreiteiro (J32). */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const items = await listarFaqPorVisao("empreiteiro");
  return NextResponse.json(items);
}
