import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { resolverEmpresaDoUsuario } from "@features/xgestao/equipe/server/access";
import {
  MemberServiceError,
  reenviarConviteMembro,
} from "@features/xgestao/equipe/server/member-service";

type RouteContext = { params: Promise<{ id: string }> };

function json(payload: unknown, status = 200) {
  const response = NextResponse.json(payload, { status });
  setNoCacheHeaders(response);
  return response;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const company = await resolverEmpresaDoUsuario(guard.user.id);
  if (!company) return json({ message: "Acesso ao xgestão não ativo." }, 403);
  if (company.papel !== "dono") {
    return json({ message: "Somente o dono da empresa pode gerenciar membros." }, 403);
  }

  const { id } = await context.params;
  try {
    const result = await reenviarConviteMembro({
      empreiteiraId: company.empreiteiraId,
      donoUserId: guard.user.id,
      id,
      request,
    });
    return json({ success: true, row: result });
  } catch (error) {
    if (error instanceof MemberServiceError) return json({ message: error.message }, error.status);
    console.error("[xgestao/membros/reenviar] erro:", error);
    return json({ message: "Não foi possível reenviar o convite." }, 500);
  }
}