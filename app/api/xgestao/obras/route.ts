import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { empreiteiras } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { createObra } from "@features/obras/api/create-obra";
import { assertXgestaoUser } from "@features/xgestao/lib/entitlement";
import {
  CODE_PERFIL_INCOMPLETO,
  empreiteiroPodeOperar,
  mensagemPerfilIncompleto,
} from "@shared/lib/perfil-operacional";

/**
 * POST /api/xgestao/obras
 *
 * Cria uma obra própria da empreiteira. Não recebe contratante e nunca publica
 * no marketplace: ownership e visibilidade são definidos pelo servidor.
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (guard.user.role !== "empreiteiro") {
    const r = NextResponse.json(
      { message: "Apenas empreiteiros podem criar obras próprias." },
      { status: 403 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const entitlement = await assertXgestaoUser(guard.user.id);
  if (!entitlement) {
    const r = NextResponse.json(
      { message: "Seu acesso ao xgestão não está ativo." },
      { status: 403 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const [empreiteira] = await db
    .select({
      nome: empreiteiras.nome,
      responsavel: empreiteiras.responsavel,
      email: empreiteiras.email,
      telefone: empreiteiras.telefone,
      cnpj: empreiteiras.cnpj,
      cep: empreiteiras.cep,
      endereco: empreiteiras.endereco,
      cidade: empreiteiras.cidade,
      estado: empreiteiras.estado,
      especialidades: empreiteiras.especialidades,
      raioKm: empreiteiras.raioKm,
    })
    .from(empreiteiras)
    .where(eq(empreiteiras.id, entitlement.empreiteiraId));

  const podeOperar = empreiteiroPodeOperar(empreiteira);
  if (!podeOperar.ok) {
    const r = NextResponse.json(
      {
        code: CODE_PERFIL_INCOMPLETO,
        message: mensagemPerfilIncompleto(podeOperar.faltando),
        faltando: podeOperar.faltando,
      },
      { status: 422 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const result = await createObra(
    request,
    guard.user.id,
    { kind: "xgestao", empreiteiraId: entitlement.empreiteiraId },
    body,
  );
  const r = result.ok
    ? NextResponse.json(result.obra, { status: 201 })
    : NextResponse.json(result.body, { status: result.status });
  setNoCacheHeaders(r);
  return r;
}