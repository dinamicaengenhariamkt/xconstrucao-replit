import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { empreiteiras } from "@shared/db/schema";
import { listarIdsObrasPermitidas, resolverEmpresaDoUsuario } from "@features/xgestao/equipe/server/access";

/**
 * Escopo de leitura das telas agregadas do empreiteiro. O vínculo ativo da
 * equipe xgestão tem prioridade; o perfil próprio continua disponível para
 * donos que usam apenas o marketplace (sem entitlement xgestão).
 */
export async function resolverEscopoObrasEmpreiteiro(userId: string) {
  const empresa = await resolverEmpresaDoUsuario(userId);
  if (empresa) {
    const isMember = empresa.papel !== "dono";
    return {
      empreiteiraId: empresa.empreiteiraId,
      donoUserId: empresa.donoUserId,
      isMember,
      allowedIds: isMember ? await listarIdsObrasPermitidas(userId, empresa.empreiteiraId) : null,
    };
  }

  const [owner] = await db
    .select({ empreiteiraId: empreiteiras.id, donoUserId: empreiteiras.userId })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, userId));
  if (!owner?.donoUserId) return null;
  return { ...owner, isMember: false, allowedIds: null };
}