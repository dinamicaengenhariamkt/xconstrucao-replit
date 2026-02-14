import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { createEmailVerificationToken } from "@/server/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: "Email é obrigatório" }, { status: 400 });
    }

    const user = await storage.getUserByEmail(email);

    // Por segurança, sempre retorna sucesso (não revela se email existe)
    if (!user) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Se já verificado, retorna sucesso sem enviar
    if (user.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true }, { status: 200 });
    }

    // Gerar novo token
    const verificationToken = createEmailVerificationToken(user.id, user.email);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    // Enviar email
    try {
      await sendVerificationEmail(user.email, verificationUrl, user.name);
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
      return NextResponse.json({ message: "Erro ao enviar email" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao reenviar verificação:", error);
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
