import { NextRequest, NextResponse } from "next/server";
import { verifyEmailVerificationToken } from "@features/auth/api/auth-service";
import { getUser, updateUserEmailVerified, ensureProfileRow } from "@features/auth/api/auth-storage";
import { sendWelcomeEmail } from "@shared/lib/email";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/verificar-email?error=token_missing", request.url)
      );
    }

    const result = verifyEmailVerificationToken(token);

    if (!result) {
      return NextResponse.redirect(
        new URL("/verificar-email?error=token_invalid", request.url)
      );
    }

    // Verificar se usuário existe
    const user = await getUser(result.userId);
    if (!user) {
      return NextResponse.redirect(
        new URL("/verificar-email?error=user_not_found", request.url)
      );
    }

    // Verificar se email já foi verificado
    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL("/verificar-email?success=already_verified", request.url)
      );
    }

    // Atualizar emailVerified
    await updateUserEmailVerified(result.userId, new Date());

    // Garantir que a row de domínio existe (rede de segurança para usuários
    // antigos cadastrados antes desta jornada). Idempotente.
    if (user.role === "contratante" || user.role === "empreiteiro") {
      try {
        await ensureProfileRow({ ...user, emailVerified: new Date() });
      } catch (profileErr) {
        console.error("Falha ao garantir profile row pós-verificação:", profileErr);
      }
    }

    // Email de boas-vindas (best-effort, não quebra o redirect)
    if (user.role === "contratante" || user.role === "empreiteiro") {
      try {
        await sendWelcomeEmail(user.email, user.name, user.role);
      } catch (welcomeErr) {
        console.error("Falha ao enviar welcome email:", welcomeErr);
      }
    }

    return NextResponse.redirect(
      new URL("/verificar-email?success=verified", request.url)
    );
  } catch (error) {
    console.error("Erro ao verificar email:", error);
    return NextResponse.redirect(
      new URL("/verificar-email?error=server_error", request.url)
    );
  }
}
