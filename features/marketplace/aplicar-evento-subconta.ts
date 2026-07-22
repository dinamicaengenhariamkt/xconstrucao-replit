import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { asaasSubcontas, type AsaasSubconta } from "@shared/db/schema";
import { criarNotificacao } from "@features/notificacoes/service";

/**
 * J46 — Aplica um evento de status de subconta (KYC) do Asaas.
 * Localiza a subconta por `asaas_account_id`, transiciona
 * `onboarding_status`/`kyc_status` e notifica o empreiteiro.
 *
 * NÃO toca o fluxo de assinatura (esse é aplicarEventoWebhook). A idempotência
 * de entrega é garantida upstream por `webhook_delivery_log`; aqui a transição
 * é condicional (não re-notifica se o status já era o final).
 */
export async function aplicarEventoSubconta(evt: {
  eventId: string;
  accountId?: string;
  accountStatus?: "approved" | "rejected" | "pending";
}): Promise<{ processed: boolean }> {
  if (!evt.accountId) {
    console.warn(`[subconta-webhook] evento sem accountId (${evt.eventId}) — ignorado`);
    return { processed: false };
  }

  // Notificação a disparar após o commit (fire-and-forget).
  let notif: { userId: string; kind: "aprovada" | "rejeitada" } | null = null;

  const result = await db.transaction(async (tx) => {
    const [sub] = await tx
      .select()
      .from(asaasSubcontas)
      .where(eq(asaasSubcontas.asaasAccountId, evt.accountId!))
      .limit(1);

    if (!sub) {
      console.warn(`[subconta-webhook] subconta não encontrada p/ accountId=${evt.accountId}`);
      return { processed: false };
    }

    const novo = mapStatus(evt.accountStatus, sub.onboardingStatus);
    // Idempotência: se o status não muda, não reaplica nem re-notifica.
    if (novo === sub.onboardingStatus) return { processed: false };

    await tx
      .update(asaasSubcontas)
      .set({
        onboardingStatus: novo,
        kycStatus: evt.accountStatus ?? sub.kycStatus,
        updatedAt: new Date(),
      })
      .where(eq(asaasSubcontas.id, sub.id));

    if (novo === "aprovada") notif = { userId: sub.userId, kind: "aprovada" };
    else if (novo === "rejeitada") notif = { userId: sub.userId, kind: "rejeitada" };

    console.info(`[subconta-webhook] subconta ${sub.id}: ${sub.onboardingStatus} → ${novo}`);
    return { processed: true };
  });

  if (result.processed && notif) {
    const n = notif as { userId: string; kind: "aprovada" | "rejeitada" };
    const aprovada = n.kind === "aprovada";
    void criarNotificacao({
      userId: n.userId,
      tipo: aprovada ? "sucesso" : "alerta",
      titulo: aprovada ? "Recebimento aprovado" : "Pendência no seu recebimento",
      descricao: aprovada
        ? "Sua conta de recebimento foi aprovada. Você já pode receber pagamentos de obras."
        : "Há uma pendência na verificação da sua conta de recebimento. Revise seus dados em Configurações → Recebimentos.",
      href: null,
    }).catch(() => {
      // fire-and-forget: não bloqueia o webhook
    });
  }

  return result;
}

/**
 * Transição de status a partir do evento normalizado. Só a aprovação GERAL
 * leva a `aprovada`; rejeição leva a `rejeitada`; etapas intermediárias mantêm
 * `aguardando_kyc` (nunca regride de aprovada por um evento intermediário).
 */
function mapStatus(
  accountStatus: "approved" | "rejected" | "pending" | undefined,
  atual: AsaasSubconta["onboardingStatus"],
): AsaasSubconta["onboardingStatus"] {
  if (accountStatus === "approved") return "aprovada";
  if (accountStatus === "rejected") return "rejeitada";
  // pending/intermediário: se já aprovada, não regride; senão, aguardando_kyc.
  return atual === "aprovada" ? "aprovada" : "aguardando_kyc";
}
