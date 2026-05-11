import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { sessions } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id } = await params;

  await db.delete(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, guard.user.id)));
  const response = NextResponse.json({ success: true });
  setNoCacheHeaders(response);
  return response;
}
