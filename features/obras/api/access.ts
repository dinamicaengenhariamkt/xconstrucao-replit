import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, obras } from "@shared/db/schema";
import { isAdminLike } from "@features/auth/api/auth-utils";

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
    const isAssigned = !!(emp && obra.empreiteiraId === emp.id);
    const isPublica = obra.visibilidade === "publicada" && obra.empreiteiraId === null;
    if (!isAssigned && !isPublica) return null;
    // Fail-closed: só libera discovery se o caller pedir explicitamente.
    if (!isAssigned && !opts.allowDiscovery) return null;
    return {
      obra,
      role: "empreiteiro",
      clienteId: null,
      empreiteiraId: emp?.id ?? null,
      isDiscoveryOnly: !isAssigned,
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
  if (access.role === "empreiteiro" && !access.isDiscoveryOnly) return true;
  return false;
}
