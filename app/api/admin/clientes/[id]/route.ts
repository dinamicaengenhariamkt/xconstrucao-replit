import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { recordAudit } from "@features/auth/api/audit";
import { obterClienteAdmin, editarClienteAdmin } from "@features/admin/clientes/api/clientes-admin-service";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const cliente = await obterClienteAdmin(id);
  if (!cliente) return NextResponse.json({ message: "Cliente não encontrado" }, { status: 404 });
  return NextResponse.json(cliente);
}

const editarClienteSchema = z.object({
  tipo: z.enum(["pessoa_fisica", "pessoa_juridica"]),
  nome: z.string().min(3),
  cpfCnpj: z.string().min(11),
  email: z.string().email(),
  telefone: z.string().min(10),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const parsed = editarClienteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
  }

  const ok = await editarClienteAdmin(id, parsed.data);
  if (!ok) return NextResponse.json({ message: "Cliente não encontrado" }, { status: 404 });

  await recordAudit({
    actorId: guard.userId,
    action: "admin.cliente.editado",
    payload: { clienteId: id },
    request,
  });
  const cliente = await obterClienteAdmin(id);
  return NextResponse.json(cliente);
}
