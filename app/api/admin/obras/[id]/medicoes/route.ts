import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obras } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listMedicoesForObra } from "@/app/api/contratante/medicoes/_shared";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id: obraId } = await ctx.params;
  const [obra] = await db.select().from(obras).where(eq(obras.id, obraId));
  if (!obra) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const list = await listMedicoesForObra(obraId);
  list.sort((a, b) => (a.dataEnvio < b.dataEnvio ? 1 : -1));
  const r = NextResponse.json(list);
  setNoCacheHeaders(r);
  return r;
}
