import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/server/lib/logger";
import { verifyEmailVerificationToken } from "@features/auth/api/auth-service";
import { getUser, updateUserEmailVerified, ensureProfileRow } from "@features/auth/api/auth-storage";
import { sendWelcomeEmail } from "@shared/lib/email";
import { getBaseUrl } from "@features/auth/api/auth-utils";

export async function GET(request: NextRequest) {
  // Sempre construir redirects a partir da URL pública (NEXTAUTH_URL),
  // não a partir de request.url — atrás do proxy do Replit Deploy o
  // request.url enxerga o host interno (http://0.0.0.0:5000) e quebraria
  // o navegador do usuário (ERR_ADDRESS_INVALID).
  const baseUrl = getBaseUrl(request);

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/verificar-email?error=token_missing", baseUrl)
      );
    }

    const result = verifyEmailVerificationToken(token);

    if (!result) {
      return NextResponse.redirect(
        new URL("/verificar-email?error=token_invalid", baseUrl)
      );
    }

    // Verificar se usuário existe
    const user = await getUser(result.userId);
    if (!user) {
      return NextResponse.redirect(
        new URL("/verificar-email?error=user_not_found", baseUrl)
      );
    }

    // Verificar se email já foi verificado
    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL("/verificar-email?success=already_verified", baseUrl)
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
        void logError("warn", "Falha ao garantir profile row pós-verificação", { stack: (profileErr as Error)?.stack, route: "/api/auth/verify-email" });
      }
    }

    // Email de boas-vindas (best-effort, não quebra o redirect)
    if (user.role === "contratante" || user.role === "empreiteiro") {
      try {
        await sendWelcomeEmail(user.email, user.name, user.role);
      } catch (welcomeErr) {
        void logError("warn", "Falha ao enviar welcome email", { stack: (welcomeErr as Error)?.stack, route: "/api/auth/verify-email" });
      }
    }

    return NextResponse.redirect(
      new URL("/verificar-email?success=verified", baseUrl)
    );
  } catch (error) {
    void logError("error", "Erro ao verificar email", { stack: (error as Error)?.stack, route: "/api/auth/verify-email" });
    return NextResponse.redirect(
      new URL("/verificar-email?error=server_error", baseUrl)
    );
  }
}
