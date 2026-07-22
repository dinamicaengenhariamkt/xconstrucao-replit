import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { logError } from "@/server/lib/logger";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";

/**
 * J51 — Conclui (ou pula) o wizard de onboarding.
 *
 * Marca `users.onboarding_concluido = true` para o usuário autenticado. Chamado
 * tanto no "Concluir" quanto no "Pular por agora" — em ambos os casos o wizard
 * não deve reaparecer. Idempotente: chamar de novo não muda nada.
 */
export async function POST(request: NextRequest) {
  try {
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;
    if (!payload?.sub) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
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
