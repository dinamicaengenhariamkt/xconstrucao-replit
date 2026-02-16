import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getUser, createUser, updateUserPassword, updateUserEmailVerified } from "@features/auth/api/auth-storage";
import { createEmailVerificationToken } from "@features/auth/api/auth-service";
import { sendVerificationEmail } from "@shared/lib/email";
import { getBaseUrl, setNoCacheHeaders } from "@features/auth/api/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      const response = NextResponse.json({ message: "Email é obrigatório" }, { status: 400 });
      setNoCacheHeaders(response);
      return response;
    }

    const user = await getUserByEmail(email);

    // Por segurança, sempre retorna sucesso (não revela se email existe)
    if (!user) {
      const response = NextResponse.json({ success: true }, { status: 200 });
      setNoCacheHeaders(response);
      return response;
    }

    // Se já verificado, retorna sucesso sem enviar
    if (user.emailVerified) {
      const response = NextResponse.json({ success: true, alreadyVerified: true }, { status: 200 });
      setNoCacheHeaders(response);
      return response;
    }

    // Gerar novo token
    const verificationToken = createEmailVerificationToken(user.id, user.email);
    const baseUrl = getBaseUrl(request);
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    // Enviar email
    try {
      await sendVerificationEmail(user.email, verificationUrl, user.name);
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
      const response = NextResponse.json({ message: "Erro ao enviar email" }, { status: 500 });
      setNoCacheHeaders(response);
      return response;
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    setNoCacheHeaders(response);
    return response;
  } catch (error) {
    console.error("Erro ao reenviar verificação:", error);
    const response = NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
    setNoCacheHeaders(response);
    return response;
  }
}
