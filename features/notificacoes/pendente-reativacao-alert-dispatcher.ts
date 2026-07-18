import { and, eq, isNotNull, lt, min, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturas, users } from "@shared/db/schema";
import { criarNotificacao } from "./service";

/**
 * Verifica se há assinaturas presas em `pendente_reativacao` há mais de
 * `alertHours` horas — medido por `pendenteReativacaoAt`, o instante real em
 * que a assinatura entrou neste estado — e, em caso positivo:
 *
 *  1. Emite um `console.warn` estruturado para os logs do servidor.
 *  2. Cria uma notificação in-app do tipo "alerta" para cada admin/superadmin.
 *
 * Rows sem `pendenteReativacaoAt` (pré-existentes antes da migration) são
 * ignoradas para evitar falsos positivos imediatos.
 *
 * Fire-and-forget seguro: todos os erros são capturados internamente.
 * Chamado dentro de `downgradeInadimplentes` — awaited para garantir que
 * os logs e notificações sejam gravados antes de `process.exit(0)` no CLI.
 *
 * @param alertHours  Limiar em horas (default 72). Configurável via
 *                    `PENDENTE_REATIVACAO_ALERT_HOURS`.
 */
export async function dispararAlertePendenteReativacao(
  alertHours: number,
): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - alertHours * 60 * 60 * 1000);

    const rows = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
        oldest: min(assinaturas.pendenteReativacaoAt),
      })
      .from(assinaturas)
      .where(
        and(
          eq(assinaturas.status, "pendente_reativacao"),
          isNotNull(assinaturas.pendenteReativacaoAt),
          lt(assinaturas.pendenteReativacaoAt, cutoff),
        ),
      );

    const count = rows[0]?.count ?? 0;
    const oldest = rows[0]?.oldest ?? null;

    if (count === 0) return;

    const oldestIso = oldest instanceof Date ? oldest.toISOString() : String(oldest);
    const ageHours = oldest
      ? Math.round((Date.now() - new Date(oldest).getTime()) / (1000 * 60 * 60))
      : null;

    console.warn(
      `[pendente-reativacao-alert] ALERTA: ${count} assinatura(s) presa(s) em ` +
        `pendente_reativacao há mais de ${alertHours}h. ` +
        `Mais antiga: pendenteReativacaoAt=${oldestIso} (~${ageHours}h atrás). ` +
        `Possível falha prolongada no gateway de pagamento.`,
      { count, oldest: oldestIso, ageHours, alertHours },
    );

    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"));

    const superadmins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "superadmin"));

    const titulo = `Gateway: ${count} assinatura${count !== 1 ? "s" : ""} presa${count !== 1 ? "s" : ""} há mais de ${alertHours}h`;
    const descricao =
      `${count} assinatura${count !== 1 ? "s" : ""} permanece${count !== 1 ? "m" : ""} em pendente_reativacao ` +
      `há mais de ${alertHours}h (mais antiga: ~${ageHours}h atrás). ` +
      `Verifique o gateway de pagamento — pode haver uma falha prolongada.`;

    for (const a of [...admins, ...superadmins]) {
      await criarNotificacao({
        userId: a.id,
        tipo: "alerta",
        titulo,
        descricao,
        href: "/admin/financeiro",
      });
    }
  } catch (err) {
    console.error(
      "[pendente-reativacao-alert] falha ao verificar/notificar assinaturas presas:",
      err,
    );
  }
}

/**
 * Parseia e valida o limiar de alerta em horas.
 * Retorna 72 se o valor for inválido ou não-positivo.
 */
export function parseAlertHours(value: unknown): number {
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) return n;
  return 72;
}
