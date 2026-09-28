import 'server-only';

import { and, eq, inArray, isNotNull, isNull, type SQL } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  empreiteiras,
  obras,
  userRoles,
  users,
  xgestaoMembroObras,
  xgestaoMembros,
} from '@shared/db/schema';

/**
 * O recorte do produto xgestão, num lugar só.
 *
 * Não existe coluna de produto: uma obra é do xgestão quando não tem
 * contratante e pertence a uma empreiteira (XG06 §6). Repetir esse predicado
 * em cada consulta é como uma tela acaba mostrando obra de marketplace — por
 * isso as páginas administrativas partem daqui.
 */
export const XGESTAO_OBRA = and(isNull(obras.clienteId), isNotNull(obras.empreiteiraId)) as SQL;

export interface XgestaoAssinanteBase {
  userId: string;
  email: string;
  nome: string | null;
  empreiteiraId: string;
  empreiteiraNome: string;
  entradaEm: Date;
}

/** Pessoa vinculada à empresa; não é uma assinatura nem uma empresa própria. */
export interface XgestaoMembroEmpresa {
  empreiteiraId: string;
  membroId: string;
  userId: string;
  nome: string;
  email: string;
  papel: string;
  status: string;
  obras: Array<{ obraId: string; nome: string; permissao: string }>;
}

/**
 * Leitura administrativa das pessoas vinculadas às empresas no recorte xgestão.
 * Membros são apresentados dentro da empresa e nunca entram na base de
 * assinantes/contagem de empresas.
 */
export async function listarMembrosEmpreiteirasXgestao(
  empreiteiraIds: string[],
): Promise<XgestaoMembroEmpresa[]> {
  if (empreiteiraIds.length === 0) return [];

  const rows = await db
    .select({
      empreiteiraId: xgestaoMembros.empreiteiraId,
      membroId: xgestaoMembros.id,
      userId: xgestaoMembros.userId,
      nome: users.name,
      email: users.email,
      papel: xgestaoMembros.papel,
      status: xgestaoMembros.status,
      obraId: obras.id,
      obra: obras.nome,
      permissao: xgestaoMembroObras.permissao,
    })
    .from(xgestaoMembros)
    .innerJoin(users, eq(users.id, xgestaoMembros.userId))
    .leftJoin(xgestaoMembroObras, eq(xgestaoMembroObras.membroId, xgestaoMembros.id))
    // A equipe pode receber acesso a obras de marketplace; a visão xgestão não
    // as revela nem sequer por meio do nome do grant.
    .leftJoin(obras, and(
      eq(obras.id, xgestaoMembroObras.obraId),
      XGESTAO_OBRA,
    ))
    .where(inArray(xgestaoMembros.empreiteiraId, empreiteiraIds))
    .orderBy(xgestaoMembros.empreiteiraId, users.name, obras.nome);

  const members = new Map<string, XgestaoMembroEmpresa>();
  for (const row of rows) {
    let member = members.get(row.membroId);
    if (!member) {
      member = {
        empreiteiraId: row.empreiteiraId,
        membroId: row.membroId,
        userId: row.userId,
        nome: row.nome,
        email: row.email,
        papel: row.papel,
        status: row.status,
        obras: [],
      };
      members.set(row.membroId, member);
    }
    if (row.obraId && row.obra && row.permissao) {
      member.obras.push({ obraId: row.obraId, nome: row.obra, permissao: row.permissao });
    }
  }
  return [...members.values()];
}

/**
 * Assinantes do xgestão: quem mantém o entitlement em `user_roles`.
 *
 * A fonte é o entitlement, não a tabela de assinaturas, porque o plano free
 * não gera cobrança — olhar só para `assinaturas` esconderia a maior parte da
 * base. Quem ainda não tem empreiteira cadastrada fica de fora: sem ela não há
 * obra para exibir.
 */
export async function listarAssinantesXgestao(): Promise<XgestaoAssinanteBase[]> {
  const rows = await db
    .select({
      userId: userRoles.userId,
      email: users.email,
      nome: users.name,
      empreiteiraId: empreiteiras.id,
      empreiteiraNome: empreiteiras.nome,
      entradaEm: userRoles.criadoEm,
    })
    .from(userRoles)
    .innerJoin(users, eq(users.id, userRoles.userId))
    .leftJoin(xgestaoMembros, eq(xgestaoMembros.userId, userRoles.userId))
    .innerJoin(empreiteiras, eq(empreiteiras.userId, users.id))
    .where(and(eq(userRoles.role, 'xgestao'), isNull(xgestaoMembros.id)));

  return rows.map((row) => ({
    userId: row.userId,
    email: row.email,
    nome: row.nome,
    empreiteiraId: row.empreiteiraId,
    empreiteiraNome: row.empreiteiraNome,
    entradaEm: row.entradaEm,
  }));
}

/** Ids das empreiteiras com entitlement — a chave de todo filtro de obra. */
export async function listarEmpreiteiraIdsXgestao(): Promise<string[]> {
  const assinantes = await listarAssinantesXgestao();
  return assinantes.map((assinante) => assinante.empreiteiraId);
}

/**
 * Predicado pronto para as consultas de obra do produto.
 *
 * Devolve `null` quando não há empreiteira no recorte: `inArray` com lista
 * vazia geraria SQL inválido, e o chamador deve encurtar para resultado vazio.
 */
export function filtroObrasXgestao(empreiteiraIds: string[]): SQL | null {
  if (empreiteiraIds.length === 0) return null;
  return and(XGESTAO_OBRA, inArray(obras.empreiteiraId, empreiteiraIds)) as SQL;
}

/**
 * Confirma que a obra pertence ao recorte antes de abrir o detalhe.
 *
 * A visão administrativa do xgestão não pode servir de porta lateral para uma
 * obra de marketplace: a checagem é por id, no servidor, e não por parâmetro
 * de consulta que o cliente poderia trocar.
 */
export async function obraPertenceAoXgestao(obraId: string): Promise<boolean> {
  // Consulta indexada pelo id, com os joins do entitlement — em vez de carregar
  // a base inteira de assinantes só para conferir uma obra.
  const [encontrada] = await db
    .select({ id: obras.id })
    .from(obras)
    .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .innerJoin(userRoles, eq(userRoles.userId, empreiteiras.userId))
    .where(and(eq(obras.id, obraId), XGESTAO_OBRA, eq(userRoles.role, 'xgestao')));
  return Boolean(encontrada);
}
