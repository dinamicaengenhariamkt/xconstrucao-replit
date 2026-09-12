import 'server-only';

import { randomBytes } from 'crypto';
import { and, eq, gt, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { empreiteiras, obraShareLinks, obras, userRoles } from '@shared/db/schema';
import { normalizarSecoes, type SecoesPublicas } from '../secoes';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type ObraShareLink = {
  id: string;
  obraId: string;
  token: string;
  expiraEm: Date | null;
  criadoEm: Date;
  visualizacoes: number;
  ultimoAcessoEm: Date | null;
  secoes: SecoesPublicas;
};

function activeLinkWhere(obraId: string) {
  return and(
    eq(obraShareLinks.obraId, obraId),
    eq(obraShareLinks.ativo, true),
    or(isNull(obraShareLinks.expiraEm), gt(obraShareLinks.expiraEm, new Date())),
  );
}

function toShareLink(row: typeof obraShareLinks.$inferSelect): ObraShareLink {
  return {
    id: row.id,
    obraId: row.obraId,
    token: row.token,
    expiraEm: row.expiraEm,
    criadoEm: row.criadoEm,
    visualizacoes: row.visualizacoes,
    ultimoAcessoEm: row.ultimoAcessoEm,
    secoes: normalizarSecoes(row.secoes),
  };
}

/** Recupera somente a capability ativa que o dono pode reexibir. */
export async function getActiveObraShareLink(obraId: string): Promise<ObraShareLink | null> {
  const [link] = await db
    .select()
    .from(obraShareLinks)
    .where(activeLinkWhere(obraId))
    .orderBy(obraShareLinks.criadoEm);
  return link ? toShareLink(link) : null;
}

/**
 * Rotaciona a capability sem apagar o histórico. O token é opaco, com 32 bytes
 * criptograficamente aleatórios em base64url.
 */
export async function createOrRotateObraShareLink(
  obraId: string,
  criadoPor: string,
  expiraEm: Date | null = null,
  secoes: SecoesPublicas | null = null,
): Promise<ObraShareLink> {
  const token = randomBytes(32).toString('base64url');

  return db.transaction(async (tx) => {
    // Serializa emissões concorrentes por obra e preserva a regra de uma
    // capability ativa sem expor o token em logs.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${obraId}))`);

    // Rotacionar preserva a escolha de visibilidade do link anterior: trocar o
    // endereço não deveria, sozinho, republicar seções que o dono desligou.
    const [anterior] = await tx
      .select({ secoes: obraShareLinks.secoes })
      .from(obraShareLinks)
      .where(and(eq(obraShareLinks.obraId, obraId), eq(obraShareLinks.ativo, true)));

    await tx
      .update(obraShareLinks)
      .set({ ativo: false })
      .where(and(eq(obraShareLinks.obraId, obraId), eq(obraShareLinks.ativo, true)));

    const [created] = await tx
      .insert(obraShareLinks)
      .values({ obraId, token, criadoPor, expiraEm, secoes: secoes ?? anterior?.secoes ?? null })
      .returning();

    return toShareLink(created);
  });
}

/**
 * Altera o que o link expõe sem trocar o token. Ajustar visibilidade não pode
 * invalidar o endereço que o cliente já tem salvo.
 */
export async function updateObraShareSecoes(
  obraId: string,
  secoes: SecoesPublicas,
): Promise<ObraShareLink | null> {
  const [updated] = await db
    .update(obraShareLinks)
    .set({ secoes })
    .where(activeLinkWhere(obraId))
    .returning();
  return updated ? toShareLink(updated) : null;
}

/** Revoga a capability atual, mantendo toda a linha como histórico. */
export async function revokeObraShareLink(obraId: string): Promise<boolean> {
  const updated = await db
    .update(obraShareLinks)
    .set({ ativo: false })
    .where(and(eq(obraShareLinks.obraId, obraId), eq(obraShareLinks.ativo, true)))
    .returning({ id: obraShareLinks.id });
  return updated.length > 0;
}

/**
 * Resolve o token para a página pública. Retornar null intencionalmente une
 * token malformado, inexistente, expirado e revogado no mesmo estado externo.
 */
export async function resolveActiveObraShareToken(
  token: string,
): Promise<{ linkId: string; obraId: string; secoes: SecoesPublicas } | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const [link] = await db
    .select({ linkId: obraShareLinks.id, obraId: obraShareLinks.obraId, secoes: obraShareLinks.secoes })
    .from(obraShareLinks)
    .innerJoin(obras, eq(obras.id, obraShareLinks.obraId))
    .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .innerJoin(userRoles, eq(userRoles.userId, empreiteiras.userId))
    .where(and(
      eq(obraShareLinks.token, token),
      eq(obraShareLinks.ativo, true),
      // Um link não continua válido caso a obra deixe de ser própria do xgestão.
      isNull(obras.clienteId),
      isNotNull(obras.empreiteiraId),
      eq(userRoles.role, 'xgestao'),
      or(isNull(obraShareLinks.expiraEm), gt(obraShareLinks.expiraEm, new Date())),
    ));
  if (!link) return null;
  return { linkId: link.linkId, obraId: link.obraId, secoes: normalizarSecoes(link.secoes) };
}

/** Contador best-effort: não deve atrasar nem impedir a página pública. */
export async function recordObraShareView(linkId: string): Promise<void> {
  try {
    await db
      .update(obraShareLinks)
      .set({
        visualizacoes: sql`${obraShareLinks.visualizacoes} + 1`,
        ultimoAcessoEm: new Date(),
      })
      .where(eq(obraShareLinks.id, linkId));
  } catch (error) {
    // Estatística não pode derrubar ou degradar a capability de leitura.
    console.error('[xgestao-share] failed to record view', error);
  }
}