/**
 * Reset destrutivo + reseed.
 *
 * Faz TRUNCATE ... RESTART IDENTITY CASCADE em uma única transação nas
 * tabelas de domínio + auth, e em seguida executa `seedDatabase()` que
 * recria admin/joão/maria com as senhas fortes da política "balanced".
 *
 * Uso (dev):    DATABASE_URL=... npx tsx scripts/reset-and-seed.ts
 * Uso (prod):   DATABASE_URL=<prod> CONFIRM_PROD_RESET=YES npx tsx scripts/reset-and-seed.ts
 */
import { sql } from "drizzle-orm";
import { db } from "../server/db";
import { seedDatabase } from "../server/seed";

const TABLES = [
  "financeiro",
  "candidaturas",
  "obras",
  "clientes",
  "empreiteiras",
  "marketplace_leads",
  "accounts",
  "sessions",
  "verification_tokens",
  "users",
];

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

  const tablesList = TABLES.map((t) => `"${t}"`).join(", ");
  console.log(`[reset-and-seed] TRUNCATE em transação: ${tablesList}`);

  await db.transaction(async (tx) => {
    await tx.execute(
      sql.raw(`TRUNCATE TABLE ${tablesList} RESTART IDENTITY CASCADE`)
    );
  });
  console.log("[reset-and-seed] Tabelas truncadas (identity reset, cascade).");

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
