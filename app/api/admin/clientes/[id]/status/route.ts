import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { recordAudit } from "@features/auth/api/audit";
import { definirStatusCliente } from "@features/admin/clientes/api/clientes-admin-service";

// A UI envia o status-alvo do cliente. Normalizamos para o enum do banco.
const bodySchema = z.object({
  status: z.enum(["ativo", "inativo", "pendente", "aprovacao"]),
  motivo: z.string().optional(),
  observacoes: z.string().optional(),
  responsavel: z.string().optional(),
});

function toDbStatus(status: string): "ativo" | "inativo" | "aprovacao" {
  if (status === "ativo") return "ativo";
  if (status === "aprovacao" || status === "pendente") return "aprovacao";
  return "inativo";
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const dbStatus = toDbStatus(parsed.data.status);
  const result = await definirStatusCliente(id, dbStatus);
  if (!result) return NextResponse.json({ message: "Cliente não encontrado" }, { status: 404 });

  // Audita bloqueio/desbloqueio (fonte do historicoBloqueios na leitura).
  await recordAudit({
    actorId: guard.userId,
    targetUserId: result.userId,
    action: dbStatus === "ativo" ? "admin.cliente.desbloqueado" : "admin.cliente.bloqueado",
    payload: {
      clienteId: id,
      motivo: parsed.data.motivo,
      observacoes: parsed.data.observacoes,
      responsavel: parsed.data.responsavel,
    },
    request,
  });

  return NextResponse.json({ id, status: dbStatus });
}
