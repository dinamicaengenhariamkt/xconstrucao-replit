#!/usr/bin/env tsx
/**
 * Job CLI para notificar assinantes inadimplentes que têm acesso expirando
 * em breve (3 dias antes do término da carência).
 *
 * Uso:
 *   npx tsx scripts/aviso-expiracao-inadimplente.ts [--grace-days=7]
 *
 * Configuração em produção (Replit Scheduled Deployment):
 *   - Command: npx tsx scripts/aviso-expiracao-inadimplente.ts
 *   - Schedule: diariamente (ex.: 01:00 UTC — antes do downgrade job às 02:00)
 *
 * O período de carência padrão é 7 dias após `renovaEm`. Pode ser sobrescrito
 * via argumento `--grace-days=N` ou pela variável de ambiente
 * `INADIMPLENTE_GRACE_DAYS`.
 *
 * Idempotente — pode rodar quantas vezes for preciso por dia.
 * Saída exit code 0 sucesso, 1 falha.
 */
import { notificarInadimplentesExpirando } from "../features/planos/aviso-expiracao-job";

async function main() {
  const graceDaysArg = process.argv.find((a) => a.startsWith("--grace-days="));
  const graceDays = graceDaysArg
    ? Number(graceDaysArg.split("=")[1])
    : undefined;

  const result = await notificarInadimplentesExpirando(graceDays);

  if (!result.ok) {
    console.error("[aviso-expiracao-cli] erro:", result.error);
    process.exit(1);
  }

  console.info(
    `[aviso-expiracao-cli] OK notified=${result.notified} skipped=${result.skipped} runAt=${result.runAt}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[aviso-expiracao-cli] erro inesperado:", err);
  process.exit(1);
});
