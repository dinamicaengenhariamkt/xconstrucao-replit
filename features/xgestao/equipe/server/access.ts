import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { empreiteiras, obras, xgestaoMembroObras, xgestaoMembros } from "@shared/db/schema";
import { userHasRole } from "@features/auth/api/auth-utils";

export type PapelEmpresa = "dono" | "gestor" | "colaborador";
export type PermissaoObra = "visualizar" | "editar";

export async function resolverEmpresaDoUsuario(
  userId: string,
): Promise<{ empreiteiraId: string; donoUserId: string; papel: PapelEmpresa } | null> {
  if (!userId || !(await userHasRole(userId, "xgestao"))) return null;
  const [empresa] = await db
    .select({ id: empreiteiras.id, donoUserId: empreiteiras.userId })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, userId));
  if (empresa?.donoUserId) {
    return { empreiteiraId: empresa.id, donoUserId: empresa.donoUserId, papel: "dono" };
  }

  const [membership] = await db
    .select({
      empreiteiraId: xgestaoMembros.empreiteiraId,
      papel: xgestaoMembros.papel,
      donoUserId: empreiteiras.userId,
    })
    .from(xgestaoMembros)
    .innerJoin(empreiteiras, eq(empreiteiras.id, xgestaoMembros.empreiteiraId))
    .where(and(
      eq(xgestaoMembros.userId, userId),
      eq(xgestaoMembros.status, "ativo"),
    ));
  if (!membership?.donoUserId) return null;
  return {
    empreiteiraId: membership.empreiteiraId,
    donoUserId: membership.donoUserId,
    papel: membership.papel,
  };
}

export async function resolverAcessoObraXgestao(
  userId: string,
  obraId: string,
): Promise<PermissaoObra | null> {
  const empresa = await resolverEmpresaDoUsuario(userId);
  if (!empresa) return null;
  const [obra] = await db
    .select({ id: obras.id })
    .from(obras)
    .where(and(
      eq(obras.id, obraId),
      eq(obras.empreiteiraId, empresa.empreiteiraId),
    ));
  if (!obra) return null;
  if (empresa.papel === "dono") return "editar";
  if (empresa.papel === "gestor") return "editar";

  const [grant] = await db
    .select({ permissao: xgestaoMembroObras.permissao })
    .from(xgestaoMembroObras)
    .innerJoin(xgestaoMembros, eq(xgestaoMembros.id, xgestaoMembroObras.membroId))
    .where(and(
      eq(xgestaoMembros.userId, userId),
      eq(xgestaoMembros.status, "ativo"),
      eq(xgestaoMembroObras.empreiteiraId, empresa.empreiteiraId),
      eq(xgestaoMembroObras.obraId, obraId),
    ));
  return grant?.permissao ?? null;
}

export async function listarIdsObrasPermitidas(
  userId: string,
  empreiteiraId: string,
): Promise<string[] | null> {
  const empresa = await resolverEmpresaDoUsuario(userId);
  if (!empresa || empresa.empreiteiraId !== empreiteiraId) return [];
  if (empresa.papel === "dono" || empresa.papel === "gestor") return null;
  const grants = await db
    .select({ obraId: xgestaoMembroObras.obraId })
    .from(xgestaoMembroObras)
    .innerJoin(xgestaoMembros, eq(xgestaoMembros.id, xgestaoMembroObras.membroId))
    .where(and(
      eq(xgestaoMembros.userId, userId),
      eq(xgestaoMembros.status, "ativo"),
      eq(xgestaoMembroObras.empreiteiraId, empreiteiraId),
    ));
  return grants.map((row) => row.obraId);
}