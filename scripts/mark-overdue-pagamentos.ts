/**
 * CLI standalone para promover lançamentos vencidos a `atrasado`.
 *
 * Uso:
 *   npx tsx scripts/mark-overdue-pagamentos.ts
 *
 * Configuração em produção (Replit Scheduled Deployment):
 *   - Command: npx tsx scripts/mark-overdue-pagamentos.ts
 *   - Schedule: diariamente (ex.: 03:00 UTC)
 *
 * Idempotente — pode rodar quantas vezes for preciso por dia.
 * Saída exit code 0 sucesso, 1 falha.
 */
import { markOverduePagamentos } from "../features/financeiro/mark-overdue-job";

async function main() {
  const result = await markOverduePagamentos();
  if (!result.ok) {
    console.error("[mark-overdue-cli] erro:", result.error);
    process.exit(1);
  }
  console.info(`[mark-overdue-cli] OK updated=${result.updated} runAt=${result.runAt}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[mark-overdue-cli] erro inesperado:", err);
  process.exit(1);
});
