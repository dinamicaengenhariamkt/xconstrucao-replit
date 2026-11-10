import 'server-only';

import { desc, eq, inArray } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db/db';
import { users, xgestaoAdminContatos } from '@shared/db/schema';
import { recordAudit } from '@features/auth/api/audit';
import type { CanalContato } from '../lib/contato-assinante';
import { listarAssinantesXgestao } from './escopo';

/**
 * CRM-07 — registro dos contatos que o admin fez com o responsável de uma
 * conta xgestão. Leitura e escrita só pelo admin (rotas com
 * `requireAdminXgestao`); cada registro vai para `audit_logs` sem a nota.
 */
export interface ContatoAdmin {
  id: string;
  canal: CanalContato;
  nota: string | null;
  criadoEm: string;
  adminNome: string | null;
}

export const MAX_CONTATOS_DETALHE = 50;

/** Tabela ainda não criada neste ambiente (bootstrap pendente): lê como vazia. */
function tabelaAusente(erro: unknown): boolean {
  const e = erro as { code?: string; cause?: { code?: string } } | null;
  return e?.code === '42P01' || e?.cause?.code === '42P01';
}

export async function listarContatosAssinante(userId: string): Promise<ContatoAdmin[]> {
  try {
    const linhas = await db
      .select({
        id: xgestaoAdminContatos.id,
        canal: xgestaoAdminContatos.canal,
        nota: xgestaoAdminContatos.nota,
        criadoEm: xgestaoAdminContatos.criadoEm,
        adminNome: users.name,
      })
      .from(xgestaoAdminContatos)
      .leftJoin(users, eq(users.id, xgestaoAdminContatos.adminId))
      .where(eq(xgestaoAdminContatos.userId, userId))
      .orderBy(desc(xgestaoAdminContatos.criadoEm), desc(xgestaoAdminContatos.id))
      .limit(MAX_CONTATOS_DETALHE);
    return linhas.map((l) => ({ ...l, criadoEm: l.criadoEm.toISOString() }));
  } catch (erro) {
    if (tabelaAusente(erro)) return [];
    throw erro;
  }
}

/** Último contato de cada responsável (data e canal), para a lista e o CSV. */
export async function ultimoContatoPorUsuario(
  userIds: string[],
): Promise<Map<string, { em: string; canal: CanalContato }>> {
  const mapa = new Map<string, { em: string; canal: CanalContato }>();
  if (userIds.length === 0) return mapa;
  try {
    const linhas = await db
      .selectDistinctOn([xgestaoAdminContatos.userId], {
        userId: xgestaoAdminContatos.userId,
        canal: xgestaoAdminContatos.canal,
        criadoEm: xgestaoAdminContatos.criadoEm,
      })
      .from(xgestaoAdminContatos)
      .where(inArray(xgestaoAdminContatos.userId, userIds))
      .orderBy(xgestaoAdminContatos.userId, desc(xgestaoAdminContatos.criadoEm));
    for (const l of linhas) mapa.set(l.userId, { em: l.criadoEm.toISOString(), canal: l.canal });
    return mapa;
  } catch (erro) {
    if (tabelaAusente(erro)) return mapa;
    throw erro;
  }
}

/**
 * Grava o contato. `null` quando o id não é um responsável xgestão (membro de
 * equipe, conta de marketplace ou inexistente): a rota responde 404 sem dizer qual.
 */
export async function registrarContatoAssinante(args: {
  userId: string;
  adminId: string;
  canal: CanalContato;
  nota: string | null;
  request: NextRequest;
}): Promise<ContatoAdmin | null> {
  const [assinante] = await listarAssinantesXgestao({ userIds: [args.userId], internas: 'incluir' });
  if (!assinante) return null;
  const [criado] = await db
    .insert(xgestaoAdminContatos)
    .values({
      userId: args.userId,
      empreiteiraId: assinante.empreiteiraId,
      adminId: args.adminId,
      canal: args.canal,
      nota: args.nota,
    })
    .returning();
  // A nota pode citar dado pessoal: no log vai só o canal e o tamanho.
  await recordAudit({
    actorId: args.adminId,
    action: 'admin.xgestao.contato_registrado',
    targetUserId: args.userId,
    payload: { contatoId: criado.id, canal: args.canal, nota: Boolean(args.nota), tamanhoNota: args.nota?.length ?? 0 },
    request: args.request,
  });
  const [admin] = await db.select({ nome: users.name }).from(users).where(eq(users.id, args.adminId)).limit(1);
  return {
    id: criado.id,
    canal: criado.canal,
    nota: criado.nota,
    criadoEm: criado.criadoEm.toISOString(),
    adminNome: admin?.nome ?? null,
  };
}
