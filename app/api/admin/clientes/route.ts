import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { recordAudit } from "@features/auth/api/audit";
import { listarClientesAdmin, criarClienteAdmin } from "@features/admin/clientes/api/clientes-admin-service";

export async function GET(request: NextRequest) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const clientes = await listarClientesAdmin();
  return NextResponse.json(clientes);
}

const novoClienteSchema = z.object({
  tipo: z.enum(["pessoa_fisica", "pessoa_juridica"]),
  nome: z.string().min(3),
  cpfCnpj: z.string().min(11),
  email: z.string().email(),
  telefone: z.string().min(10),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const parsed = novoClienteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await criarClienteAdmin(parsed.data);
  await recordAudit({
    actorId: guard.userId,
    action: "admin.cliente.criado",
    payload: { clienteId: id, nome: parsed.data.nome },
    request,
  });
  return NextResponse.json({ id }, { status: 201 });
}
