import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import {
  comparePassword,
  hashPassword,
  createAccessToken,
  createRefreshToken,
} from "@features/auth/api/auth-service";
import { evaluatePasswordPolicy } from "@features/auth/schemas/password";
import { requireVerifiedUser, createAuthCookies, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { updateUserPassword } from "@features/auth/api/auth-storage";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { db } from "@shared/db/db";
import { sessions } from "@shared/db/schema";

const schema = z.object({
  currentPassword: z.string().min(1, "Senha atual obrigatória"),
  newPassword: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação obrigatória"),
});

function jsonNoStore(payload: unknown, status: number) {
  const r = NextResponse.json(payload, { status });
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`change-password:${ip}`, 10, 15 * 60 * 1000)) {
    return jsonNoStore({ message: "Muitas tentativas. Tente novamente em alguns minutos." }, 429);
  }

  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const user = guard.user;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({ message: "Dados inválidos", errors: parsed.error.flatten() }, 400);
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;

  if (newPassword !== confirmPassword) {
    return jsonNoStore({ message: "A confirmação não confere com a nova senha." }, 400);
  }

  if (currentPassword === newPassword) {
    return jsonNoStore({ message: "A nova senha deve ser diferente da atual." }, 400);
  }

  if (!user.password) {
    return jsonNoStore(
      { message: "Esta conta usa login social. Não há senha para alterar." },
      400
    );
  }

  const ok = await comparePassword(currentPassword, user.password);
  if (!ok) {
    return jsonNoStore({ message: "Senha atual incorreta." }, 401);
  }

  const policy = evaluatePasswordPolicy(newPassword, {
    email: user.email,
    name: user.name,
    username: user.username || undefined,
  });
  if (!policy.valid) {
    return jsonNoStore({ message: policy.message ?? "Nova senha inválida." }, 400);
  }

  const hashed = await hashPassword(newPassword);
  await updateUserPassword(user.id, hashed);

  // Re-emit cookies (rotaciona refresh) para invalidar tokens antigos da mesma sessão
  const accessToken = createAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    image: user.image,
    avatarUrl: user.avatarUrl,
  });
  const refreshToken = createRefreshToken(user.id, false);

  // Revoga todas as outras sessões do usuário (mantém só a atual, com hash novo).
  try {
    const newHash = createHash("sha256").update(refreshToken).digest("hex");
    const refreshMaxAgeMs = 7 * 24 * 60 * 60 * 1000;
    const userAgent = request.headers.get("user-agent") ?? null;

    // Tenta atualizar a row da sessão atual (pelo hash do refresh antigo).
    const cookieHeader = request.headers.get("cookie");
    const oldRefreshMatch = cookieHeader?.match(/(?:^|; )refresh_token=([^;]+)/);
    const oldRefresh = oldRefreshMatch ? decodeURIComponent(oldRefreshMatch[1]) : null;
    const oldHash = oldRefresh ? createHash("sha256").update(oldRefresh).digest("hex") : null;

    let currentSessionId: string | null = null;
    if (oldHash) {
      const updated = await db
        .update(sessions)
        .set({
          sessionToken: newHash,
          lastUsedAt: new Date(),
          expires: new Date(Date.now() + refreshMaxAgeMs),
        })
        .where(and(eq(sessions.sessionToken, oldHash), eq(sessions.userId, user.id)))
        .returning({ id: sessions.id });
      currentSessionId = updated[0]?.id ?? null;
    }
    if (!currentSessionId) {
      const inserted = await db
        .insert(sessions)
        .values({
          sessionToken: newHash,
          userId: user.id,
          expires: new Date(Date.now() + refreshMaxAgeMs),
          userAgent,
          ip,
          lastUsedAt: new Date(),
        })
        .returning({ id: sessions.id });
      currentSessionId = inserted[0]?.id ?? null;
    }

    // Apaga todas as outras sessões do usuário.
    if (currentSessionId) {
      await db
        .delete(sessions)
        .where(and(eq(sessions.userId, user.id), ne(sessions.id, currentSessionId)));
    }
  } catch (err) {
    console.error("Falha ao revogar sessões após troca de senha:", err);
  }

  const response = NextResponse.json({ success: true, message: "Senha alterada com sucesso." });
  setNoCacheHeaders(response);
  createAuthCookies(response, accessToken, refreshToken, false);
  return response;
}
