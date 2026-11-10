import "server-only";

import { resolverEmpresaDoUsuario } from "@features/xgestao/equipe/server/access";
import type { ObraAccess } from "./access";
import { canWriteObraArea } from "./access";
import type { PapelEmpresaOcorrencia } from "./ocorrencia-schemas";

/**
 * Edição, exclusão e reabertura existem só na obra própria do xgestão (mesma
 * regra do PATCH do diário): o marketplace segue só com criar e resolver.
 * Devolve o papel do usuário na empresa dona da obra, ou `undefined` quando a
 * gestão de ocorrências não se aplica a este acesso.
 */
export async function papelGestaoOcorrencias(
  access: ObraAccess,
  userId: string,
): Promise<PapelEmpresaOcorrencia | undefined> {
  const obraPropria =
    access.role === "empreiteiro" &&
    !!access.xgestaoPermission &&
    access.obra.clienteId === null &&
    access.obra.empreiteiraId !== null &&
    access.obra.empreiteiraId === access.empreiteiraId;
  if (!obraPropria || !canWriteObraArea(access, "ocorrencias")) return undefined;
  const empresa = await resolverEmpresaDoUsuario(userId);
  if (!empresa || empresa.empreiteiraId !== access.obra.empreiteiraId) return undefined;
  return empresa.papel;
}
