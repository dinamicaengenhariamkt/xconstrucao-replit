import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import {
  toggleDestaque,
  LIMITE_DESTAQUES,
} from "@features/admin/obras-destaque/api/obras-destaque-service";

const patchSchema = z.object({
  destaque: z.boolean(),
  ordem: z.number().int().nullable().optional(),
  fotoCapaFileId: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const result = await toggleDestaque({
    obraId: id,
    destaque: parsed.data.destaque,
    ordem: parsed.data.ordem ?? null,
    fotoCapaFileId: parsed.data.fotoCapaFileId ?? null,
  });

  if (result.kind === "not_found") {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (result.kind === "limit") {
    const r = NextResponse.json(
      {
        error: "LIMITE_DESTAQUES",
        message: `Máximo de ${LIMITE_DESTAQUES} obras em destaque. Desative uma para destacar outra.`,
      },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  if (result.kind === "invalid_capa") {
    const r = NextResponse.json(
      {
        error: "CAPA_INVALIDA",
        message: "Selecione uma foto da própria obra como capa do destaque.",
      },
      { status: 422 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  await recordAudit({
    actorId: guard.userId,
    action: "admin.obra.destaque.toggle",
    payload: {
      obraId: id,
      destaque: parsed.data.destaque,
      ordem: parsed.data.ordem ?? null,
      fotoCapaFileId: parsed.data.fotoCapaFileId ?? null,
    },
    request,
  });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
