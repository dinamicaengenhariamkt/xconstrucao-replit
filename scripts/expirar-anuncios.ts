/**
 * CLI standalone para expirar anúncios cujo período de veiculação terminou (J31).
 *
 * Uso:
 *   npx tsx scripts/expirar-anuncios.ts
 *
 * Configuração em produção (Replit Scheduled Deployment):
 *   - Command: npx tsx scripts/expirar-anuncios.ts
 *   - Schedule: diariamente (ex.: 03:00 UTC)
 *
 * Idempotente — pode rodar quantas vezes for preciso por dia.
 * Saída exit code 0 sucesso, 1 falha.
 */
import { expirarAnuncios } from "../features/anuncios/expirar-anuncios-job";

async function main() {
  const result = await expirarAnuncios();
  if (!result.ok) {
    console.error("[expirar-anuncios-cli] erro:", result.error);
    process.exit(1);
  }
  console.info(`[expirar-anuncios-cli] OK updated=${result.updated} runAt=${result.runAt}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[expirar-anuncios-cli] erro inesperado:", err);
  process.exit(1);
});
