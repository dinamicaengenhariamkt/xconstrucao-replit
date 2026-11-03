import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturas, empreiteiras, planos, xgestaoMembros } from "@shared/db/schema";
import { naoEhTesteVencido } from "@features/xgestao/teste/server/teste-service";
import { contarVagasEquipe, limiteVagasEquipe, type UsoEquipe } from "../vagas";
import { planoDaEmpresa } from "@features/xgestao/server/plano-empresa";

type Leitor = Pick<typeof db, "select">;

/** Recebe a transação do convite para contar e inserir sob o mesmo lock. */
export async function consultarVagasEquipe(
  empreiteiraId: string,
  leitor: Leitor = db,
): Promise<UsoEquipe> {
  const [empresa] = await leitor.select({ titular: empreiteiras.userId })
    .from(empreiteiras).where(eq(empreiteiras.id, empreiteiraId));
  if (!empresa?.titular) throw new Error("Empresa sem titular para contar vagas.");
  const vinculos = await leitor.select({
    userId: xgestaoMembros.userId,
    status: xgestaoMembros.status,
  }).from(xgestaoMembros).where(eq(xgestaoMembros.empreiteiraId, empreiteiraId));
  const plano = await planoDaEmpresa(empreiteiraId, leitor);
  return {
    ...contarVagasEquipe(empresa.titular, vinculos),
    // Não mapear o antigo free para Basic pago nem ativar cotas globais.
    limite: plano.somenteLeitura ? 0 : limiteVagasEquipe(plano.limites),
  };
}
