import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getUser, createUser, updateUserPassword, updateUserEmailVerified } from "@features/auth/api/auth-storage";
import { verifyPasswordResetToken, hashPassword } from "@features/auth/api/auth-service";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  newPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, newPassword } = result.data;

    // Verificar e decodificar token
    const payload = verifyPasswordResetToken(token);

    if (!payload) {
      return NextResponse.json(
        { message: "Token inválido ou expirado. Solicite um novo link de recuperação." },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    // Atualizar senha no banco
    await updateUserPassword(payload.userId, hashedPassword);

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { message: "Erro ao redefinir senha. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
