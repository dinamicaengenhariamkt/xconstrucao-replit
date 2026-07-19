import { sql } from "drizzle-orm";
import { inArray } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { criarNotificacao } from "@features/notificacoes/service";
import { sendWebhookDeadAlertEmail } from "@shared/lib/email";

// Mirror of the constants in webhook-retry-job (avoid circular imports).
const MAX_RETRIES = 5;
const RETRY_WINDOW_HOURS = 24;

export type DeadWebhookRow = {
  id: string;
  gateway_event_id: string;
  event_type: string;
  retry_count: number;
  [key: string]: unknown;
};

/**
 * Marks exhausted/expired webhook rows as 'dead' and fires admin notifications.
 *
 * Two-phase design (addresses notification reliability):
 *   Phase 1 — Mark rows as dead (status='dead', marked_dead_at=NOW()).
 *              dead_notified_at is intentionally left NULL so that if Phase 2
 *              fails entirely the next run can re-attempt notification.
 *   Phase 2 — Notify admins. Only after at least one in-app notification
 *              succeeds, stamp dead_notified_at=NOW() to prevent duplicate
 *              alerts on subsequent runs.
 *
 * Idempotent: rows already dead (marked_dead_at IS NOT NULL) are skipped in
 * Phase 1; rows already notified (dead_notified_at IS NOT NULL) are skipped
 * in Phase 2.
 */
export async function markAndNotifyDeadWebhooks(): Promise<{
  marked: number;
  notified: number;
}> {
  try {
    // ── Phase 1: mark rows as dead (no dead_notified_at yet) ─────────
    const markResult = await db.execute<DeadWebhookRow>(sql`
      UPDATE webhook_delivery_log
         SET status         = 'dead',
             marked_dead_at = NOW()
       WHERE status IN ('pending', 'failed')
         AND (
           retry_count >= ${MAX_RETRIES}
           OR created_at <= NOW() - INTERVAL '${sql.raw(String(RETRY_WINDOW_HOURS))} hours'
         )
         AND marked_dead_at IS NULL
    RETURNING id, gateway_event_id, event_type, retry_count
    `);

    const justMarked = markResult.rows as DeadWebhookRow[];

    // ── Phase 2: notify for any dead row not yet notified ─────────────
    // This covers both rows just marked AND rows marked in prior runs where
    // notifications failed (dead_notified_at IS NULL).
    const pendingNotifyResult = await db.execute<DeadWebhookRow>(sql`
      SELECT id, gateway_event_id, event_type, retry_count
        FROM webhook_delivery_log
       WHERE status = 'dead'
         AND dead_notified_at IS NULL
    `);

    const toNotify = pendingNotifyResult.rows as DeadWebhookRow[];

    if (justMarked.length > 0) {
      console.warn(
        `[webhook-dead-notifier] ${justMarked.length} evento(s) marcados como dead-letter:`,
        justMarked.map((r) => `${r.event_type}/${r.gateway_event_id}`).join(", "),
      );
    }

    let notified = 0;
    if (toNotify.length > 0) {
      const anySuccess = await _notifyAdmins(toNotify);
      if (anySuccess) {
        // Stamp dead_notified_at only after at least one notification succeeded.
        const ids = toNotify.map((r) => r.id);
        await db
          .execute(sql`
            UPDATE webhook_delivery_log
               SET dead_notified_at = NOW()
             WHERE id = ANY(${ids}::varchar[])
               AND dead_notified_at IS NULL
          `)
          .catch((err) =>
            console.error("[webhook-dead-notifier] falha ao stampar dead_notified_at:", err),
          );
        notified = toNotify.length;
      }
    }

    return { marked: justMarked.length, notified };
  } catch (err) {
    console.error("[webhook-dead-notifier] erro ao marcar/notificar dead webhooks:", err);
    return { marked: 0, notified: 0 };
  }
}

/**
 * Sends in-app and email notifications to all admin/superadmin users.
 * Returns true if at least one in-app notification was created successfully.
 */
async function _notifyAdmins(dead: DeadWebhookRow[]): Promise<boolean> {
  try {
    const admins = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.role, ["admin", "superadmin"]));

    if (admins.length === 0) return false;

    const count = dead.length;
    const titulo =
      count === 1
        ? `Webhook não processado: ${dead[0].event_type}`
        : `${count} webhooks de pagamento não processados`;
    const descricao =
      count === 1
        ? `Evento ${dead[0].gateway_event_id} (${dead[0].event_type}) esgotou ${dead[0].retry_count} tentativas e foi marcado como dead-letter. Revisão manual necessária.`
        : `${count} eventos de webhook esgotaram todas as tentativas e foram marcados como dead-letter. Acesse o painel de saúde para revisar.`;

    let anyNotified = false;

    for (const admin of admins) {
      // In-app notification
      const created = await criarNotificacao({
        userId: admin.id,
        tipo: "alerta",
        titulo,
        descricao,
        href: "/admin/saude",
      }).catch((err) => {
        console.error(
          `[webhook-dead-notifier] falha ao criar notificação para admin ${admin.id}:`,
          err,
        );
        return null;
      });

      if (created) anyNotified = true;

      // Email notification (best-effort — silently skip if no BREVO_API_KEY)
      if (admin.email && process.env.BREVO_API_KEY) {
        await sendWebhookDeadAlertEmail(admin.email, {
          adminName: admin.name ?? "Administrador",
          count,
          events: dead.map((r) => ({
            id: r.id,
            eventType: r.event_type,
            gatewayEventId: r.gateway_event_id,
            retryCount: r.retry_count,
          })),
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/saude`,
        }).catch((err) =>
          console.error(
            `[webhook-dead-notifier] falha ao enviar email para admin ${admin.email}:`,
            err,
          ),
        );
      }
    }

    return anyNotified;
  } catch (err) {
    console.error("[webhook-dead-notifier] erro ao notificar admins:", err);
    return false;
  }
}
