import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/server/lib/logger";
import { verifyEmailVerificationToken } from "@features/auth/api/auth-service";
import { getUser, getUserByEmail, updateUserEmail } from "@features/auth/api/auth-storage";
import { getBaseUrl } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";

/**
 * Conclui a troca de email (J02): valida o token enviado ao novo endereço e
 * aplica `users.email = token.email`. O token carrega o NOVO email no payload
 * (gerado em `/api/auth/trocar-email`), então a posse da caixa nova já está
 * provada por ter recebido o link. Redireciona para a tela de feedback
 * reaproveitando `/verificar-email` (mesma UX do fluxo de verificação inicial).
 */
export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);

  try {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(new URL("/verificar-email?error=token_missing", baseUrl));
    }

    const result = verifyEmailVerificationToken(token);
    if (!result) {
      return NextResponse.redirect(new URL("/verificar-email?error=token_invalid", baseUrl));
    }

    const user = await getUser(result.userId);
    if (!user) {
      return NextResponse.redirect(new URL("/verificar-email?error=user_not_found", baseUrl));
    }

    const novoEmail = result.email.trim().toLowerCase();

    // Já aplicado (link clicado duas vezes) → idempotente.
    if (user.email.toLowerCase() === novoEmail) {
      return NextResponse.redirect(new URL("/verificar-email?success=email_trocado", baseUrl));
    }

    // Re-check de unicidade no momento da confirmação (alguém pode ter pego o
    // email no intervalo entre a solicitação e o clique).
    const existing = await getUserByEmail(novoEmail);
    if (existing && existing.id !== user.id) {
      return NextResponse.redirect(new URL("/verificar-email?error=email_em_uso", baseUrl));
    }

    await updateUserEmail(user.id, novoEmail, new Date());

    void recordAudit({
      actorId: user.id,
      action: "conta.trocar-email.confirmar",
      targetUserId: user.id,
      payload: { emailAntigo: user.email, novoEmail },
      request,
    });

    return NextResponse.redirect(new URL("/verificar-email?success=email_trocado", baseUrl));
  } catch (err) {
    void logError("error", "[confirmar-novo-email] erro inesperado", { stack: (err as Error)?.stack, route: "/api/auth/confirmar-novo-email" });
    return NextResponse.redirect(new URL("/verificar-email?error=server_error", baseUrl));
  }
}
