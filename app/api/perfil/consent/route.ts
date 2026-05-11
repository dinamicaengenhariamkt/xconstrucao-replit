import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@shared/db/db";
import { userConsents } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const rows = await db
    .select()
    .from(userConsents)
    .where(eq(userConsents.userId, guard.user.id))
    .orderBy(desc(userConsents.aceitoEm));

  const response = NextResponse.json({ consents: rows });
  setNoCacheHeaders(response);
  return response;
}
