import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { logError } from "@/server/lib/logger";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { precisaDocumentoXgestao } from "@features/onboarding/server/documento-pendente";
import { MENSAGEM_DOCUMENTO_XGESTAO } from "@features/onboarding/lib/documento-onboarding";

/**
 * J51 — Conclui (ou pula) o wizard de onboarding.
 *
 * Marca `users.onboarding_concluido = true` para o usuário autenticado. Chamado
 * tanto no "Concluir" quanto no "Pular por agora" — em ambos os casos o wizard
 * não deve reaparecer. Idempotente: chamar de novo não muda nada.
 *
 * 10/11/2026 — conta do xgestão só conclui com CPF ou CNPJ válido salvo (422
 * `DOCUMENTO_OBRIGATORIO`). Quem já concluiu antes da regra não é barrado:
 * a chamada repetida segue idempotente e o documento continua sendo pedido no
 * checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;
    if (!payload?.sub) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const [atual] = await db
      .select({ concluido: users.onboardingConcluido })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);
    if (!atual?.concluido && await precisaDocumentoXgestao(payload.sub)) {
      return NextResponse.json(
        { code: "DOCUMENTO_OBRIGATORIO", message: MENSAGEM_DOCUMENTO_XGESTAO },
        { status: 422 },
      );
    }

    await db
      .update(users)
      .set({ onboardingConcluido: true })
      .where(eq(users.id, payload.sub));

    return NextResponse.json({ ok: true });
  } catch (error) {
    void logError("error", "/api/onboarding/concluir error", {
      stack: (error as Error)?.stack,
      route: "/api/onboarding/concluir",
    });
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
