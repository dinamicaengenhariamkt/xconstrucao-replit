import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getUser, createUser, updateUserPassword, updateUserEmailVerified } from "@features/auth/api/auth-storage";
import { createPasswordResetToken } from "@features/auth/api/auth-service";
import { sendPasswordResetEmail } from "@shared/lib/email";
import { z } from "zod";
import { getBaseUrl, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`forgot:${ip}`, 3, 60 * 60 * 1000)) {
    const response = NextResponse.json(
      { message: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 }
    );
    setNoCacheHeaders(response);
    return response;
  }

  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const response = NextResponse.json(
        { message: "Email inválido" },
        { status: 400 }
      );
      setNoCacheHeaders(response);
      return response;
    }

    const { email } = result.data;

    // Buscar usuário por email
    const user = await getUserByEmail(email);

    // Por questões de segurança, sempre retornar sucesso
    // mesmo se o email não existir (não revelar se email está cadastrado)
    if (!user) {
      const response = NextResponse.json({ success: true });
      setNoCacheHeaders(response);
      return response;
    }

    // Criar token de reset (válido por 15 minutos)
    const token = createPasswordResetToken(user.id, user.email);

    // Criar URL de reset
    const baseUrl = getBaseUrl(request);
    const resetUrl = `${baseUrl}/reset-senha?token=${token}`;

    // Enviar email
    await sendPasswordResetEmail(user.email, resetUrl, user.name);

    const response = NextResponse.json({ success: true });
    setNoCacheHeaders(response);
    return response;
  } catch (error) {
    console.error("Erro ao processar solicitação de reset:", error);
    const response = NextResponse.json(
      { message: "Erro ao processar solicitação. Tente novamente mais tarde." },
      { status: 500 }
    );
    setNoCacheHeaders(response);
    return response;
  }
}
