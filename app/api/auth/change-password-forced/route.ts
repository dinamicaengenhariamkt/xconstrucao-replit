import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import {
  hashPassword,
  createAccessToken,
  createRefreshToken,
} from "@features/auth/api/auth-service";
import { evaluatePasswordPolicy } from "@features/auth/schemas/password";
import { requireVerifiedUser, createAuthCookies, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";

const schema = z.object({
  newPassword: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação obrigatória"),
});

function jsonNoStore(payload: unknown, status: number) {
  const r = NextResponse.json(payload, { status });
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const user = guard.user;

  if (guard.impersonation) {
    return jsonNoStore({ message: "Não é possível trocar senha em modo Ver como." }, 403);
  }

  if (!user.mustChangePassword) {
    return jsonNoStore({ message: "Esta conta não exige troca de senha." }, 400);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonNoStore({ message: parsed.error.errors[0].message }, 400);

  const { newPassword, confirmPassword } = parsed.data;
  if (newPassword !== confirmPassword) {
    return jsonNoStore({ message: "A confirmação não confere com a nova senha." }, 400);
  }
  const policy = evaluatePasswordPolicy(newPassword, {
    email: user.email,
    name: user.name,
    username: user.username || undefined,
  });
  if (!policy.valid) return jsonNoStore({ message: policy.message }, 400);

  const hashed = await hashPassword(newPassword);
  await db.update(users).set({ password: hashed, mustChangePassword: false }).where(eq(users.id, user.id));

  await recordAudit({
    actorId: user.id,
    targetUserId: user.id,
    action: "user.change-password-forced",
    request,
  });

  const accessToken = createAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    image: user.image,
    avatarUrl: user.avatarUrl,
  });
  const refreshToken = createRefreshToken(user.id, false);

  const response = jsonNoStore({ success: true }, 200);
  createAuthCookies(response, accessToken, refreshToken, false);
  return response;
}
