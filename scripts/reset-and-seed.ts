/**
 * Reset destrutivo + reseed.
 *
 * Apaga TODOS os dados nas tabelas de usuário/auth/dominio (em ordem
 * compatível com as FKs) e em seguida roda `seedDatabase()` que recria
 * admin/joão/maria com as senhas fortes alinhadas à política "balanced".
 *
 * Uso (dev):    DATABASE_URL=... npx tsx scripts/reset-and-seed.ts
 * Uso (prod):   DATABASE_URL=<prod> CONFIRM_PROD_RESET=YES npx tsx scripts/reset-and-seed.ts
 */
import { db } from "../server/db";
import {
  users,
  clientes,
  empreiteiras,
  obras,
  financeiro,
  candidaturas,
  marketplaceLeads,
  accounts,
  sessions,
  verificationTokens,
} from "../shared/db/schema";
import { seedDatabase } from "../server/seed";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const looksProd =
    /\.prod\b|production/i.test(url) || process.env.NODE_ENV === "production";

  if (looksProd && process.env.CONFIRM_PROD_RESET !== "YES") {
    console.error(
      "[reset-and-seed] DATABASE_URL parece de produção e CONFIRM_PROD_RESET != YES. Abortando."
    );
    process.exit(1);
  }

  console.log("[reset-and-seed] Apagando tabelas (ordem FK-safe)...");
  // Ordem importante por causa das FKs.
  await db.delete(financeiro);
  await db.delete(candidaturas);
  await db.delete(obras);
  await db.delete(clientes);
  await db.delete(empreiteiras);
  await db.delete(marketplaceLeads);
  await db.delete(accounts);
  await db.delete(sessions);
  await db.delete(verificationTokens);
  await db.delete(users);
  console.log("[reset-and-seed] Tabelas limpas.");

  console.log("[reset-and-seed] Rodando seedDatabase()...");
  await seedDatabase();
  console.log("[reset-and-seed] OK ✔");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[reset-and-seed] Falha:", err);
    process.exit(1);
  });
