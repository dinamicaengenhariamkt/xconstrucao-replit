// XG06 — Escopo administrativo.
//
// PROBLEMA: `app/admin/**` tem 20 seções e 94 rotas em `app/api/admin/**`, todas
// gateadas pelo mesmo predicado `isAdminLike`. Precisamos de um admin que enxergue
// apenas o recorte do xgestão, sem tocar nos 223 call sites de `isAdminLike` e sem
// alterar o comportamento de nenhum admin existente.
//
// DECISÃO: escopo é uma dimensão ORTOGONAL a role, não um role novo.
//   - `isAdminLike(role)` continua respondendo "esta pessoa é admin?" → segue true.
//   - `users.role` continua "admin" → JWT, proxy.ts PROTECTED_PAGES e
//     redirect-by-role.ts não mudam em nada.
//   - `users.admin_escopo` default 'global' → todo admin existente mantém acesso
//     total sem um único UPDATE no banco.
//
// Um role novo no `userRoleEnum` teria feito os 223 call sites negarem o usuário
// (403 em tudo, inclusive no que ele deve ver); e "consertar" isso incluindo o
// valor em `isAdminLike` abriria as 94 rotas do marketplace de uma vez — escalação
// de privilégio. Daí a coluna.

export type AdminEscopo = "global" | "xgestao";

/** Formato mínimo do ator — serve tanto para linha de `users` quanto para claims do JWT. */
export interface AdminScopeActor {
  role?: string | null;
  adminEscopo?: string | null;
}

/**
 * Resolve o escopo efetivo do ator.
 *
 * Duas travas de segurança, ambas na direção permissiva//global (fail-safe):
 *   1. Superadmin é SEMPRE "global" — não é restringível, mesmo que alguém grave
 *      'xgestao' na coluna dele. Mesma blindagem que `session-issuer.ts:32` aplica
 *      a `canManageUsers`.
 *   2. Valor ausente, nulo ou desconhecido ⇒ "global". Tokens emitidos ANTES desta
 *      migration não têm a claim; eles têm de continuar funcionando como sempre.
 *      É isso que dispensa rotação de token no deploy.
 */
export function getAdminEscopo(actor: AdminScopeActor | null | undefined): AdminEscopo {
  if (!actor) return "global";
  if (actor.role === "superadmin") return "global";
  return actor.adminEscopo === "xgestao" ? "xgestao" : "global";
}

export function isAdminGlobal(actor: AdminScopeActor | null | undefined): boolean {
  return getAdminEscopo(actor) === "global";
}

export function isAdminXgestao(actor: AdminScopeActor | null | undefined): boolean {
  return getAdminEscopo(actor) === "xgestao";
}

/**
 * ALLOWLIST POSITIVA dos prefixos que o escopo "xgestao" pode tocar.
 *
 * Positiva, nunca denylist: uma rota admin criada amanhã, sem nenhum conhecimento
 * de escopo, é automaticamente NEGADA ao escopo restrito e permitida ao global.
 * O default é seguro nas duas pontas.
 *
 * Fora da v1 de propósito:
 *   /admin/configuracoes — 1300+ linhas controlando a plataforma inteira, incluindo
 *     o toggle `marketplaceVisivel`. Dar isso a um admin restrito anula a restrição.
 *   /admin/obras — rota compartilhada com o marketplace; forçar `produto=xgestao`
 *     server-side é risco de vazamento por parâmetro. XG06 já entrega a listagem
 *     dentro de /admin/xgestao.
 */
export const XGESTAO_ADMIN_PREFIXES: readonly string[] = [
  "/admin/xgestao",
  "/api/admin/xgestao",
];

/**
 * O pathname está liberado para este escopo?
 *
 * "global" ⇒ SEMPRE true. Esta é a garantia de retrocompatibilidade: para 100% dos
 * admins de hoje esta função é um no-op.
 */
export function adminEscopoPodeAcessar(escopo: AdminEscopo, pathname: string): boolean {
  if (escopo === "global") return true;
  return XGESTAO_ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Conveniência: resolve o escopo do ator e checa o caminho num passo só. */
export function adminPodeAcessar(
  actor: AdminScopeActor | null | undefined,
  pathname: string,
): boolean {
  return adminEscopoPodeAcessar(getAdminEscopo(actor), pathname);
}
