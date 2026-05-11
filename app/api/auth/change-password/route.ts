import { NextRequest, NextResponse } from "next/server";
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

  const response = NextResponse.json({ success: true, message: "Senha alterada com sucesso." });
  setNoCacheHeaders(response);
  createAuthCookies(response, accessToken, refreshToken, false);
  return response;
}
