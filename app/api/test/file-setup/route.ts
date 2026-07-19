/**
 * Endpoint test-only: cria uma linha `user_files` canônica SEM depender do R2.
 *
 * Os fluxos de anexo/foto/documento/portfólio/criativo (obras, perfil, anúncios)
 * só precisam de um `fileId` válido e já commitado para testar a LÓGICA DE VÍNCULO
 * — não o upload em si. Este endpoint gera a `bucketKey` canônica via `buildKey`
 * (a mesma que `validateKeyForOwner` no /commit aceitaria) e insere a linha
 * diretamente, desacoplando os testes do storage real (que exige secrets R2).
 *
 * Para testar presign→PUT→commit de ponta a ponta (o upload em si), use o spec
 * dedicado `uploads.integration.spec.ts` com o stub de storage — não este atalho.
 *
 * Disponível APENAS quando E2E_TEST_AUTH=1 (hard-deny em produção).
 *
 *   POST /api/test/file-setup
 *     { email, kind, originalName?, mime?, size?, extras?: { tipoDocumento? } }
 *     → JSON { fileId, key, kind, visibility, ownerUserId }
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { userFiles, users } from "@shared/db/schema";
import {
  buildKey,
  visibilityForKind,
  publicUrlForKey,
  isStorageConfigured,
  type UploadKind,
} from "@shared/lib/storage";

function isEnabled(): boolean {
  return process.env.E2E_TEST_AUTH === "1";
}

const VALID_KINDS: UploadKind[] = [
  "avatar",
  "portfolio_imagem",
  "portfolio_doc",
  "empreiteiro_documento",
  "obra_anexo",
  "obra_capa",
  "comprovante_pagamento",
  "candidatura_anexo",
  "obra_foto",
  "anuncio_criativo",
];

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    kind?: string;
    originalName?: string;
    mime?: string;
    size?: number;
    extras?: { tipoDocumento?: string };
  };

  const {
    email,
    kind,
    originalName = "arquivo-e2e.pdf",
    mime = "application/pdf",
    size = 1024,
    extras,
  } = body;

  if (!email || !kind) {
    return NextResponse.json({ error: "email e kind são obrigatórios" }, { status: 400 });
  }
  if (!VALID_KINDS.includes(kind as UploadKind)) {
    return NextResponse.json({ error: `kind inválido: ${kind}` }, { status: 400 });
  }

  const [user] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "user não encontrado" }, { status: 404 });
  }

  const role = user.role as "admin" | "contratante" | "empreiteiro" | "superadmin" | "anunciante";
  const key = buildKey({ kind: kind as UploadKind, role, userId: user.id, originalName, extras });
  const visibility = visibilityForKind(kind as UploadKind);
  // `publicUrlForKey` exige config R2 (throws sem os secrets). No ambiente E2E o
  // storage costuma estar ausente — usamos um placeholder determinístico para
  // não acoplar este atalho ao R2 real.
  const publicUrl =
    visibility === "public"
      ? isStorageConfigured()
        ? publicUrlForKey(key)
        : `https://e2e.local/${key}`
      : null;

  const [file] = await db
    .insert(userFiles)
    .values({
      ownerUserId: user.id,
      kind,
      visibility,
      bucketKey: key,
      originalName,
      mime,
      sizeBytes: size,
      publicUrl,
    })
    .returning({ id: userFiles.id });

  return NextResponse.json({
    fileId: file.id,
    key,
    kind,
    visibility,
    ownerUserId: user.id,
  });
}
