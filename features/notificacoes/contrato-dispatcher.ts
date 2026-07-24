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

/**
 * Contratante cancelou o aceite antes da assinatura completa → avisa o empreiteiro
 * que perdeu o vínculo. Recebe `userId`/`obraNome` já resolvidos por
 * `cancelarContrato`, porque no momento desta chamada a obra JÁ não aponta mais
 * para a empreiteira — não há como redescobrir a parte afetada pelo obraId.
 *
 * O href carrega `?obra=<id>` de propósito. O índice único parcial da J13
 * (`user_id, href` WHERE `lida = false`) faz o `onConflictDoNothing` de
 * `criarNotificacao` descartar uma segunda notificação com href idêntico enquanto
 * a primeira não for lida. Com um href fixo (`/empreiteiro/minhas-candidaturas`),
 * um empreiteiro que não leu o aviso de um cancelamento NUNCA seria avisado do
 * cancelamento de OUTRA obra — o dedupe de chat vazando para um evento que não é
 * repetição. Discriminar por obra mantém o dedupe onde ele faz sentido (re-cancelar
 * a mesma obra não gera aviso novo) e ainda leva o usuário à obra certa.
 */
export async function dispararNotificacaoContratoCancelado(args: {
  empreiteiroUserId: string;
  obraId: string;
  obraNome: string;
}): Promise<void> {
  try {
    await criarNotificacao({
      userId: args.empreiteiroUserId,
      tipo: "alerta",
      titulo: "Contrato cancelado",
      descricao: `O contratante cancelou o contrato da obra "${args.obraNome}" antes da assinatura das duas partes. A obra voltou ao marketplace.`,
      href: `/empreiteiro/minhas-candidaturas?obra=${args.obraId}`,
    });
  } catch (err) {
    console.error("[contrato-dispatcher] falha em contratoCancelado:", err);
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
