import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { resolverEmpresaDoUsuario } from "@features/xgestao/equipe/server/access";
import {
  atualizarMembro,
  MemberServiceError,
  revogarMembro,
} from "@features/xgestao/equipe/server/member-service";

type RouteContext = { params: Promise<{ id: string }> };
const patchSchema = z.object({
  papel: z.enum(["gestor", "colaborador"]),
  obras: z.array(z.object({
    obraId: z.string().min(1),
    permissao: z.enum(["visualizar", "editar"]),
  })),
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
  return { company } as const;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const owner = await ownerContext(request);
  if ("response" in owner) return owner.response;
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return json({ message: "Dados inválidos.", errors: parsed.error.flatten() }, 400);
  try {
    return json({ row: await atualizarMembro({
      empreiteiraId: owner.company.empreiteiraId,
      id,
      ...parsed.data,
    }) });
  } catch (error) {
    if (error instanceof MemberServiceError) return json({ message: error.message }, error.status);
    console.error("[xgestao/membros] erro ao atualizar:", error);
    return json({ message: "Não foi possível atualizar o membro." }, 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const owner = await ownerContext(request);
  if ("response" in owner) return owner.response;
  const { id } = await context.params;
  try {
    await revogarMembro(owner.company.empreiteiraId, id);
    return json({ success: true });
  } catch (error) {
    if (error instanceof MemberServiceError) return json({ message: error.message }, error.status);
    console.error("[xgestao/membros] erro ao revogar:", error);
    return json({ message: "Não foi possível revogar o membro." }, 500);
  }
}