import { eq, inArray } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, obras, users } from "@shared/db/schema";
import { criarNotificacao } from "./service";

/**
 * J58 — notificações do fluxo de contrato entre as partes. Fire-and-forget seguro
 * (erros capturados). Molde de `moderacao-obra-dispatcher` (resolve o user da
 * parte por obra) e `marketplace-admin-dispatcher` (admin observa).
 */

async function resolverUserDaParte(obraId: string, papel: "contratante" | "empreiteiro"): Promise<string | null> {
  const [obra] = await db
    .select({ clienteId: obras.clienteId, empreiteiraId: obras.empreiteiraId })
    .from(obras)
    .where(eq(obras.id, obraId));
  if (!obra) return null;
  if (papel === "contratante") {
    if (!obra.clienteId) return null;
    const [cli] = await db.select({ userId: clientes.userId }).from(clientes).where(eq(clientes.id, obra.clienteId));
    return cli?.userId ?? null;
  }
  if (!obra.empreiteiraId) return null;
  const [emp] = await db.select({ userId: empreiteiras.userId }).from(empreiteiras).where(eq(empreiteiras.id, obra.empreiteiraId));
  return emp?.userId ?? null;
}

/** Avisa a parte que é a vez dela assinar o contrato da obra. */
export async function dispararNotificacaoVezDeAssinar(
  obraId: string,
  papel: "contratante" | "empreiteiro",
): Promise<void> {
  try {
    const [obra] = await db.select({ nome: obras.nome }).from(obras).where(eq(obras.id, obraId));
    if (!obra) return;
    const userId = await resolverUserDaParte(obraId, papel);
    if (!userId) return;

    const href =
      papel === "contratante"
        ? `/contratante/minhas-obras/${obraId}?tab=contrato`
        : `/empreiteiro/minhas-obras/${obraId}?tab=contrato`;

    await criarNotificacao({
      userId,
      tipo: "lembrete",
      titulo: "Assine o contrato",
      descricao: `É a sua vez de assinar o contrato da obra "${obra.nome}".`,
      href,
    });
  } catch (err) {
    console.error("[contrato-dispatcher] falha em vezDeAssinar:", err);
  }
}

/** Contrato assinado por ambos → notifica as duas partes + admins (observam). */
export async function dispararNotificacaoContratoEfetivado(obraId: string): Promise<void> {
  try {
    const [obra] = await db.select({ nome: obras.nome }).from(obras).where(eq(obras.id, obraId));
    if (!obra) return;

    const contratanteUserId = await resolverUserDaParte(obraId, "contratante");
    const empreiteiroUserId = await resolverUserDaParte(obraId, "empreiteiro");

    if (contratanteUserId) {
      await criarNotificacao({
        userId: contratanteUserId,
        tipo: "sucesso",
        titulo: "Contrato assinado",
        descricao: `O contrato da obra "${obra.nome}" foi assinado pelas duas partes. A obra foi iniciada.`,
        href: `/contratante/minhas-obras/${obraId}`,
      });
    }
    if (empreiteiroUserId) {
      await criarNotificacao({
        userId: empreiteiroUserId,
        tipo: "sucesso",
        titulo: "Contrato assinado",
        descricao: `O contrato da obra "${obra.nome}" foi assinado pelas duas partes. A obra foi iniciada.`,
        href: `/empreiteiro/minhas-obras/${obraId}`,
      });
    }

    const admins = await db.select({ id: users.id }).from(users).where(inArray(users.role, ["admin", "superadmin"]));
    for (const admin of admins) {
      await criarNotificacao({
        userId: admin.id,
        tipo: "info",
        titulo: "Contrato efetivado",
        descricao: `O contrato da obra "${obra.nome}" foi assinado pelas duas partes.`,
        href: "/admin/contratos",
      });
    }
  } catch (err) {
    console.error("[contrato-dispatcher] falha em contratoEfetivado:", err);
  }
}
