import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().max(30).optional().nullable(),
  avatarUrl: z.string().max(2_500_000).optional().nullable(),
  bio: z.string().max(400).optional().nullable(),
  idioma: z.string().max(16).optional(),
  timezone: z.string().max(64).optional(),
});

function publicUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone ?? null,
    avatarUrl: u.avatarUrl ?? null,
    bio: u.bio ?? null,
    idioma: u.idioma ?? "pt-BR",
    timezone: u.timezone ?? "America/Sao_Paulo",
  };
}

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "admin") {
    const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const r = NextResponse.json(publicUser(guard.user));
  setNoCacheHeaders(r);
  return r;
}

export async function PATCH(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "admin") {
    const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const [updated] = await db
    .update(users)
    .set(parsed.data)
    .where(eq(users.id, guard.user.id))
    .returning();

  const r = NextResponse.json(publicUser(updated));
  setNoCacheHeaders(r);
  return r;
}
