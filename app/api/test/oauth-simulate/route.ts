/**
 * Endpoint test-only que simula o resultado de um login Google bem-sucedido
 * (sem chamar Google de verdade). Disponível APENAS quando E2E_TEST_AUTH=1.
 *
 * Cria/atualiza o usuário no banco como o DrizzleAdapter faria (role default
 * = "contratante", emailVerified=null inicialmente) e devolve um cookie
 * NextAuth `next-auth.session-token` válido — exatamente como após o callback
 * OAuth. Combinado com o cookie `x_signup_persona` setado pela landing,
 * permite testar `/api/auth/oauth-convert` end-to-end.
 *
 *   POST /api/test/oauth-simulate
 *   { email, name }
 */

import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { eq } from "drizzle-orm";

function isEnabled(): boolean {
  return process.env.E2E_TEST_AUTH === "1";
}

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json(
      { error: "E2E_TEST_AUTH não está habilitado neste ambiente." },
      { status: 404 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
  };
  const email = body.email?.toLowerCase().trim();
  const name = body.name?.trim() || "Usuário Teste OAuth";

  if (!email) {
    return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });
  }

  // Simula o que o DrizzleAdapter faria: insere user com role default (contratante)
  // e SEM emailVerified (o oauth-convert / signIn callback é quem deve marcar).
  let [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    const [created] = await db
      .insert(users)
      .values({ email, name, role: "contratante" })
      .returning();
    user = created;
  }

  // NextAuth v5 lê AUTH_SECRET por padrão; nosso env usa NEXTAUTH_SECRET,
  // então passamos explicitamente. salt deve casar com o nome do cookie
  // (vide auth.config.ts -> sessionToken.name).
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "NEXTAUTH_SECRET ausente — não consigo assinar a sessão de teste." },
      { status: 500 }
    );
  }

  const sessionToken = await encode({
    salt: "next-auth.session-token",
    secret,
    token: {
      id: user.id,
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      picture: user.image ?? null,
    },
    maxAge: 60 * 60, // 1h é suficiente para o teste
  });

  const response = NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });

  response.cookies.set("next-auth.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: true,
    maxAge: 60 * 60,
  });

  return response;
}

export async function DELETE(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  const email = request.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });
  }
  await db.delete(users).where(eq(users.email, email));
  return NextResponse.json({ success: true });
}
