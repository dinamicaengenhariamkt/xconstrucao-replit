import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { setNoCacheHeaders } from "@features/auth/api/auth-utils";
import {
  listarObrasDestaqueAdmin,
  contarDestaques,
  LIMITE_DESTAQUES,
} from "@features/admin/obras-destaque/api/obras-destaque-service";

export async function GET(request: NextRequest) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const [rows, count] = await Promise.all([listarObrasDestaqueAdmin(), contarDestaques()]);
  const r = NextResponse.json({ rows, count, limite: LIMITE_DESTAQUES });
  setNoCacheHeaders(r);
  return r;
}
