import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { createPasswordResetToken } from "@/server/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Email inválido" },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Buscar usuário por email
    const user = await storage.getUserByEmail(email);

    // Por questões de segurança, sempre retornar sucesso
    // mesmo se o email não existir (não revelar se email está cadastrado)
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Criar token de reset (válido por 15 minutos)
    const token = createPasswordResetToken(user.id, user.email);

    // Criar URL de reset
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:5000";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
    const resetUrl = `${baseUrl}/reset-senha?token=${token}`;

    // Enviar email
    await sendPasswordResetEmail(user.email, resetUrl, user.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao processar solicitação de reset:", error);
    return NextResponse.json(
      { message: "Erro ao processar solicitação. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
