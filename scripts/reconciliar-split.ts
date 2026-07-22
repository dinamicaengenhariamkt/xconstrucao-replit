#!/usr/bin/env tsx
/**
 * Job CLI de reconciliação de split (J50).
 *
 * Uso:
 *   npx tsx scripts/reconciliar-split.ts [--limit=50]
 *
 * Configuração em produção (Replit Scheduled Deployment):
 *   - Command: npx tsx scripts/reconciliar-split.ts
 *   - Schedule: a cada hora (ou frequência desejada)
 *
 * Varre `pagamentos_split` presos em `pendente` (com asaas_payment_id, criados
 * há 15min–72h), consulta o status real no Asaas e, se confirmado, recupera o
 * pagamento reaplicando aplicarEventoSplit. Idempotente — pode rodar sempre.
 * No-op quando MARKETPLACE_SPLIT não está habilitado.
 * Saída exit code 0 sucesso, 1 falha.
 */
import { reconciliarSplitsPendentes } from "../features/marketplace/reconciliacao-split-job";

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 50;

  console.info(`[reconciliar-split-cli] iniciando (limit=${limit})`);

  const result = await reconciliarSplitsPendentes(limit);

  if (!result.ok) {
    console.error("[reconciliar-split-cli] erro:", result.error);
    process.exit(1);
  }

  console.info(
    `[reconciliar-split-cli] OK verificados=${result.verificados} recuperados=${result.recuperados} falhas=${result.falhas} runAt=${result.runAt}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[reconciliar-split-cli] erro inesperado:", err);
  process.exit(1);
});
