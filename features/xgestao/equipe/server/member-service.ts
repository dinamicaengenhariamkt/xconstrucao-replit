import "server-only";

import { and, asc, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  empreiteiras,
  obras,
  passwordSetupTokens,
  userRoles,
  users,
  xgestaoMembroObras,
  xgestaoMembros,
} from "@shared/db/schema";
import { hashPassword } from "@features/auth/api/auth-service";
import { generateStrongPassword } from "@features/auth/api/password-generator";
import { issueSetupToken } from "@features/auth/api/password-setup-tokens";
import { getBaseUrl } from "@features/auth/api/auth-utils";
import { sendPasswordSetupEmail } from "@shared/lib/email";
import type {
  AreasPermitidas,
  CategoriasFinanceiroPermitidas,
} from "@features/xgestao/equipe/permissions";

export type ObraGrantInput = { obraId: string; permissao: "visualizar" | "editar" };
export type PapelMembro = "gestor" | "colaborador";

export class MemberServiceError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "MemberServiceError";
  }
}

function isUniqueConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; cause?: { code?: string } };
  return candidate.code === "23505" || candidate.cause?.code === "23505";
}

export async function listarMembros(empreiteiraId: string) {
  const rows = await db
    .select({
      id: xgestaoMembros.id,
      userId: xgestaoMembros.userId,
      nome: users.name,
      email: users.email,
      papel: xgestaoMembros.papel,
      status: xgestaoMembros.status,
      areasPermitidas: xgestaoMembros.areasPermitidas,
      categoriasFinanceiroPermitidas: xgestaoMembros.categoriasFinanceiroPermitidas,
      criadoEm: xgestaoMembros.criadoEm,
      obras: sql<ObraGrantInput[]>`coalesce(
        json_agg(json_build_object('obraId', ${xgestaoMembroObras.obraId}, 'permissao', ${xgestaoMembroObras.permissao}))
        FILTER (WHERE ${xgestaoMembroObras.id} IS NOT NULL AND ${obras.id} IS NOT NULL), '[]'::json
      )`,
    })
    .from(xgestaoMembros)
    .innerJoin(users, eq(users.id, xgestaoMembros.userId))
    .leftJoin(xgestaoMembroObras, and(
      eq(xgestaoMembroObras.membroId, xgestaoMembros.id),
      eq(xgestaoMembroObras.empreiteiraId, empreiteiraId),
    ))
    .leftJoin(obras, and(
      eq(obras.id, xgestaoMembroObras.obraId),
      eq(obras.empreiteiraId, empreiteiraId),
      isNull(obras.clienteId),
    ))
    .where(eq(xgestaoMembros.empreiteiraId, empreiteiraId))
    .groupBy(xgestaoMembros.id, users.id)
    .orderBy(asc(users.name));
  const companyObras = await db
    .select({ obraId: obras.id, nome: obras.nome })
    .from(obras)
    .where(and(eq(obras.empreiteiraId, empreiteiraId), isNull(obras.clienteId)))
    .orderBy(asc(obras.nome));
  return { rows, obras: companyObras };
}

async function validarGrants(empreiteiraId: string, grants: ObraGrantInput[]) {
  const ids = grants.map((grant) => grant.obraId);
  if (new Set(ids).size !== ids.length) {
    throw new MemberServiceError("Há obras duplicadas na lista de permissões.", 400);
  }
  if (!ids.length) return;
  const valid = await db
    .select({ id: obras.id })
    .from(obras)
    .where(and(
      eq(obras.empreiteiraId, empreiteiraId),
      isNull(obras.clienteId),
      inArray(obras.id, ids),
    ));
  if (valid.length !== ids.length) {
    throw new MemberServiceError("Uma ou mais obras não pertencem à empresa.", 400);
  }
}

async function gravarGrants(
  tx: any,
  memberId: string,
  empreiteiraId: string,
  grants: ObraGrantInput[],
) {
  await tx.delete(xgestaoMembroObras).where(eq(xgestaoMembroObras.membroId, memberId));
  if (grants.length) {
    await tx.insert(xgestaoMembroObras).values(grants.map((grant) => ({
      membroId: memberId,
      empreiteiraId,
      obraId: grant.obraId,
      permissao: grant.permissao,
    })));
  }
}

export async function convidarMembro(input: {
  empreiteiraId: string;
  donoUserId: string;
  nome: string;
  email: string;
  papel: PapelMembro;
  obras: ObraGrantInput[];
  areasPermitidas?: AreasPermitidas;
  categoriasFinanceiroPermitidas?: CategoriasFinanceiroPermitidas;
  request: Request;
}) {
  const grants = input.papel === "colaborador" ? input.obras : [];
  await validarGrants(input.empreiteiraId, grants);
  const [existing] = await db.select({ id: users.id }).from(users).where(ilike(users.email, input.email));
  if (existing) {
    const [ownCompany] = await db.select({ id: empreiteiras.id })
      .from(empreiteiras).where(eq(empreiteiras.userId, existing.id));
    if (ownCompany) {
      throw new MemberServiceError("Este e-mail já possui uma empresa própria e não pode ser vinculado como membro.", 409);
    }
    throw new MemberServiceError("Este e-mail já possui uma conta. Não é possível mesclar contas automaticamente.", 409);
  }

  const tempPassword = await hashPassword(generateStrongPassword(32));
  let member: { id: string; name: string; email: string; memberId: string };
  try {
    member = await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({
        name: input.nome,
        email: input.email,
        role: "empreiteiro",
        password: tempPassword,
        mustChangePassword: true,
        emailVerified: null,
        createdBy: input.donoUserId,
        username: null,
        ativo: true,
      }).returning({ id: users.id, name: users.name, email: users.email });
      await tx.insert(userRoles).values([
        { userId: user.id, role: "empreiteiro", origem: "signup" },
        { userId: user.id, role: "xgestao", origem: "upgrade" },
      ]);
      const [createdMember] = await tx.insert(xgestaoMembros).values({
        empreiteiraId: input.empreiteiraId,
        userId: user.id,
        papel: input.papel,
        status: "convidado",
        areasPermitidas: input.areasPermitidas ?? null,
        categoriasFinanceiroPermitidas: input.categoriasFinanceiroPermitidas ?? null,
        convidadoPor: input.donoUserId,
      }).returning({ id: xgestaoMembros.id });
      await gravarGrants(tx, createdMember.id, input.empreiteiraId, grants);
      return { ...user, memberId: createdMember.id };
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      throw new MemberServiceError("Este e-mail já possui uma conta ou convite.", 409);
    }
    throw error;
  }

  try {
    const { token } = await issueSetupToken(member.id, input.donoUserId);
    const setupUrl = `${getBaseUrl(input.request)}/definir-senha-inicial?token=${encodeURIComponent(token)}`;
    const [owner] = await db.select({ name: users.name }).from(users).where(eq(users.id, input.donoUserId));
    await sendPasswordSetupEmail(member.email, setupUrl, member.name, owner?.name ?? null, "Membro da equipe xgestão");
  } catch (error) {
    console.error("[xgestao/membros] Falha ao enviar convite:", error);
    await db.delete(users).where(eq(users.id, member.id)).catch((cleanupError) => {
      console.error("[xgestao/membros] Falha ao desfazer convite não enviado:", cleanupError);
    });
    throw new MemberServiceError("Não foi possível enviar o convite. Tente novamente.", 502);
  }
  return {
    id: member.memberId,
    nome: member.name,
    email: member.email,
    papel: input.papel,
    status: "convidado",
    areasPermitidas: input.areasPermitidas ?? null,
    categoriasFinanceiroPermitidas: input.categoriasFinanceiroPermitidas ?? null,
  };
}

export async function atualizarMembro(input: {
  empreiteiraId: string;
  id: string;
  papel: PapelMembro;
  obras: ObraGrantInput[];
  areasPermitidas?: AreasPermitidas;
  categoriasFinanceiroPermitidas?: CategoriasFinanceiroPermitidas;
}) {
  const grants = input.papel === "colaborador" ? input.obras : [];
  await validarGrants(input.empreiteiraId, grants);
  return db.transaction(async (tx) => {
    const [member] = await tx.select({
      id: xgestaoMembros.id,
      areasPermitidas: xgestaoMembros.areasPermitidas,
      categoriasFinanceiroPermitidas: xgestaoMembros.categoriasFinanceiroPermitidas,
    })
      .from(xgestaoMembros)
      .where(and(eq(xgestaoMembros.id, input.id), eq(xgestaoMembros.empreiteiraId, input.empreiteiraId)));
    if (!member) throw new MemberServiceError("Membro não encontrado.", 404);
    const changes: Partial<typeof xgestaoMembros.$inferInsert> = {
      papel: input.papel,
      atualizadoEm: new Date(),
    };
    if (input.areasPermitidas !== undefined) changes.areasPermitidas = input.areasPermitidas;
    if (input.categoriasFinanceiroPermitidas !== undefined) {
      changes.categoriasFinanceiroPermitidas = input.categoriasFinanceiroPermitidas;
    }
    await tx.update(xgestaoMembros).set(changes).where(eq(xgestaoMembros.id, member.id));
    await gravarGrants(tx, member.id, input.empreiteiraId, grants);
    return {
      id: member.id,
      papel: input.papel,
      obras: grants,
      areasPermitidas: input.areasPermitidas === undefined ? member.areasPermitidas : input.areasPermitidas,
      categoriasFinanceiroPermitidas: input.categoriasFinanceiroPermitidas === undefined
        ? member.categoriasFinanceiroPermitidas
        : input.categoriasFinanceiroPermitidas,
    };
  });
}

export async function revogarMembro(empreiteiraId: string, id: string) {
  const [member] = await db.update(xgestaoMembros).set({
    status: "revogado",
    atualizadoEm: new Date(),
  }).where(and(
    eq(xgestaoMembros.id, id),
    eq(xgestaoMembros.empreiteiraId, empreiteiraId),
  )).returning({ id: xgestaoMembros.id });
  if (!member) throw new MemberServiceError("Membro não encontrado.", 404);
  return member;
}

export async function reenviarConviteMembro(input: {
  empreiteiraId: string;
  donoUserId: string;
  id: string;
  request: Request;
}) {
  const [member] = await db
    .select({
      userId: xgestaoMembros.userId,
      nome: users.name,
      email: users.email,
      papel: xgestaoMembros.papel,
      status: xgestaoMembros.status,
    })
    .from(xgestaoMembros)
    .innerJoin(users, eq(users.id, xgestaoMembros.userId))
    .where(and(
      eq(xgestaoMembros.id, input.id),
      eq(xgestaoMembros.empreiteiraId, input.empreiteiraId),
    ));
  if (!member) throw new MemberServiceError("Membro não encontrado.", 404);
  if (member.status !== "convidado") {
    throw new MemberServiceError("Só é possível reenviar convites pendentes.", 409);
  }
  const [ownCompany] = await db
    .select({ id: empreiteiras.id })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, member.userId));
  if (ownCompany) {
    throw new MemberServiceError("Este usuário já possui uma empresa própria e não pode ser vinculado como membro.", 409);
  }

  // Um único link de setup pendente por vez. O link anterior deixa de ser aceito.
  await db.update(passwordSetupTokens)
    .set({ usedAt: new Date() })
    .where(and(
      eq(passwordSetupTokens.userId, member.userId),
      sql`${passwordSetupTokens.usedAt} IS NULL`,
    ));
  try {
    const { token } = await issueSetupToken(member.userId, input.donoUserId);
    const setupUrl = `${getBaseUrl(input.request)}/definir-senha-inicial?token=${encodeURIComponent(token)}`;
    const [owner] = await db.select({ name: users.name }).from(users).where(eq(users.id, input.donoUserId));
    await sendPasswordSetupEmail(member.email, setupUrl, member.nome, owner?.name ?? null, "Membro da equipe xgestão");
  } catch (error) {
    console.error("[xgestao/membros] Falha ao reenviar convite:", error);
    throw new MemberServiceError("Não foi possível reenviar o convite.", 502);
  }
  return { id: input.id, email: member.email, status: member.status };
}