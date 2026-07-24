import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { recordAudit } from "@features/auth/api/audit";
import {
  listarObrasDoCliente,
  editarObraDoCliente,
} from "@features/admin/clientes/api/clientes-admin-service";
import { dispararSurveyObraConcluida } from "@features/surveys/triggers";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  return NextResponse.json(await listarObrasDoCliente(id));
}

const patchObraSchema = z.object({
  obraId: z.string().min(1),
  // Espelha `obraStatusEnum` do schema.
  status: z.enum(["em_andamento", "concluida", "pausada", "planejamento"]),
  previsaoFim: z.string().max(40).nullable(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const parsed = patchObraSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
  }

  const ok = await editarObraDoCliente({
    clienteId: id,
    obraId: parsed.data.obraId,
    status: parsed.data.status,
    previsaoFim: parsed.data.previsaoFim?.trim() || null,
  });
  if (!ok) return NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });

  // J20 — se o admin concluiu a obra, dispara NPS. Idempotente (unique de origem).
  if (parsed.data.status === "concluida") {
    void dispararSurveyObraConcluida(parsed.data.obraId);
  }

  await recordAudit({
    actorId: guard.userId,
    action: "obras.admin.editada",
    payload: { obraId: parsed.data.obraId, clienteId: id, status: parsed.data.status },
    request,
  });

  return NextResponse.json(await listarObrasDoCliente(id));
}
