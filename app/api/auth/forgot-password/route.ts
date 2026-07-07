import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/server/lib/logger";
import { getUserByEmail } from "@features/auth/api/auth-storage";
import { createPasswordResetToken } from "@features/auth/api/auth-service";
import { sendPasswordResetEmail } from "@shared/lib/email";
import { forgotPasswordSchema } from "@features/auth/schemas";
import { getBaseUrl, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { validateAntiBot } from "@features/auth/api/anti-bot";

function jsonNoStore(payload: unknown, status: number) {
  const response = NextResponse.json(payload, { status });
  setNoCacheHeaders(response);
  return response;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`forgot:${ip}`, 3, 60 * 60 * 1000)) {
    return jsonNoStore(
      { message: "Muitas tentativas. Tente novamente em alguns minutos." },
      429
    );
  }

  try {
    const body = await request.json();

    const antiBot = validateAntiBot(body);
    if (!antiBot.ok) {
      // 400 genérico — alinhado ao comportamento das outras rotas públicas.
      // A UX em forgot-password já é "sucesso silencioso" para email inexistente,
      // então o cliente exibe a mesma mensagem neutra independentemente do status.
      return jsonNoStore({ message: "Não foi possível processar a solicitação." }, 400);
    }

    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return jsonNoStore({ message: "Email inválido" }, 400);
    }

    const { email } = result.data;
    const user = await getUserByEmail(email);

    // Sempre devolvemos sucesso (não revelamos se email está cadastrado).
    if (!user) {
      return jsonNoStore({ success: true }, 200);
    }

    const token = createPasswordResetToken(user.id, user.email);
    const baseUrl = getBaseUrl(request);
    const resetUrl = `${baseUrl}/reset-senha?token=${token}`;

    await sendPasswordResetEmail(user.email, resetUrl, user.name);

    return jsonNoStore({ success: true }, 200);
  } catch (error) {
    void logError("error", "Erro ao processar solicitação de reset de senha", { stack: (error as Error)?.stack, route: "/api/auth/forgot-password" });
    return jsonNoStore(
      { message: "Erro ao processar solicitação. Tente novamente mais tarde." },
      500
    );
  }
}
