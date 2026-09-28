import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { resolverEmpresaDoUsuario } from "@features/xgestao/equipe/server/access";
import {
  convidarMembro,
  listarMembros,
  MemberServiceError,
} from "@features/xgestao/equipe/server/member-service";

const grantsSchema = z.array(z.object({
  obraId: z.string().min(1),
  permissao: z.enum(["visualizar", "editar"]),
}));
const createSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email(),
  papel: z.enum(["gestor", "colaborador"]),
  obras: grantsSchema,
});

function json(payload: unknown, status = 200) {
  const response = NextResponse.json(payload, { status });
  setNoCacheHeaders(response);
  return response;
}

async function ownerContext(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return { response: guard.error } as const;
  const company = await resolverEmpresaDoUsuario(guard.user.id);
  if (!company) return { response: json({ message: "Acesso ao xgestão não ativo." }, 403) } as const;
  if (company.papel !== "dono") return { response: json({ message: "Somente o dono da empresa pode gerenciar membros." }, 403) } as const;
  return { company, user: guard.user } as const;
}

export async function GET(request: NextRequest) {
  const context = await ownerContext(request);
  if ("response" in context) return context.response;
  try {
    return json(await listarMembros(context.company.empreiteiraId));
  } catch (error) {
    console.error("[xgestao/membros] erro ao listar:", error);
    return json({ message: "Não foi possível carregar os membros da empresa." }, 500);
  }
}

export async function POST(request: NextRequest) {
  const context = await ownerContext(request);
  if ("response" in context) return context.response;
  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return json({ message: "Dados inválidos.", errors: parsed.error.flatten() }, 400);
  try {
    const row = await convidarMembro({
      ...parsed.data,
      empreiteiraId: context.company.empreiteiraId,
      donoUserId: context.user.id,
      request,
    });
    return json({ row }, 201);
  } catch (error) {
    if (error instanceof MemberServiceError) return json({ message: error.message }, error.status);
    console.error("[xgestao/membros] erro ao convidar:", error);
    return json({ message: "Não foi possível convidar o membro." }, 500);
  }
}