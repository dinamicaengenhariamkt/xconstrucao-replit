import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { recordAudit } from "@features/auth/api/audit";
import {
  listarEmpreiteirasAdmin,
  criarEmpreiteiraAdmin,
} from "@features/admin/empreiteiras/api/empreiteiras-admin-service";

export async function GET(request: NextRequest) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;
  return NextResponse.json(await listarEmpreiteirasAdmin());
}

const novaEmpreiteiraSchema = z.object({
  razaoSocial: z.string().min(3),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().min(14),
  inscricaoEstadual: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  responsavel: z.string().min(3),
  responsavelProfissao: z.string().min(1),
  responsavelRegistro: z.string().min(3),
  email: z.string().email(),
  telefone: z.string().min(10),
  site: z.string().optional(),
  especialidades: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const parsed = novaEmpreiteiraSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await criarEmpreiteiraAdmin(parsed.data);
  await recordAudit({
    actorId: guard.userId,
    action: "admin.empreiteira.criada",
    payload: { empreiteiraId: id, razaoSocial: parsed.data.razaoSocial },
    request,
  });
  return NextResponse.json({ id }, { status: 201 });
}
