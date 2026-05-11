import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { userPreferencias } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";

const prefsSchema = z.object({
  notificacoes: z.record(z.boolean()).optional(),
  privacidade: z.record(z.boolean()).optional(),
});

const DEFAULTS = { notificacoes: {}, privacidade: {} };

async function loadOrInit(userId: string) {
  const [row] = await db.select().from(userPreferencias).where(eq(userPreferencias.userId, userId));
  if (row) return row;
  await db
    .insert(userPreferencias)
    .values({ userId, ...DEFAULTS })
    .onConflictDoNothing({ target: userPreferencias.userId });
  const [created] = await db.select().from(userPreferencias).where(eq(userPreferencias.userId, userId));
  return created;
}

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const row = await loadOrInit(guard.user.id);
  const response = NextResponse.json(row);
  setNoCacheHeaders(response);
  return response;
}

export async function PATCH(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const body = await request.json().catch(() => ({}));
  const parsed = prefsSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const existing = await loadOrInit(guard.user.id);
  const merged = {
    notificacoes: { ...(existing.notificacoes ?? {}), ...(parsed.data.notificacoes ?? {}) },
    privacidade: { ...(existing.privacidade ?? {}), ...(parsed.data.privacidade ?? {}) },
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(userPreferencias)
    .set(merged)
    .where(eq(userPreferencias.userId, guard.user.id))
    .returning();

  const response = NextResponse.json(updated);
  setNoCacheHeaders(response);
  return response;
}
