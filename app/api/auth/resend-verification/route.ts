import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/server/lib/logger";
import { getUserByEmail } from "@features/auth/api/auth-storage";
import { createEmailVerificationToken } from "@features/auth/api/auth-service";
import { sendVerificationEmail } from "@shared/lib/email";
import { getBaseUrl, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";

function jsonNoStore(payload: unknown, status: number) {
  const response = NextResponse.json(payload, { status });
  setNoCacheHeaders(response);
  return response;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  // Cooldown server-side: até 4 reenvios por hora por IP
  if (isRateLimited(`resend:${ip}`, 4, 60 * 60 * 1000)) {
    return jsonNoStore(
      { message: "Aguarde alguns minutos antes de pedir um novo email." },
      429
    );
  }

  try {
    const { email: rawEmail } = await request.json();

    if (!rawEmail || typeof rawEmail !== "string") {
      return jsonNoStore({ message: "Email é obrigatório" }, 400);
    }
    const email = rawEmail.trim().toLowerCase();

    const user = await getUserByEmail(email);

    // Sempre sucesso (não revela se email existe)
    if (!user) {
      return jsonNoStore({ success: true }, 200);
    }
    if (user.emailVerified) {
      return jsonNoStore({ success: true, alreadyVerified: true }, 200);
    }

    const verificationToken = createEmailVerificationToken(user.id, user.email);
    const baseUrl = getBaseUrl(request);
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    try {
      await sendVerificationEmail(user.email, verificationUrl, user.name);
    } catch (emailError) {
      void logError("warn", "Failed to resend verification email", { stack: (emailError as Error)?.stack, route: "/api/auth/resend-verification" });
      return jsonNoStore({ message: "Erro ao enviar email" }, 500);
    }

    return jsonNoStore({ success: true }, 200);
  } catch (error) {
    void logError("error", "Erro ao reenviar verificação de email", { stack: (error as Error)?.stack, route: "/api/auth/resend-verification" });
    return jsonNoStore({ message: "Erro interno do servidor" }, 500);
  }
}
