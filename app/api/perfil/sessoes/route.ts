import { NextRequest, NextResponse } from "next/server";
import { desc, eq, gt } from "drizzle-orm";
import { db } from "@shared/db/db";
import { sessions } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const rows = await db
    .select({
      id: sessions.id,
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
  const active = rows.filter((s) => s.expires > now);

  const response = NextResponse.json({ sessoes: active });
  setNoCacheHeaders(response);
  return response;
}
