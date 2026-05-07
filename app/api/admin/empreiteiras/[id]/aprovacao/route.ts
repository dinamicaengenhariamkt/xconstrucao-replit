import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { empreiteiras } from "@shared/db/schema";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";

const bodySchema = z.object({ decisao: z.enum(["aprovar", "reprovar"]) });

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  if (payload.role !== "admin") return NextResponse.json({ message: "Acesso negado" }, { status: 403 });

  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const [existing] = await db.select().from(empreiteiras).where(eq(empreiteiras.id, id));
  if (!existing) return NextResponse.json({ message: "Empreiteira não encontrada" }, { status: 404 });

  if (parsed.data.decisao === "aprovar" && !existing.perfilCompleto) {
    return NextResponse.json(
      { message: "Não é possível aprovar um perfil incompleto" },
      { status: 409 },
    );
  }

  const novoStatus = parsed.data.decisao === "aprovar" ? "ativo" : "inativo";
  const [updated] = await db
    .update(empreiteiras)
    .set({ status: novoStatus })
    .where(eq(empreiteiras.id, id))
    .returning();

  return NextResponse.json(updated);
}
