import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { userFiles } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { createSignedReadUrl } from "@shared/lib/storage";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const sp = new URL(request.url).searchParams;
  const key = sp.get("key");
  const id = sp.get("id");
  if (!key && !id) {
    const r = NextResponse.json({ message: "key ou id obrigatório" }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const [file] = key
    ? await db.select().from(userFiles).where(eq(userFiles.bucketKey, key))
    : await db.select().from(userFiles).where(eq(userFiles.id, id!));
  if (!file || file.deletedAt) {
    const r = NextResponse.json({ message: "Arquivo não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Apenas o dono ou super admin pode assinar.
  if (file.ownerUserId !== guard.user.id && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  if (file.visibility === "public" && file.publicUrl) {
    const r = NextResponse.json({ url: file.publicUrl, signed: false });
    setNoCacheHeaders(r);
    return r;
  }

  const url = await createSignedReadUrl({ key: file.bucketKey, filename: file.originalName });
  const r = NextResponse.json({ url, signed: true, expiresIn: 15 * 60 });
  setNoCacheHeaders(r);
  return r;
}
