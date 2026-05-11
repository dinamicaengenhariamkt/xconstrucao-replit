import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db/db";
import { userConsents } from "@shared/db/schema";
import { getUserByEmail, getUserByUsername, createUserWithProfile } from "@features/auth/api/auth-storage";
import { hashPassword, createEmailVerificationToken } from "@features/auth/api/auth-service";
import { registerSchema } from "@features/auth/schemas";
import { sendVerificationEmail } from "@shared/lib/email";
import { getBaseUrl, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { validateAntiBot } from "@features/auth/api/anti-bot";

const VERSAO_TERMOS = "1.0";
const VERSAO_PRIVACIDADE = "1.0";

const GENERIC_BAD = "Não foi possível processar a solicitação. Tente novamente.";

function jsonNoStore(payload: unknown, status: number) {
  const response = NextResponse.json(payload, { status });
  setNoCacheHeaders(response);
  return response;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return jsonNoStore(
      { message: "Muitas tentativas. Tente novamente em alguns minutos." },
      429
    );
  }

  try {
    const body = await request.json();

    const antiBot = validateAntiBot(body);
    if (!antiBot.ok) {
      return jsonNoStore({ message: GENERIC_BAD }, 400);
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonNoStore(
        { message: "Dados inválidos", errors: parsed.error.flatten() },
        400
      );
    }

    const { name, email, username, password, role, phone } = parsed.data;
    const userAgent = request.headers.get("user-agent") || null;

    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return jsonNoStore({ message: "Email já cadastrado" }, 409);
    }

    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return jsonNoStore({ message: "Nome de usuário já cadastrado" }, 409);
    }

    const hashed = await hashPassword(password);

    const user = await createUserWithProfile({
      name,
      email,
      username,
      password: hashed,
      role,
      phone: phone || null,
      emailVerified: null,
    });

    // Persistir aceite LGPD (termos + privacidade) em user_consents.
    // Se falhar, removemos o usuário recém-criado para manter consistência
    // (cadastro só é considerado válido com aceite LGPD persistido).
    try {
      await db.insert(userConsents).values([
        { userId: user.id, documento: "termos", versao: VERSAO_TERMOS, ip, userAgent },
        { userId: user.id, documento: "privacidade", versao: VERSAO_PRIVACIDADE, ip, userAgent },
      ]);
    } catch (consentError) {
      console.error("Failed to persist consent records:", consentError);
      try {
        const { users } = await import("@shared/db/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(users).where(eq(users.id, user.id));
      } catch (rollbackError) {
        console.error("Failed to rollback user after consent failure:", rollbackError);
      }
      return jsonNoStore(
        { message: "Não foi possível registrar o aceite dos termos. Tente novamente." },
        500
      );
    }

    const verificationToken = createEmailVerificationToken(user.id, user.email);
    const baseUrl = getBaseUrl(request);
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    try {
      await sendVerificationEmail(user.email, verificationUrl, user.name);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return jsonNoStore(
      {
        success: true,
        message: "Conta criada com sucesso! Verifique seu email para ativar.",
        email: user.email,
      },
      201
    );
  } catch (error) {
    console.error("Erro no registro:", error);
    return jsonNoStore({ message: "Erro interno do servidor" }, 500);
  }
}
