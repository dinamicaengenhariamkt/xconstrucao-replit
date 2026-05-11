import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@shared/db/db";
import { platformSettings } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";

async function adminGuard(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return { error: guard.error as NextResponse };
  if (guard.user.role !== "admin") {
    const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    setNoCacheHeaders(r);
    return { error: r };
  }
  return { user: guard.user };
}

async function loadIntegracoes() {
  const [row] = await db.select().from(platformSettings).where(eq(platformSettings.chave, "integracoes"));
  return ((row?.valor as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
}

async function saveIntegracoes(valor: Record<string, unknown>, userId: string) {
  await db
    .insert(platformSettings)
    .values({ chave: "integracoes", valor, updatedBy: userId })
    .onConflictDoUpdate({
      target: platformSettings.chave,
      set: { valor, updatedAt: sql`now()`, updatedBy: userId },
    });
}

type ApiKeyMeta = { keyHash?: string; last4?: string; createdAt?: string; lastUsedAt?: string | null };

export async function GET(request: NextRequest) {
  const g = await adminGuard(request);
  if ("error" in g) return g.error;
  const cur = await loadIntegracoes();
  const apiKey = (cur.apiKey as ApiKeyMeta | undefined) ?? null;
  const r = NextResponse.json({
    hasKey: !!apiKey?.last4,
    last4: apiKey?.last4 ?? null,
    createdAt: apiKey?.createdAt ?? null,
    lastUsedAt: apiKey?.lastUsedAt ?? null,
  });
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest) {
  const g = await adminGuard(request);
  if ("error" in g) return g.error;
  const plaintext = `sk-live-${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(plaintext).digest("hex");
  const last4 = plaintext.slice(-4);
  const createdAt = new Date().toISOString();
  const cur = await loadIntegracoes();
  const merged = { ...cur, apiKey: { keyHash, last4, createdAt, lastUsedAt: null } };
  await saveIntegracoes(merged, g.user.id);
  const r = NextResponse.json({ plaintext, last4, createdAt });
  setNoCacheHeaders(r);
  return r;
}

export async function DELETE(request: NextRequest) {
  const g = await adminGuard(request);
  if ("error" in g) return g.error;
  const cur = await loadIntegracoes();
  const next: Record<string, unknown> = { ...cur };
  delete next.apiKey;
  await saveIntegracoes(next, g.user.id);
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
