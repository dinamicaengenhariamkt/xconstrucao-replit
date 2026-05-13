import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@shared/db/db";
import { empreiteiroPortfolio, userFiles } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "empreiteiro" && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const rows = await db
    .select({
      id: empreiteiroPortfolio.id,
      fileId: empreiteiroPortfolio.fileId,
      titulo: empreiteiroPortfolio.titulo,
      ordem: empreiteiroPortfolio.ordem,
      createdAt: empreiteiroPortfolio.createdAt,
      kind: userFiles.kind,
      mime: userFiles.mime,
      sizeBytes: userFiles.sizeBytes,
      originalName: userFiles.originalName,
      publicUrl: userFiles.publicUrl,
    })
    .from(empreiteiroPortfolio)
    .innerJoin(userFiles, eq(userFiles.id, empreiteiroPortfolio.fileId))
    .where(
      and(
        eq(empreiteiroPortfolio.empreiteiroUserId, guard.user.id),
        isNull(userFiles.deletedAt),
      ),
    )
    .orderBy(asc(empreiteiroPortfolio.ordem), asc(empreiteiroPortfolio.createdAt));

  const r = NextResponse.json({ items: rows });
  setNoCacheHeaders(r);
  return r;
}

const patchSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        titulo: z.string().max(120).optional(),
        ordem: z.number().int().min(0).max(999).optional(),
      }),
    )
    .min(1)
    .max(60),
});

export async function PATCH(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "empreiteiro" && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const ids = parsed.data.items.map((i) => i.id);
  const owned = await db
    .select({ id: empreiteiroPortfolio.id })
    .from(empreiteiroPortfolio)
    .where(
      and(
        eq(empreiteiroPortfolio.empreiteiroUserId, guard.user.id),
        inArray(empreiteiroPortfolio.id, ids),
      ),
    );
  const ownedIds = new Set(owned.map((o) => o.id));

  for (const item of parsed.data.items) {
    if (!ownedIds.has(item.id)) continue;
    const updates: Record<string, unknown> = {};
    if (typeof item.titulo === "string") updates.titulo = item.titulo;
    if (typeof item.ordem === "number") updates.ordem = item.ordem;
    if (Object.keys(updates).length === 0) continue;
    await db.update(empreiteiroPortfolio).set(updates).where(eq(empreiteiroPortfolio.id, item.id));
  }

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
