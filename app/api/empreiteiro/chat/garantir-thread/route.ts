import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { empreiteiras } from "@shared/db/schema";
import { isAdminLike, requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { garantirChatThread, resolverParticipantesDaObra } from "@features/chat/service";

const bodySchema = z.object({
  obraId: z.string().min(1),
});

/**
 * POST /api/empreiteiro/chat/garantir-thread
 *
 * Espelha a rota do contratante, mas com ownership INVERTIDO: garante a
 * chat_thread entre a empreiteira logada e o contratante da obra, e só
 * permite quando o empreiteiro logado é de fato a empreiteira contratada
 * da obra (`empreiteiras.userId == user.id` E `obra.empreiteiraId == empreiteira.id`).
 *
 * Casos de obra do marketplace onde o empreiteiro ainda NÃO foi aceito
 * retornam 422 `NAO_VINCULADO` (o chat só existe após o vínculo firmado — J05).
 *
 * Retorna: { threadId: string }
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (!isAdminLike(guard.user.role) && guard.user.role !== "empreiteiro") {
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
    // Obra sem empreiteira firmada (ou empreiteira sem user): para o empreiteiro
    // isso é o caso "ainda não vinculado" — chat indisponível.
    const r = NextResponse.json(
      {
        error: "NAO_VINCULADO",
        message: "Chat disponível após a empreiteira ser contratada para esta obra.",
      },
      { status: 422 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const { participantes } = resolved;

  // Ownership do empreiteiro (admin pula): o empreiteiro logado precisa ser a
  // empreiteira vinculada à obra. Como o helper já resolveu `empreiteiroUserId`
  // a partir de `obra.empreiteiraId`, basta comparar com o user logado.
  if (!isAdminLike(guard.user.role)) {
    if (participantes.empreiteiroUserId !== guard.user.id) {
      // Confirma que o user logado é uma empreiteira (mensagem mais clara),
      // mas em qualquer caso não é a contratada desta obra.
      const [emp] = await db
        .select({ id: empreiteiras.id })
        .from(empreiteiras)
        .where(eq(empreiteiras.userId, guard.user.id))
        .limit(1);

      if (!emp) {
        const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
        setNoCacheHeaders(r);
        return r;
      }

      // É empreiteira, mas não a desta obra → não vinculado a esta obra.
      const r = NextResponse.json(
        {
          error: "NAO_VINCULADO",
          message: "Chat disponível após a empreiteira ser contratada para esta obra.",
        },
        { status: 422 },
      );
      setNoCacheHeaders(r);
      return r;
    }
  }

  // Contratante da thread: dono da obra (resolvido pelo helper). Sem userId
  // vinculado é caso legado — thread não pode ser criada sem os dois lados.
  if (!participantes.contratanteUserId) {
    const r = NextResponse.json(
      { error: "CONTRATANTE_SEM_USER", message: "Contratante da obra não possui usuário vinculado." },
      { status: 422 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const { threadId } = await garantirChatThread({
    obraId,
    contratanteUserId: participantes.contratanteUserId,
    empreiteiroUserId: participantes.empreiteiroUserId,
  });

  const r = NextResponse.json({ threadId });
  setNoCacheHeaders(r);
  return r;
}
