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
import { classificarDatabaseUrl } from "../shared/lib/db-env";

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
  if (!url.trim()) {
    console.error("[reset-and-seed] DATABASE_URL não está definido. Abortando.");
    process.exit(1);
  }

  // Classificação compartilhada com tests/e2e/guards.ts e limpar-base.ts.
  // A heurística anterior (`/\.prod\b|production/i`) não reconhecia hosts
  // gerenciados (Neon/Supabase/Railway), então o TRUNCATE rodava contra
  // produção sem pedir nada. Agora host desconhecido é fail-closed.
  const classificacao = classificarDatabaseUrl(url);
  const looksProd =
    classificacao.tipo !== "dev" || process.env.NODE_ENV === "production";

  if (looksProd && process.env.CONFIRM_PROD_RESET !== "YES") {
    const motivo =
      classificacao.tipo === "producao"
        ? `contém o marcador "${classificacao.marcador}"`
        : classificacao.tipo === "desconhecido"
          ? `o host "${classificacao.host}" não é reconhecido como de desenvolvimento`
          : "NODE_ENV=production";
    console.error(
      `[reset-and-seed] Abortado: ${motivo}.\n` +
        "  Este script faz TRUNCATE e apaga TODOS os usuários, inclusive admins.\n" +
        "  Se é realmente o que você quer, rode com CONFIRM_PROD_RESET=YES.\n" +
        "  Para zerar preservando os administradores, use scripts/limpar-base.ts."
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
