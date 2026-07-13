import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, obras } from "@shared/db/schema";
import { isAdminLike, requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { garantirChatThread } from "@features/chat/service";

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

  const [obra] = await db
    .select({
      id: obras.id,
      clienteId: obras.clienteId,
      empreiteiraId: obras.empreiteiraId,
    })
    .from(obras)
    .where(eq(obras.id, obraId))
    .limit(1);

  if (!obra) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  if (!obra.empreiteiraId) {
    const r = NextResponse.json(
      { error: "SEM_EMPREITEIRA", message: "Esta obra ainda não tem empreiteira contratada." },
      { status: 422 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Verificar ownership para contratante (admin pula).
  if (!isAdminLike(guard.user.role)) {
    const [cli] = await db
      .select({ id: clientes.id })
      .from(clientes)
      .where(eq(clientes.userId, guard.user.id))
      .limit(1);

    if (!cli || obra.clienteId !== cli.id) {
      const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
  }

  // Resolver userId da empreiteira.
  const [emp] = await db
    .select({ userId: empreiteiras.userId })
    .from(empreiteiras)
    .where(eq(empreiteiras.id, obra.empreiteiraId))
    .limit(1);

  if (!emp?.userId) {
    const r = NextResponse.json(
      { error: "EMPREITEIRO_SEM_USER", message: "Empreiteira não possui usuário vinculado." },
      { status: 422 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Resolver userId do contratante.
  let contratanteUserId = guard.user.id;
  if (isAdminLike(guard.user.role) && obra.clienteId) {
    const [cli] = await db
      .select({ userId: clientes.userId })
      .from(clientes)
      .where(eq(clientes.id, obra.clienteId))
      .limit(1);
    if (cli?.userId) contratanteUserId = cli.userId;
  }

  const { threadId } = await garantirChatThread({
    obraId,
    contratanteUserId,
    empreiteiroUserId: emp.userId,
  });

  const r = NextResponse.json({ threadId });
  setNoCacheHeaders(r);
  return r;
}
