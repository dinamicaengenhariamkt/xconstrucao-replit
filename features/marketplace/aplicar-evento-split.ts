import { eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { financeiro, obras, pagamentosSplit } from "@shared/db/schema";
import { criarNotificacao } from "@features/notificacoes/service";

/**
 * J48 — Aplica o evento de pagamento de OBRA (split) vindo do webhook Asaas.
 * Localiza `pagamentos_split` por `asaas_payment_id`, e na confirmação:
 *   - marca o split `confirmado`,
 *   - seta `financeiro.status='pago'` (metodoPagamento='asaas_split'),
 *   - RECOMPUTA `obras.valorPago` a partir de `financeiro` (fonte de verdade —
 *     nunca incremento avulso, para não divergir em reprocessamento),
 *   - notifica o empreiteiro.
 * Em falha de pagamento, marca o split `falhou` (o financeiro segue pendente).
 *
 * NÃO toca o fluxo de assinatura (esse é aplicarEventoWebhook). A idempotência
 * é dupla: `webhook_delivery_log` (upstream) + transição condicional de status
 * aqui (só age quando o split está `pendente`).
 */
export async function aplicarEventoSplit(evt: {
  eventId: string;
  type: "payment_succeeded" | "payment_failed";
  asaasPaymentId?: string;
  splitId?: string;
}): Promise<{ processed: boolean }> {
  let notif: { userId: string; obraNome: string | null } | null = null;

  const result = await db.transaction(async (tx) => {
    // Localiza por asaas_payment_id (preferido) ou pelo splitId do externalReference.
    const [split] = await tx
      .select()
      .from(pagamentosSplit)
      .where(
        evt.asaasPaymentId
          ? eq(pagamentosSplit.asaasPaymentId, evt.asaasPaymentId)
          : eq(pagamentosSplit.id, evt.splitId ?? ""),
      )
      .limit(1);

    if (!split) {
      console.warn(`[split-webhook] pagamento_split não encontrado (${evt.eventId})`);
      return { processed: false };
    }

    // ── Falha de pagamento ──────────────────────────────────────────────────
    if (evt.type === "payment_failed") {
      if (split.status === "falhou") return { processed: false }; // idempotente
      await tx
        .update(pagamentosSplit)
        .set({ status: "falhou", updatedAt: new Date() })
        .where(eq(pagamentosSplit.id, split.id));
      console.info(`[split-webhook] split ${split.id} → falhou`);
      return { processed: true };
    }

    // ── Confirmação de pagamento ────────────────────────────────────────────
    // Idempotência: só age na transição pendente→confirmado.
    if (split.status !== "pendente") return { processed: false };

    await tx
      .update(pagamentosSplit)
      .set({ status: "confirmado", confirmadoEm: new Date(), updatedAt: new Date() })
      .where(eq(pagamentosSplit.id, split.id));

    // Marca o lançamento do caixa como pago (fonte de verdade do financeiro).
    if (split.financeiroId) {
      await tx
        .update(financeiro)
        .set({
          status: "pago",
          dataPagamento: new Date().toISOString().slice(0, 10),
          metodoPagamento: "asaas_split",
        })
        .where(eq(financeiro.id, split.financeiroId));
    }

    // Recomputa obras.valorPago a partir de financeiro (mesma lógica de
    // quitarLancamento — recompute, nunca incremento, para ser idempotente).
    if (split.obraId) {
      await tx.execute(
        sql`UPDATE obras
            SET valor_pago = (
              SELECT COALESCE(SUM(valor::numeric), 0)
              FROM financeiro
              WHERE obra_id = ${split.obraId}
                AND status  = 'pago'
                AND tipo    = 'saida'
            )
            WHERE id = ${split.obraId}`,
      );
    }

    // Prepara notificação pós-commit ao empreiteiro recebedor.
    if (split.recebedorUserId) {
      const obraNome = split.obraId
        ? (await tx.select({ nome: obras.nome }).from(obras).where(eq(obras.id, split.obraId)).limit(1))[0]?.nome ?? null
        : null;
      notif = { userId: split.recebedorUserId, obraNome };
    }

    console.info(`[split-webhook] split ${split.id} → confirmado (financeiro=${split.financeiroId})`);
    return { processed: true };
  });

  if (result.processed && notif) {
    const n = notif as { userId: string; obraNome: string | null };
    void criarNotificacao({
      userId: n.userId,
      tipo: "sucesso",
      titulo: "Pagamento recebido",
      descricao: n.obraNome
        ? `Você recebeu um pagamento pela obra "${n.obraNome}". O valor foi creditado na sua conta de recebimento.`
        : "Você recebeu um pagamento de obra. O valor foi creditado na sua conta de recebimento.",
      href: null,
    }).catch(() => {
      // fire-and-forget: não bloqueia o webhook
    });
  }

  return result;
}
