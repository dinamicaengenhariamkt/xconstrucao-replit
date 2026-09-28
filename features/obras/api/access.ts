import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, obras } from "@shared/db/schema";
import { isAdminLike, userHasRole } from "@features/auth/api/auth-utils";
import {
  resolverAcessoObraXgestao,
  resolverEmpresaDoUsuario,
  resolverPermissoesObraXgestao,
} from "@features/xgestao/equipe/server/access";
import type {
  AreaXgestao,
  AreasPermitidas,
  CategoriasFinanceiroPermitidas,
} from "@features/xgestao/equipe/permissions";

/**
 * Resolve acesso de leitura/escrita a uma obra para qualquer persona.
 * - admin/superadmin: sempre liberado.
 * - contratante: precisa ser o dono via `clientes.userId`.
 * - empreiteiro: precisa estar atribuído (obra.empreiteiraId === minha empreiteira)
 *   OU a obra precisa estar publicada e sem empreiteira (descoberta).
 *
 * Para gates de ESCRITA (diário, fotos, ocorrências) use `assertWriteAccess`
 * que devolve true só para autor legítimo (admin, contratante dono ou
 * empreiteiro atribuído — empreiteiro só vê descoberta como leitura).
 */
export type ObraAccess = {
  obra: typeof obras.$inferSelect;
  role: "admin" | "superadmin" | "contratante" | "empreiteiro";
  clienteId: string | null;
  empreiteiraId: string | null;
  /** Empreiteiro que apenas descobriu a obra (publicada/sem vínculo). */
  isDiscoveryOnly: boolean;
  /** Obra própria xgestão: concessão específica (ou acesso integral do dono/gestor). */
  xgestaoPermission?: "visualizar" | "editar";
  /** null means unrestricted (also the legacy/default behavior). */
  xgestaoAreasPermitidas?: AreasPermitidas;
  /** null means all finance categories are visible and writable. */
  xgestaoCategoriasFinanceiroPermitidas?: CategoriasFinanceiroPermitidas;
};

/**
 * Opções de `findObraAccess`.
 * - `allowDiscovery` (default **false**): quando true, empreiteiro **não** atribuído
 *   à obra recebe acesso de leitura desde que a obra esteja publicada
 *   (modo descoberta — usado por telas de marketplace).
 *   Endpoints de conteúdo interno da obra (J06: etapas/diário/ocorrências/fotos)
 *   devem manter o default `false` para impedir vazamento de dados.
 */
export type FindObraAccessOptions = { allowDiscovery?: boolean };

export async function findObraAccess(
  obraId: string,
  user: { id: string; role: string },
  opts: FindObraAccessOptions = {},
): Promise<ObraAccess | null> {
  const [obra] = await db.select().from(obras).where(eq(obras.id, obraId));
  if (!obra) return null;

  if (isAdminLike(user.role)) {
    return {
      obra,
      role: user.role === "superadmin" ? "superadmin" : "admin",
      clienteId: null,
      empreiteiraId: null,
      isDiscoveryOnly: false,
    };
  }

  if (user.role === "contratante") {
    const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, user.id));
    if (!cli || obra.clienteId !== cli.id) return null;
    return { obra, role: "contratante", clienteId: cli.id, empreiteiraId: null, isDiscoveryOnly: false };
  }

  if (user.role === "empreiteiro") {
    const [emp] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, user.id));
    const isXgestao = obra.clienteId === null && obra.empreiteiraId !== null;
    const company = isXgestao ? await resolverEmpresaDoUsuario(user.id) : null;
    const xgestaoPermission = isXgestao && company?.empreiteiraId === obra.empreiteiraId
      ? await resolverAcessoObraXgestao(user.id, obraId)
      : null;
    const isAssigned = isXgestao
      ? xgestaoPermission !== null
      : !!(emp && obra.empreiteiraId === emp.id);
    const isPublica =
      obra.visibilidade === "publicada" &&
      obra.empreiteiraId === null &&
      obra.statusModeracao === "aprovada";
    if (!isAssigned && !isPublica) return null;
    // Fail-closed: só libera discovery se o caller pedir explicitamente.
    if (!isAssigned && !opts.allowDiscovery) return null;
    // Uma obra sem contratante pertence ao xgestão. Mantemos o entitlement no
    // caminho de conteúdo para que revogar o produto também revogue operação,
    // sem alterar o acesso a obras marketplace atribuídas.
    if (isAssigned && isXgestao && !(await userHasRole(user.id, "xgestao"))) {
      return null;
    }
    const xgestaoAreaPermissions = isAssigned && isXgestao
      ? await resolverPermissoesObraXgestao(user.id, obraId)
      : null;
    if (isAssigned && isXgestao && !xgestaoAreaPermissions) return null;
    return {
      obra,
      role: "empreiteiro",
      clienteId: null,
      empreiteiraId: isXgestao ? company?.empreiteiraId ?? null : emp?.id ?? null,
      isDiscoveryOnly: !isAssigned,
      ...(isXgestao && xgestaoPermission ? {
        xgestaoPermission,
        xgestaoAreasPermitidas: xgestaoAreaPermissions?.areasPermitidas ?? null,
        xgestaoCategoriasFinanceiroPermitidas:
          xgestaoAreaPermissions?.categoriasFinanceiroPermitidas ?? null,
      } : {}),
    };
  }

  return null;
}

/**
 * True quando o usuário pode CRIAR/EDITAR conteúdo da obra
 * (etapas/diário/fotos/ocorrências).
 *  - admin/superadmin
 *  - contratante dono
 *  - empreiteiro atribuído (NÃO descoberta)
 */
export function canWriteObraContent(access: ObraAccess): boolean {
  if (access.role === "admin" || access.role === "superadmin") return true;
  if (access.role === "contratante") return true;
  if (access.role === "empreiteiro" && !access.isDiscoveryOnly) {
    return access.xgestaoPermission !== "visualizar";
  }
  return false;
}

/** Tests a scoped xgestão area permission after the obra itself was authorized. */
export function canAccessObraArea(access: ObraAccess, area: AreaXgestao): boolean {
  if (access.role !== "empreiteiro" || !access.xgestaoPermission) return true;
  return access.xgestaoAreasPermitidas == null || access.xgestaoAreasPermitidas.includes(area);
}

export function canWriteObraArea(access: ObraAccess, area: AreaXgestao): boolean {
  return canWriteObraContent(access) && canAccessObraArea(access, area);
}

/** Finance-category checks are separate from area checks to prevent data leaks. */
export function canAccessObraFinanceCategory(access: ObraAccess, category: string | null): boolean {
  if (access.role !== "empreiteiro" || !access.xgestaoPermission) return true;
  const allowed = access.xgestaoCategoriasFinanceiroPermitidas;
  return allowed == null || (category !== null && allowed.includes(category as "mao_de_obra"));
}

/**
 * Strip summaries embedded in generic obra payloads when their source area is
 * restricted. Detailed area APIs can still return their scoped rows directly.
 */
export function filterObraPayloadByAreas<T extends object>(access: ObraAccess, payload: T): T {
  const result = { ...payload } as Record<string, unknown>;
  if (!canAccessObraArea(access, "cronograma")) {
    for (const key of [
      "progresso", "progressoDisponivel", "tarefasPendentes", "tarefasEmAndamento",
      "tarefasTotal", "tarefas", "etapas", "checklists", "atividades",
    ]) delete result[key];
  }
  if (!canAccessObraArea(access, "diario")) {
    delete result.timeline;
    delete result.fotos;
    delete result.fotoCapaFileId;
  }
  if (!canAccessObraArea(access, "ocorrencias")) {
    for (const key of [
      "ocorrencias", "ocorrenciasAbertas", "problemasAbertos", "problemasPorGravidade", "status",
    ]) {
      delete result[key];
    }
  }
  if (!canAccessObraArea(access, "equipe")) {
    delete result.equipe;
    delete result.equipeAtiva;
  }
  if (
    !canAccessObraArea(access, "financeiro") ||
    (access.role === "empreiteiro" && access.xgestaoCategoriasFinanceiroPermitidas != null)
  ) {
    for (const key of [
      "orcamento", "valorTotal", "custoReal", "consumoOrcamento", "valorPago", "aReceber", "financeiro",
    ]) delete result[key];
  }
  return result as T;
}
