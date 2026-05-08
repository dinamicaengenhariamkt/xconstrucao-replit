/**
 * Endpoint test-only: emite cookies access_token + refresh_token para um
 * usuário arbitrário (por email), pulando a verificação de senha e o gate
 * EMAIL_NOT_VERIFIED do /api/auth/login. Usado pelos testes E2E para
 * validar guards downstream (ex.: criar obra) no estado "logado mas com
 * email não verificado".
 *
 * Disponível APENAS quando E2E_TEST_AUTH=1.
 *
 *   POST /api/test/login-as
 *   { email }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { createAccessToken, createRefreshToken } from "@features/auth/api/auth-service";
import { createAuthCookies } from "@features/auth/api/auth-utils";

function isEnabled(): boolean {
  return process.env.E2E_TEST_AUTH === "1";
}

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    return NextResponse.json({ error: "user não encontrado" }, { status: 404 });
  }

  const accessToken = createAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    image: user.image ?? null,
    avatarUrl: user.avatarUrl ?? null,
  });
  const refreshToken = createRefreshToken(user.id, false);

  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
  });
  createAuthCookies(response, accessToken, refreshToken, false);
  return response;
}
