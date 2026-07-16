import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { clientes } from "@shared/db/schema";
import { isAdminLike, requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { garantirChatThread, resolverParticipantesDaObra } from "@features/chat/service";

const bodySchema = z.object({
  obraId: z.string().min(1),
});

/**
 * POST /api/contratante/chat/garantir-thread
 *
 * Garante que existe uma chat_thread entre o contratante logado e a
 * empreiteira vinculada à obra. Cria a thread se ainda não existir
 * (lazy-create de reconciliação para casos em que o `after()` do aceite
 * falhou ou a obra já estava vinculada antes do recurso existir).
 *
 * Retorna: { threadId: string }
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (!isAdminLike(guard.user.role) && guard.user.role !== "contratante") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  let bodyJson: unknown = {};
  try {
    bodyJson = await request.json();
  } catch {
    // body malformado
  }

  const parsed = bodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    const r = NextResponse.json({ error: "INVALID_BODY", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const { obraId } = parsed.data;

  const resolved = await resolverParticipantesDaObra(obraId);

  if (!resolved.ok) {
    if (resolved.erro === "NOT_FOUND") {
      const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      setNoCacheHeaders(r);
      return r;
    }
    if (resolved.erro === "SEM_EMPREITEIRA") {
      const r = NextResponse.json(
        { error: "SEM_EMPREITEIRA", message: "Esta obra ainda não tem empreiteira contratada." },
        { status: 422 },
      );
      setNoCacheHeaders(r);
      return r;
    }
    // EMPREITEIRO_SEM_USER
    const r = NextResponse.json(
      { error: "EMPREITEIRO_SEM_USER", message: "Empreiteira não possui usuário vinculado." },
      { status: 422 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const { participantes } = resolved;

  // Verificar ownership para contratante (admin pula).
  if (!isAdminLike(guard.user.role)) {
    const [cli] = await db
      .select({ id: clientes.id })
      .from(clientes)
      .where(eq(clientes.userId, guard.user.id))
      .limit(1);

    if (!cli || participantes.clienteId !== cli.id) {
      const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
  }

  // Contratante da thread: para o próprio contratante é ele mesmo; para admin,
  // o dono da obra (resolvido pelo helper). Fallback para o user logado se o
  // cliente não tiver userId vinculado (caso legado).
  const contratanteUserId = isAdminLike(guard.user.role)
    ? (participantes.contratanteUserId ?? guard.user.id)
    : guard.user.id;

  const { threadId } = await garantirChatThread({
    obraId,
    contratanteUserId,
    empreiteiroUserId: participantes.empreiteiroUserId,
  });

  const r = NextResponse.json({ threadId });
  setNoCacheHeaders(r);
  return r;
}
