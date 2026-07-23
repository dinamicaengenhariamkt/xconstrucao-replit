import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, obras } from "@shared/db/schema";
import { criarNotificacao } from "./service";

/**
 * Notifica o contratante DONO da obra sobre a decisão de moderação (J57).
 *
 * Fire-and-forget seguro — todos os erros são capturados internamente; o caller
 * dispara com `void dispararNotificacaoModeracaoObra(...).catch(...)` após o
 * commit da transação de aprovação/rejeição, sem bloquear a resposta.
 *
 * Resolve o owner via `obras.clienteId → clientes.userId` (mesmo padrão de
 * `nova-obra-zona-dispatcher`). Idempotência in-app garantida pelo índice
 * parcial `uniq_notificacoes_user_href_unread` dentro de `criarNotificacao`.
 *
 * href aponta para o detalhe da obra na visão do contratante, de forma que o
 * clique no NotificationCard leva direto ao contexto.
 */
export async function dispararNotificacaoModeracaoObra(
  obraId: string,
  decisao: "aprovada" | "rejeitada",
  motivo?: string | null,
): Promise<void> {
  try {
    const [obra] = await db
      .select({ id: obras.id, nome: obras.nome, clienteId: obras.clienteId })
      .from(obras)
      .where(eq(obras.id, obraId));
    if (!obra || !obra.clienteId) return;

    const [cli] = await db
      .select({ userId: clientes.userId })
      .from(clientes)
      .where(eq(clientes.id, obra.clienteId));
    const ownerUserId = cli?.userId ?? null;
    if (!ownerUserId) return;

    const href = `/contratante/minhas-obras/${obra.id}`;

    if (decisao === "aprovada") {
      await criarNotificacao({
        userId: ownerUserId,
        tipo: "sucesso",
        titulo: "Obra aprovada",
        descricao: `A obra "${obra.nome}" foi aprovada e já está no marketplace.`,
        href,
      });
    } else {
      const motivoTrim = motivo?.trim();
      const descricao = motivoTrim
        ? `A obra "${obra.nome}" foi rejeitada na moderação. Motivo: ${motivoTrim}`
        : `A obra "${obra.nome}" foi rejeitada na moderação.`;
      await criarNotificacao({
        userId: ownerUserId,
        tipo: "alerta",
        titulo: "Obra rejeitada",
        descricao,
        href,
      });
    }
  } catch (err) {
    console.error("[moderacao-obra-dispatcher] falha ao notificar contratante:", err);
  }
}
