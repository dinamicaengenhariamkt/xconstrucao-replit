import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/server/lib/logger";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { comparePassword } from "@features/auth/api/auth-service";
import {
  requireVerifiedUser,
  clearAuthCookies,
  setNoCacheHeaders,
} from "@features/auth/api/auth-utils";
import { setUserAtivo } from "@features/auth/api/auth-storage";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { db } from "@shared/db/db";
import { sessions } from "@shared/db/schema";

const schema = z.object({
  currentPassword: z.string().min(1, "Senha atual obrigatória"),
});

function jsonNoStore(payload: unknown, status: number) {
  const r = NextResponse.json(payload, { status });
  setNoCacheHeaders(r);
  return r;
}

/**
 * Desativa a própria conta (soft-delete via `users.ativo=false`) — self-service
 * J02. Reversível: só um admin reativa depois. Exige confirmação da senha atual
 * (mesmo padrão de `change-password`); contas OAuth sem senha local não podem
 * usar esta rota (sem fator de confirmação). Após desativar, revoga todas as
 * sessões e limpa os cookies da sessão corrente — o próximo login bate no guard
 * `ACCOUNT_DISABLED` em `requireVerifiedUser`/`/api/auth/login`.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`desativar-conta:${ip}`, 5, 15 * 60 * 1000)) {
    return jsonNoStore({ message: "Muitas tentativas. Tente novamente em alguns minutos." }, 429);
  }

  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const user = guard.user;

  // Impersonation é read-only (o guard já bloqueia mutação), mas reforça: nunca
  // permitir desativar conta via "ver como".
  if (guard.impersonation) {
    return jsonNoStore({ message: "Ação indisponível no modo visualização." }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({ message: "Dados inválidos", errors: parsed.error.flatten() }, 400);
  }

  if (!user.password) {
    return jsonNoStore(
      { message: "Esta conta usa login social e não pode ser desativada por aqui. Contate o suporte." },
      400,
    );
  }

  const ok = await comparePassword(parsed.data.currentPassword, user.password);
  if (!ok) {
    return jsonNoStore({ message: "Senha incorreta." }, 401);
  }

  await setUserAtivo(user.id, false);

  // Revoga todas as sessões do usuário.
  try {
    await db.delete(sessions).where(eq(sessions.userId, user.id));
  } catch (err) {
    void logError("warn", "[desativar-conta] falha ao revogar sessões", { stack: (err as Error)?.stack, route: "/api/auth/desativar-conta" });
  }

  void recordAudit({
    actorId: user.id,
    action: "conta.desativar",
    targetUserId: user.id,
    payload: { selfService: true },
    request,
  });

  const response = NextResponse.json({
    success: true,
    message: "Conta desativada. Você foi desconectado.",
  });
  setNoCacheHeaders(response);
  clearAuthCookies(response);
  return response;
}
