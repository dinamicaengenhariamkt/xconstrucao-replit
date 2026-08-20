/**
 * Endpoint test-only: emite cookies access_token + refresh_token para um
 * usuário arbitrário (por email), pulando a verificação de senha e o gate
 * EMAIL_NOT_VERIFIED do /api/auth/login. Usado pelos testes E2E para
 * validar guards downstream (ex.: criar obra) no estado "logado mas com
 * email não verificado".
 *
 * Disponível APENAS quando E2E_TEST_AUTH=1.
 *
 *   POST /api/test/login-as   { email }           → JSON { success, user }
 *   GET  /api/test/login-as?email=...&to=/path    → redireciona com cookies
 *
 * Ambos inserem uma linha em `sessions` (sha256 do refresh token) para que o
 * /api/auth/refresh consiga validar a sessão sem retornar "Sessão revogada".
 *
 * O GET usa secure:false para que os cookies funcionem sobre HTTP (127.0.0.1)
 * nos testes Playwright, onde não há TLS.
 */

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db/db";
import { users, sessions } from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { createAccessToken, createRefreshToken } from "@features/auth/api/auth-service";
import { createAuthCookies } from "@features/auth/api/auth-utils";

function isEnabled(): boolean {
  return process.env.E2E_TEST_AUTH === "1";
}

async function findUser(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
}

/**
 * Em modo de teste, neutraliza os gates de senha e e-mail do usuário-alvo.
 * O propósito do `login-as` é exercitar guards downstream; se o usuário
 * recém-criado fica com `email_verified=null`, o guard retorna 403 e a suíte
 * passa a testar confirmação de e-mail por acidente, não a funcionalidade
 * solicitada. Só roda sob E2E_TEST_AUTH=1.
 */
async function ensureTestUserGates(
  user: NonNullable<Awaited<ReturnType<typeof findUser>>>,
): Promise<void> {
  if (user.mustChangePassword || !user.emailVerified) {
    await db
      .update(users)
      .set({
        ...(user.mustChangePassword ? { mustChangePassword: false } : {}),
        ...(!user.emailVerified ? { emailVerified: new Date() } : {}),
      })
      .where(eq(users.id, user.id));
  }
}

function buildAccessToken(user: NonNullable<Awaited<ReturnType<typeof findUser>>>) {
  return createAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    image: user.image ?? null,
    avatarUrl: user.avatarUrl ?? null,
    // Espelha `montarUserData` (session-issuer): sem estas claims o token de
    // teste divergiria do token real — um admin de escopo restrito seria tratado
    // como global e os guards passariam a testar o cenário errado.
    canManageUsers: user.role === "superadmin" ? true : (user.canManageUsers ?? false),
    adminEscopo: user.role === "superadmin" ? "global" : (user.adminEscopo ?? "global"),
  });
}

async function issueSession(user: NonNullable<Awaited<ReturnType<typeof findUser>>>) {
  const accessToken = buildAccessToken(user);
  const refreshToken = createRefreshToken(user.id, false);

  const sessionToken = createHash("sha256").update(refreshToken).digest("hex");
  await db.insert(sessions).values({
    sessionToken,
    userId: user.id,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: "playwright-e2e",
    ip: "127.0.0.1",
    lastUsedAt: new Date(),
  }).onConflictDoNothing();

  return { accessToken, refreshToken };
}

/** GET /api/test/login-as?email=...&to=/contratante/nova-obra
 * Sets cookies without secure:true so they work over HTTP in Playwright.
 * Uses Host header for redirect so cookie domain matches.
 */
export async function GET(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.toLowerCase().trim();
  const to = searchParams.get("to") ?? "/";

  if (!email) {
    return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });
  }

  const user = await findUser(email);
  if (!user) {
    return NextResponse.json({ error: "user não encontrado" }, { status: 404 });
  }

  await ensureTestUserGates(user);
  const { accessToken, refreshToken } = await issueSession(user);

  const host = request.headers.get("host") ?? "127.0.0.1:5000";
  const response = NextResponse.redirect(`http://${host}${to}`);

  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}

/** POST /api/test/login-as  { email }  → JSON (used by API-only tests) */
export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });
  }

  const user = await findUser(email);
  if (!user) {
    return NextResponse.json({ error: "user não encontrado" }, { status: 404 });
  }

  await ensureTestUserGates(user);
  const { accessToken, refreshToken } = await issueSession(user);

  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
  });
  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
