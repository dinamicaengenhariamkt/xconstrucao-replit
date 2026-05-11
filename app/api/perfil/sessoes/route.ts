import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { sessions } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const cookieHeader = request.headers.get("cookie");
  const refreshMatch = cookieHeader?.match(/(?:^|; )refresh_token=([^;]+)/);
  const refreshToken = refreshMatch ? decodeURIComponent(refreshMatch[1]) : null;
  const currentToken = refreshToken
    ? createHash("sha256").update(refreshToken).digest("hex")
    : null;

  const rows = await db
    .select({
      id: sessions.id,
      sessionToken: sessions.sessionToken,
      userAgent: sessions.userAgent,
      ip: sessions.ip,
      lastUsedAt: sessions.lastUsedAt,
      createdAt: sessions.createdAt,
      expires: sessions.expires,
    })
    .from(sessions)
    .where(eq(sessions.userId, guard.user.id))
    .orderBy(desc(sessions.lastUsedAt));

  const now = new Date();
  const active = rows
    .filter((s) => s.expires > now)
    .map(({ sessionToken, ...rest }) => ({
      ...rest,
      current: currentToken !== null && sessionToken === currentToken,
    }));

  const response = NextResponse.json({ sessoes: active });
  setNoCacheHeaders(response);
  return response;
}
