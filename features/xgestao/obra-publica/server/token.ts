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
  nome: string;
  token: string;
  expiraEm: Date | null;
  criadoEm: Date;
  visualizacoes: number;
  ultimoAcessoEm: Date | null;
  secoes: SecoesPublicas;
};

/**
 * XG30 — teto de links ativos por obra. Um por público ("Cliente",
 * "Arquiteto", …) raramente passa de três; o teto existe para que um laço no
 * cliente não encha a tabela de capabilities válidas.
 */
export const LIMITE_LINKS_ATIVOS = 5;

export class LimiteLinksAtingidoError extends Error {
  constructor() {
    super(`Limite de ${LIMITE_LINKS_ATIVOS} links ativos por obra.`);
  }
}

function activeLinksWhere(obraId: string) {
  return and(
    eq(obraShareLinks.obraId, obraId),
    eq(obraShareLinks.ativo, true),
    or(isNull(obraShareLinks.expiraEm), gt(obraShareLinks.expiraEm, new Date())),
  );
}

/**
 * Um link ativo desta obra. Filtrar por `obraId` junto do `id` é o que impede
 * o dono de uma obra de mexer no link de outra (IDOR) só trocando o id.
 */
function activeLinkByIdWhere(obraId: string, linkId: string) {
  return and(activeLinksWhere(obraId), eq(obraShareLinks.id, linkId));
}

function toShareLink(row: typeof obraShareLinks.$inferSelect): ObraShareLink {
  return {
    id: row.id,
    obraId: row.obraId,
    nome: row.nome,
    token: row.token,
    expiraEm: row.expiraEm,
    criadoEm: row.criadoEm,
    visualizacoes: row.visualizacoes,
    ultimoAcessoEm: row.ultimoAcessoEm,
    secoes: normalizarSecoes(row.secoes),
  };
}

/** Os links ativos que o dono pode reexibir, do mais antigo ao mais novo. */
export async function listActiveObraShareLinks(obraId: string): Promise<ObraShareLink[]> {
  const links = await db
    .select()
    .from(obraShareLinks)
    .where(activeLinksWhere(obraId))
    .orderBy(obraShareLinks.criadoEm);
  return links.map(toShareLink);
}

/**
 * Emite um link novo sem tocar nos existentes (XG30). O token é opaco, com 32
 * bytes criptograficamente aleatórios em base64url.
 *
 * Até a XG29 emitir era rotacionar: a obra tinha um link só, e o novo revogava
 * o anterior. Com um link por público, criar o do arquiteto não pode derrubar o
 * que o cliente já tem salvo — trocar um endereço agora é revogar e criar.
 */
export async function createObraShareLink(
  obraId: string,
  criadoPor: string,
  { nome, expiraEm = null, secoes = null }: { nome: string; expiraEm?: Date | null; secoes?: SecoesPublicas | null },
): Promise<ObraShareLink> {
  const token = randomBytes(32).toString('base64url');

  return db.transaction(async (tx) => {
    // Serializa emissões concorrentes por obra: sem isso duas criações
    // simultâneas passariam juntas pela checagem do teto.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${obraId}))`);

    const [{ total }] = await tx
      .select({ total: sql<number>`count(*)::int` })
      .from(obraShareLinks)
      .where(activeLinksWhere(obraId));
    if (total >= LIMITE_LINKS_ATIVOS) throw new LimiteLinksAtingidoError();

    const [created] = await tx
      .insert(obraShareLinks)
      .values({ obraId, nome, token, criadoPor, expiraEm, secoes })
      .returning();

    return toShareLink(created);
  });
}

/**
 * Altera o que o link expõe, ou como o dono o chama, sem trocar o token.
 * Ajustar visibilidade não pode invalidar o endereço que o cliente já tem salvo.
 */
export async function updateObraShareLink(
  obraId: string,
  linkId: string,
  alteracoes: { secoes?: SecoesPublicas; nome?: string },
): Promise<ObraShareLink | null> {
  const [updated] = await db
    .update(obraShareLinks)
    .set(alteracoes)
    .where(activeLinkByIdWhere(obraId, linkId))
    .returning();
  return updated ? toShareLink(updated) : null;
}

/** Revoga um link, mantendo a linha como histórico. Os demais seguem válidos. */
export async function revokeObraShareLink(obraId: string, linkId: string): Promise<boolean> {
  const updated = await db
    .update(obraShareLinks)
    .set({ ativo: false })
    .where(and(
      eq(obraShareLinks.obraId, obraId),
      eq(obraShareLinks.id, linkId),
      eq(obraShareLinks.ativo, true),
    ))
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