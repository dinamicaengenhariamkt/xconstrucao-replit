import 'server-only';

import { and, desc, eq, inArray, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { marketingAtivo } from '@features/xgestao/marketing/lib/consentimento';
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
  /** ADM-06 — `null` quando o responsável ainda não cadastrou a empresa. */
  empreiteiraId: string | null;
  empreiteiraNome: string;
  /** ADM-06 — tem o entitlement, mas ainda não cadastrou a empresa. */
  semEmpresa: boolean;
  /** ADM-02 — conta interna/teste: fora das métricas, vista à parte. */
  contaInterna: boolean;
  entradaEm: Date;
  /**
   * CRM-01 — contato do responsável: telefone do usuário (senão o da empresa),
   * CPF/CNPJ (CNPJ da empresa, senão o documento do usuário), cidade e UF da empresa.
   */
  contato: { telefone: string | null; documento: string | null; cidade: string | null; uf: string | null };
  /**
   * XG52 — consentimento de e-mail de marketing (LGPD). O admin vê sem máscara;
   * o CSV de marketing filtra por `aceito`.
   */
  marketing: { aceito: boolean; consentimentoEm: string | null; revogadoEm: string | null; origem: string | null };
}

/** ADM-02 — como as contas internas entram numa leitura. */
export type FiltroContasInternas = 'excluir' | 'somente' | 'incluir';

/** Nome mostrado para quem ainda não cadastrou a empresa. */
export const SEM_EMPRESA_NOME = 'Perfil ainda não concluído';

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
 * base. ADM-06: é a base ÚNICA da home, da lista, do funil e do CSV; quem ainda
 * não cadastrou a empresa entra com `semEmpresa` (antes a home contava e a lista
 * não). ADM-02: contas internas ficam de fora por padrão.
 */
export async function listarAssinantesXgestao(
  opcoes: { internas?: FiltroContasInternas; userIds?: string[] } = {},
): Promise<XgestaoAssinanteBase[]> {
  const internas = opcoes.internas ?? 'excluir';
  if (opcoes.userIds && opcoes.userIds.length === 0) return [];
  const condicoes: SQL[] = [eq(userRoles.role, 'xgestao'), isNull(xgestaoMembros.id)];
  if (internas === 'excluir') condicoes.push(eq(users.contaInterna, false));
  if (internas === 'somente') condicoes.push(eq(users.contaInterna, true));
  if (opcoes.userIds) condicoes.push(inArray(userRoles.userId, opcoes.userIds));
  const rows = await db
    .select({
      userId: userRoles.userId,
      email: users.email,
      nome: users.name,
      contaInterna: users.contaInterna,
      empreiteiraId: empreiteiras.id,
      empreiteiraNome: empreiteiras.nome,
      entradaEm: userRoles.criadoEm,
      telefone: sql<string | null>`coalesce(nullif(trim(${users.phone}), ''), nullif(trim(${empreiteiras.telefone}), ''))`,
      documento: sql<string | null>`coalesce(nullif(trim(${empreiteiras.cnpj}), ''), nullif(trim(${users.cpfCnpj}), ''))`,
      cidade: empreiteiras.cidade,
      uf: empreiteiras.estado,
      marketingConsentimentoEm: users.marketingConsentimentoEm,
      marketingRevogadoEm: users.marketingRevogadoEm,
      marketingOrigem: users.marketingOrigem,
    })
    .from(userRoles)
    .innerJoin(users, eq(users.id, userRoles.userId))
    .leftJoin(xgestaoMembros, eq(xgestaoMembros.userId, userRoles.userId))
    .leftJoin(empreiteiras, eq(empreiteiras.userId, users.id))
    .where(and(...condicoes))
    .orderBy(desc(userRoles.criadoEm));

  return rows.map((row) => ({
    userId: row.userId,
    email: row.email,
    nome: row.nome,
    empreiteiraId: row.empreiteiraId,
    empreiteiraNome: row.empreiteiraNome ?? SEM_EMPRESA_NOME,
    semEmpresa: row.empreiteiraId === null,
    contaInterna: row.contaInterna,
    entradaEm: row.entradaEm,
    contato: { telefone: row.telefone, documento: row.documento, cidade: row.cidade, uf: row.uf },
    marketing: {
      aceito: marketingAtivo({ consentimentoEm: row.marketingConsentimentoEm, revogadoEm: row.marketingRevogadoEm }),
      consentimentoEm: row.marketingConsentimentoEm ? row.marketingConsentimentoEm.toISOString() : null,
      revogadoEm: row.marketingRevogadoEm ? row.marketingRevogadoEm.toISOString() : null,
      origem: row.marketingOrigem ?? null,
    },
  }));
}

/** Ids das empreiteiras com entitlement — a chave de todo filtro de obra. */
export async function listarEmpreiteiraIdsXgestao(internas: FiltroContasInternas = 'excluir'): Promise<string[]> {
  const assinantes = await listarAssinantesXgestao({ internas });
  return assinantes.flatMap((assinante) => (assinante.empreiteiraId ? [assinante.empreiteiraId] : []));
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
