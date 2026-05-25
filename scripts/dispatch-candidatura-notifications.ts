#!/usr/bin/env tsx
/**
 * Fallback dispatcher para notificações de candidaturas decididas.
 *
 * Uso:
 *   npx tsx scripts/dispatch-candidatura-notifications.ts [--limit=200]
 *
 * Pensado para Replit Scheduled Deployment (mesmo padrão de
 * `mark-overdue-pagamentos.ts`). Idempotente — só envia quando a flag
 * `notificacao_disparada=false` AND `decidida_em IS NOT NULL`.
 */
import { dispatchPendingCandidaturaNotifications } from "../features/notificacoes/candidatura-dispatcher";

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 200;

  const res = await dispatchPendingCandidaturaNotifications({ limit });
  console.info(
    `[dispatch-candidatura-notifications] checked=${res.checked} sent=${res.sent} silent=${res.silent} failed=${res.failed}`,
  );

  if (res.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("[dispatch-candidatura-notifications] fatal:", err);
  process.exit(1);
});
