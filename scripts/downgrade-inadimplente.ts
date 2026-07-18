#!/usr/bin/env tsx
/**
 * Job CLI para revogar acesso de assinantes inadimplentes após período de
 * carência.
 *
 * Uso:
 *   npx tsx scripts/downgrade-inadimplente.ts [--grace-days=7]
 *
 * Configuração em produção (Replit Scheduled Deployment):
 *   - Command: npx tsx scripts/downgrade-inadimplente.ts
 *   - Schedule: diariamente (ex.: 02:00 UTC)
 *
 * O período de carência padrão é 7 dias após `renovaEm`. Pode ser sobrescrito
 * via argumento `--grace-days=N` ou pela variável de ambiente
 * `INADIMPLENTE_GRACE_DAYS`.
 *
 * Idempotente — pode rodar quantas vezes for preciso por dia.
 * Saída exit code 0 sucesso, 1 falha.
 */
import { downgradeInadimplentes } from "../features/planos/grace-period-downgrade-job";

async function main() {
  const graceDaysArg = process.argv.find((a) => a.startsWith("--grace-days="));
  const graceDays = graceDaysArg ? Number(graceDaysArg.split("=")[1]) : undefined;

  const result = await downgradeInadimplentes(graceDays);

  if (!result.ok) {
    console.error("[downgrade-inadimplente-cli] erro:", result.error);
    process.exit(1);
  }

  console.info(
    `[downgrade-inadimplente-cli] OK downgraded=${result.downgraded} runAt=${result.runAt}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[downgrade-inadimplente-cli] erro inesperado:", err);
  process.exit(1);
});
