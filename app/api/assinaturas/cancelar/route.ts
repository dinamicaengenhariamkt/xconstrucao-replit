import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { cancelarAssinatura } from "@features/planos/assinatura-service";
import { assertXgestaoUser } from "@features/xgestao/lib/entitlement";
import { db } from "@shared/db/db";
import { xgestaoMembros } from "@shared/db/schema";
import { and, eq } from "drizzle-orm";

const bodySchema = z.object({ persona: z.enum(["xgestao"]).optional() });

async function isActiveXgestaoMember(userId: string): Promise<boolean> {
  const [membership] = await db
    .select({ id: xgestaoMembros.id })
    .from(xgestaoMembros)
    .where(and(eq(xgestaoMembros.userId, userId), eq(xgestaoMembros.status, "ativo")));
  return membership?.id != null;
}

/** POST /api/assinaturas/cancelar — cancela a assinatura ativa do usuário (rebaixa para free). */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const body = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    const r = NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  let persona: "empreiteiro" | "contratante" | "xgestao";
  if (body.data.persona === "xgestao") {
    if (await isActiveXgestaoMember(guard.user.id)) {
      const r = NextResponse.json({ message: "Somente o responsável da empresa pode cancelar o plano xgestão." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
    const entitlement = await assertXgestaoUser(guard.user.id);
    if (!entitlement) {
      const r = NextResponse.json({ message: "Acesso xgestão não autorizado." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
    persona = "xgestao";
  } else {
    persona = guard.user.role === "empreiteiro" ? "empreiteiro" : "contratante";
  }
  const result = await cancelarAssinatura(guard.user.id, persona);
  if (!result.ok) {
    const r = NextResponse.json({ message: "Nenhuma assinatura ativa para cancelar." }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }
  void recordAudit({ actorId: guard.user.id, action: "assinatura.cancelar", payload: { persona }, request });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
