import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { logError } from "@/server/lib/logger";
import { verifyAccessToken } from "@/server/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`client-error:${ip}`, 20, 60_000)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.slice(0, 2000) : "Client error";
    const stack = typeof body.stack === "string" ? body.stack.slice(0, 8000) : undefined;
    const route = typeof body.route === "string" ? body.route.slice(0, 500) : undefined;
    const meta = body.meta && typeof body.meta === "object" ? body.meta : undefined;

    // Tenta extrair userId do cookie JWT (opcional — não requer autenticação)
    let userId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("access_token")?.value;
      if (token) {
        const payload = verifyAccessToken(token);
        userId = payload?.sub ?? null;
      }
    } catch {
      // Sem autenticação — log anônimo, ok
    }

    await logError("error", message, { stack, route, userId, meta, source: "client" });
  } catch {
    // Erro no próprio endpoint de log — não levar para o cliente
  }

  return NextResponse.json({ ok: true });
}
