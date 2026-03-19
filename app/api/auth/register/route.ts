import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getUserByUsername, getUser, createUser, updateUserPassword, updateUserEmailVerified } from "@features/auth/api/auth-storage";
import { hashPassword, createEmailVerificationToken } from "@features/auth/api/auth-service";
import { registerSchema } from "@features/auth/schemas";
import { sendVerificationEmail } from "@shared/lib/email";
import { getBaseUrl, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`register:${ip}`, 5, 60 * 60 * 1000)) {
    const response = NextResponse.json(
      { message: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 }
    );
    setNoCacheHeaders(response);
    return response;
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const response = NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
      setNoCacheHeaders(response);
      return response;
    }

    const { name, email, username, password, role, phone } = parsed.data;

    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      const response = NextResponse.json({ message: "Email já cadastrado" }, { status: 409 });
      setNoCacheHeaders(response);
      return response;
    }

    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      const response = NextResponse.json({ message: "Nome de usuário já cadastrado" }, { status: 409 });
      setNoCacheHeaders(response);
      return response;
    }

    const hashed = await hashPassword(password);

    // Criar usuário com emailVerified = null
    const user = await createUser({
      name,
      email,
      username,
      password: hashed,
      role,
      phone: phone || null,
      emailVerified: null // Explicitamente null
    });

    // Gerar token de verificação
    const verificationToken = createEmailVerificationToken(user.id, user.email);

    // Construir URL de verificação
    const baseUrl = getBaseUrl(request);
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    // Enviar email de verificação (bloqueante para garantir que foi enviado)
    try {
      await sendVerificationEmail(user.email, verificationUrl, user.name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Ainda retornar sucesso, mas logar o erro
      // Em produção, considere usar fila de emails
    }

    const response = NextResponse.json({
      success: true,
      message: "Conta criada com sucesso! Verifique seu email para ativar.",
      email: user.email
    }, { status: 201 });
    setNoCacheHeaders(response);
    return response;
  } catch (error) {
    console.error("Erro no registro:", error);
    const response = NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
    setNoCacheHeaders(response);
    return response;
  }
}
