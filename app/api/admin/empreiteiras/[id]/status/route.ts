import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { recordAudit } from "@features/auth/api/audit";
import { definirStatusEmpreiteira } from "@features/admin/empreiteiras/api/empreiteiras-admin-service";

// Aceita o vocabulário canônico e os aliases legados da UI.
const bodySchema = z.object({
  status: z.enum(["ativo", "inativo", "aprovacao", "ativa", "inativa", "suspensa", "pendente"]),
  motivo: z.string().optional(),
  observacoes: z.string().optional(),
  responsavel: z.string().optional(),
});

function toDbStatus(status: string): "ativo" | "inativo" | "aprovacao" {
  if (status === "ativo" || status === "ativa") return "ativo";
  if (status === "aprovacao" || status === "pendente") return "aprovacao";
  return "inativo"; // inativo | inativa | suspensa
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
  const result = await definirStatusEmpreiteira(id, dbStatus);
  if (!result) return NextResponse.json({ message: "Empreiteira não encontrada" }, { status: 404 });

  await recordAudit({
    actorId: guard.userId,
    targetUserId: result.userId,
    action: dbStatus === "ativo" ? "admin.empreiteira.desbloqueada" : "admin.empreiteira.bloqueada",
    payload: {
      empreiteiraId: id,
      motivo: parsed.data.motivo,
      observacoes: parsed.data.observacoes,
      responsavel: parsed.data.responsavel,
    },
    request,
  });

  return NextResponse.json({ id, status: dbStatus });
}
