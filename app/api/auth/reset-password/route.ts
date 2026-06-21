import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/server/lib/logger";
import { getUser, updateUserPassword } from "@features/auth/api/auth-storage";
import { verifyPasswordResetToken, hashPassword } from "@features/auth/api/auth-service";
import { evaluatePasswordPolicy } from "@features/auth/schemas/password";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  newPassword: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
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

    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      return NextResponse.json(
        { message: "Token inválido ou expirado. Solicite um novo link de recuperação." },
        { status: 400 }
      );
    }

    // Buscar usuário para validar contexto (email/nome) na política de senha
    const user = await getUser(payload.userId);
    const policy = evaluatePasswordPolicy(newPassword, {
      email: user?.email ?? undefined,
      name: user?.name ?? undefined,
      username: user?.username ?? undefined,
    });
    if (!policy.valid) {
      return NextResponse.json(
        { message: policy.message ?? "Senha inválida." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    await updateUserPassword(payload.userId, hashedPassword);

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso!",
    });
  } catch (error) {
    void logError("error", "Erro ao redefinir senha", { stack: (error as Error)?.stack, route: "/api/auth/reset-password" });
    return NextResponse.json(
      { message: "Erro ao redefinir senha. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
