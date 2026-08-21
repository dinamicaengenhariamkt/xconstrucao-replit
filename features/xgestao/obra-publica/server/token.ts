import 'server-only';

import { randomBytes } from 'crypto';
import { and, eq, gt, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { empreiteiras, obraShareLinks, obras, userRoles } from '@shared/db/schema';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type ObraShareLink = {
  id: string;
  obraId: string;
  token: string;
  expiraEm: Date | null;
  criadoEm: Date;
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
): Promise<ObraShareLink> {
  const token = randomBytes(32).toString('base64url');

  return db.transaction(async (tx) => {
    // Serializa emissões concorrentes por obra e preserva a regra de uma
    // capability ativa sem expor o token em logs.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${obraId}))`);
    await tx
      .update(obraShareLinks)
      .set({ ativo: false })
      .where(and(eq(obraShareLinks.obraId, obraId), eq(obraShareLinks.ativo, true)));

    const [created] = await tx
      .insert(obraShareLinks)
      .values({ obraId, token, criadoPor, expiraEm })
      .returning();

    return toShareLink(created);
  });
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
export async function resolveActiveObraShareToken(token: string): Promise<{ linkId: string; obraId: string } | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const [link] = await db
    .select({ linkId: obraShareLinks.id, obraId: obraShareLinks.obraId })
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
  return link ?? null;
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