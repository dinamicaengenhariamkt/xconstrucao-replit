import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { clientes } from "@shared/db/schema";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { isAdminLike } from "@features/auth/api/auth-utils";

const bodySchema = z.object({ decisao: z.enum(["aprovar", "reprovar"]) });

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  if (!isAdminLike(payload.role)) return NextResponse.json({ message: "Acesso negado" }, { status: 403 });

  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const [existing] = await db.select().from(clientes).where(eq(clientes.id, id));
  if (!existing) return NextResponse.json({ message: "Cliente não encontrado" }, { status: 404 });

  const novoStatus = parsed.data.decisao === "aprovar" ? "ativo" : "inativo";
  const [updated] = await db
    .update(clientes)
    .set({ status: novoStatus })
    .where(eq(clientes.id, id))
    .returning();

  const response: Record<string, unknown> = { ...updated };
  if (parsed.data.decisao === "aprovar" && !existing.perfilCompleto) {
    response.warning = "perfil_incompleto";
    response.warningMessage = "Cliente aprovado, mas o perfil ainda está incompleto. Oriente-o a completar os dados no primeiro acesso.";
  }

  return NextResponse.json(response);
}
