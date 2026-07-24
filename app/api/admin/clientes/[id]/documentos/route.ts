import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { recordAudit } from "@features/auth/api/audit";
import {
  criarDocumentoDoCliente,
  listarDocumentosDoCliente,
  removerDocumentoDoCliente,
} from "@features/admin/clientes/api/clientes-admin-service";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  return NextResponse.json(await listarDocumentosDoCliente(id));
}

const createSchema = z.object({
  /** `userFiles.id` devolvido por POST /api/uploads/commit (kind=cliente_documento). */
  fileId: z.string().min(1),
  nome: z.string().trim().min(1).max(160),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await criarDocumentoDoCliente({
    clienteId: id,
    fileId: parsed.data.fileId,
    nome: parsed.data.nome,
    uploadedBy: guard.userId,
  });
  if (!result.ok) {
    const status = result.reason === "CLIENTE_NAO_ENCONTRADO" ? 404 : 400;
    return NextResponse.json({ message: result.reason }, { status });
  }

  await recordAudit({
    actorId: guard.userId,
    action: "admin.cliente.documento.anexado",
    targetUserId: null,
    payload: { clienteId: id, fileId: parsed.data.fileId, nome: parsed.data.nome },
    request,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const documentoId = new URL(request.url).searchParams.get("documentoId");
  if (!documentoId) {
    return NextResponse.json({ message: "documentoId é obrigatório" }, { status: 400 });
  }

  const result = await removerDocumentoDoCliente({ clienteId: id, documentoId });
  if (!result.ok) {
    return NextResponse.json({ message: "Documento não encontrado" }, { status: 404 });
  }

  await recordAudit({
    actorId: guard.userId,
    action: "admin.cliente.documento.removido",
    targetUserId: null,
    payload: { clienteId: id, documentoId },
    request,
  });

  return NextResponse.json({ ok: true });
}
