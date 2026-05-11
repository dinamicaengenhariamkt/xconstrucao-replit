import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@shared/db/db";
import { userConsents } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders, clearAuthCookies } from "@features/auth/api/auth-utils";

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  await db
    .update(userConsents)
    .set({ revogadoEm: new Date() })
    .where(and(eq(userConsents.userId, guard.user.id), isNull(userConsents.revogadoEm)));

  const response = NextResponse.json({ success: true, message: "Consentimento revogado." });
  setNoCacheHeaders(response);
  clearAuthCookies(response);
  return response;
}
