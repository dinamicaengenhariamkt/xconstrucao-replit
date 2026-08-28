import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireVerifiedUser, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import { assertXgestaoUser } from '@features/xgestao/lib/entitlement';
import { db } from '@shared/db/db';
import { empreiteiras } from '@shared/db/schema';
import { empreiteiroPodeOperar, mensagemPerfilIncompleto } from '@shared/lib/perfil-operacional';

/** GET /api/xgestao/perfil-status — pré-requisitos reais para criar obra própria. */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (guard.user.role !== 'empreiteiro') {
    const response = NextResponse.json({ message: 'Perfil sem acesso.' }, { status: 403 });
    setNoCacheHeaders(response);
    return response;
  }

  const entitlement = await assertXgestaoUser(guard.user.id);
  if (!entitlement) {
    const response = NextResponse.json({ message: 'Seu acesso ao xgestão não está ativo.' }, { status: 403 });
    setNoCacheHeaders(response);
    return response;
  }

  const [perfil] = await db
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
    .where(eq(empreiteiras.id, entitlement.empreiteiraId))
    .limit(1);

  const status = empreiteiroPodeOperar(perfil);
  const response = NextResponse.json({
    ...status,
    message: status.ok ? null : mensagemPerfilIncompleto(status.faltando),
  });
  setNoCacheHeaders(response);
  return response;
}