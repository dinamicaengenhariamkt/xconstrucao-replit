import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturas, empreiteiras, planos, xgestaoMembros } from "@shared/db/schema";
import { naoEhTesteVencido } from "@features/xgestao/teste/server/teste-service";
import { contarVagasEquipe, limiteVagasEquipe, type UsoEquipe } from "../vagas";

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
  const [assinatura] = await leitor.select({ limites: planos.limitesJson })
    .from(assinaturas).innerJoin(planos, eq(planos.id, assinaturas.planoId))
    .where(and(
      eq(assinaturas.userId, empresa.titular),
      eq(assinaturas.persona, "xgestao"),
      eq(planos.persona, "xgestao"),
      eq(assinaturas.status, "ativa"),
      naoEhTesteVencido(),
    )).limit(1);
  return {
    ...contarVagasEquipe(empresa.titular, vinculos),
    // Não mapear o antigo free para Basic pago nem ativar cotas globais.
    limite: assinatura ? limiteVagasEquipe(assinatura.limites) : null,
  };
}
