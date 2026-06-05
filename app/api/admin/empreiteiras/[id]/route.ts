import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { recordAudit } from "@features/auth/api/audit";
import {
  obterEmpreiteiraAdmin,
  editarEmpreiteiraAdmin,
} from "@features/admin/empreiteiras/api/empreiteiras-admin-service";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const empreiteira = await obterEmpreiteiraAdmin(id);
  if (!empreiteira) return NextResponse.json({ message: "Empreiteira não encontrada" }, { status: 404 });
  return NextResponse.json(empreiteira);
}

const editarEmpreiteiraSchema = z.object({
  razaoSocial: z.string().min(3),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().min(14),
  inscricaoEstadual: z.string().optional(),
  bairro: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  responsavel: z.string().min(3),
  responsavelProfissao: z.string().min(1),
  responsavelRegistro: z.string().min(3),
  responsavelEmail: z.string().email().optional().or(z.literal("")),
  responsavelTelefone: z.string().optional(),
  email: z.string().email(),
  telefone: z.string().min(10),
  site: z.string().optional(),
  especialidades: z.array(z.string()).min(1),
});

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const parsed = editarEmpreiteiraSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
  }

  const ok = await editarEmpreiteiraAdmin(id, parsed.data);
  if (!ok) return NextResponse.json({ message: "Empreiteira não encontrada" }, { status: 404 });

  await recordAudit({
    actorId: guard.userId,
    action: "admin.empreiteira.editada",
    payload: { empreiteiraId: id },
    request,
  });
  return NextResponse.json(await obterEmpreiteiraAdmin(id));
}
