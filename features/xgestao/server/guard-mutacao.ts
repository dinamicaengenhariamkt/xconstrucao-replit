import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { empreiteiras, obras, userRoles, xgestaoMembros } from '@shared/db/schema';
import { erroEscritaEmpresa } from './plano-empresa';
import { MSG_OBRA_BLOQUEADA_POR_PLANO } from '../lib/troca-plano';

/** XG48 — obra própria só para visualização no plano atual (descida de plano). */
async function erroObraBloqueadaPorPlano(obraId: string, empresaId: string): Promise<string | null> {
  const [obra] = await db.select({ bloqueada: obras.xgestaoBloqueadaPorPlano }).from(obras).where(and(
    eq(obras.id, obraId), eq(obras.empreiteiraId, empresaId), isNull(obras.clienteId),
  ));
  return obra?.bloqueada ? MSG_OBRA_BLOQUEADA_POR_PLANO : null;
}

/** Empresa (própria ou como membro ativo) do usuário, se houver. */
async function empresaDoUsuario(userId: string): Promise<string | null> {
  const [empresa] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, userId));
  const [membro] = empresa ? [] : await db.select({ id: xgestaoMembros.empreiteiraId }).from(xgestaoMembros)
    .where(and(eq(xgestaoMembros.userId, userId), eq(xgestaoMembros.status, 'ativo')));
  return empresa?.id ?? membro?.id ?? null;
}

/** Apenas mutações operacionais do produto; checkout e cadastro ficam acessíveis. */
export async function erroMutacaoXgestao(
  pathname: string, method: string, user: { id: string; role: string },
): Promise<string | null> {
  if (['GET', 'HEAD', 'OPTIONS'].includes(method) || user.role !== 'empreiteiro') return null;
  const operacional = /^\/api\/xgestao\/(obras|membros)(\/|$)/.test(pathname);
  const obraId = /^\/api\/obras\/([^/]+)(\/|$)/.exec(pathname)?.[1];
  // XG48 — links e demais rotas por obra em /api/xgestao/obras/:id/...
  const obraXgestaoId = /^\/api\/xgestao\/obras\/([^/]+)\//.exec(pathname)?.[1];
  if (!operacional && !obraId) return null;
  const empresaId = await empresaDoUsuario(user.id);
  if (!empresaId) return null; // autorização específica da rota ainda será exigida
  if (obraId) {
    const [propria] = await db.select({ id: obras.id }).from(obras).where(and(
      eq(obras.id, obraId), eq(obras.empreiteiraId, empresaId), isNull(obras.clienteId),
    ));
    if (!propria) return null; // jamais afeta mutações do marketplace
  }
  const erroConta = await erroEscritaEmpresa(empresaId);
  if (erroConta) return erroConta;
  const alvo = obraId ?? obraXgestaoId;
  return alvo ? erroObraBloqueadaPorPlano(alvo, empresaId) : null;
}

/**
 * EMP-05 — kinds de arquivo que são conteúdo de obra. Avatar, portfólio e
 * documentos do perfil não entram: a conta somente leitura continua podendo
 * cuidar do próprio perfil.
 */
const KINDS_CONTEUDO_OBRA = new Set(['obra_anexo', 'obra_capa', 'obra_foto', 'comprovante_pagamento']);

/**
 * EMP-05 — bloqueio de somente leitura para envio e exclusão de arquivo
 * (`/api/uploads/presign`, `/commit` e `DELETE /api/uploads/:id`). Fica na rota,
 * e não no guard por caminho, porque depende do `kind`, que vem no corpo (ou
 * no registro do arquivo). Só alcança quem tem o produto xgestão: o empreiteiro
 * do marketplace não tem plano xgestão e seguiria bloqueado por engano.
 */
export async function erroSomenteLeituraUpload(
  user: { id: string; role: string },
  kind: string,
  /**
   * Obra(s) do arquivo. REV-06: informada, só bloqueia quando alguma é obra
   * xgestão da empresa (própria, sem contratante); obra do marketplace nunca é
   * bloqueada pelo plano xgestão. Lista vazia (arquivo sem vínculo) não bloqueia.
   * Ausente (envio sem obra): vale o somente leitura da conta, como antes.
   */
  obra?: string | readonly string[],
): Promise<string | null> {
  if (user.role !== 'empreiteiro' || !KINDS_CONTEUDO_OBRA.has(kind)) return null;
  const [papel] = await db.select({ role: userRoles.role }).from(userRoles)
    .where(and(eq(userRoles.userId, user.id), eq(userRoles.role, 'xgestao')));
  if (!papel) return null;
  const empresaId = await empresaDoUsuario(user.id);
  if (!empresaId) return null;
  if (obra === undefined || obra === '') return erroEscritaEmpresa(empresaId);
  const ids = [...new Set(typeof obra === 'string' ? [obra] : obra)].filter(Boolean);
  if (ids.length === 0) return null;
  const xgestao = await db.select({ id: obras.id, bloqueada: obras.xgestaoBloqueadaPorPlano }).from(obras).where(and(
    inArray(obras.id, ids), eq(obras.empreiteiraId, empresaId), isNull(obras.clienteId),
  ));
  if (xgestao.length === 0) return null; // jamais afeta o marketplace
  const erroConta = await erroEscritaEmpresa(empresaId);
  if (erroConta) return erroConta;
  return xgestao.some((o) => o.bloqueada) ? MSG_OBRA_BLOQUEADA_POR_PLANO : null;
}
