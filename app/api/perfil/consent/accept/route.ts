import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@shared/db/db";
import { userConsents } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getClientIp } from "@features/auth/api/rate-limit";

const schema = z.object({
  versaoTermos: z.string().min(1),
  versaoPrivacidade: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || null;

  await db.insert(userConsents).values([
    {
      userId: guard.user.id,
      documento: "termos",
      versao: parsed.data.versaoTermos,
      ip,
      userAgent,
    },
    {
      userId: guard.user.id,
      documento: "privacidade",
      versao: parsed.data.versaoPrivacidade,
      ip,
      userAgent,
    },
  ]);

  const response = NextResponse.json({ success: true });
  setNoCacheHeaders(response);
  return response;
}
