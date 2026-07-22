import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * J51 — Bootstrap idempotente do wizard de onboarding (primeiro acesso).
 *
 * Adiciona `users.onboarding_concluido` (boolean, default false): o gate do
 * wizard. Marcado `true` ao concluir OU pular o wizard. NÃO se confunde com
 * `clientes/empreiteiras.perfil_completo` (que é derivado e exige perfil rico) —
 * esta flag é apenas "já passou pelo onboarding".
 *
 * Backfill sem rewrite (evita full-table write lock no boot): criamos a coluna
 * com `DEFAULT true`, de modo que TODAS as linhas legadas nasçam `true` sem
 * reescrever a tabela; em seguida trocamos o default para `false`, para que os
 * PRÓXIMOS cadastros nasçam `false` e caiam no wizard. `ADD COLUMN IF NOT EXISTS`
 * torna o passo idempotente; o `ALTER ... SET DEFAULT false` é barato e também
 * idempotente. Não há `UPDATE` em massa.
 */
export async function bootstrapOnboardingSchema(): Promise<void> {
  try {
    // 1) Cria a coluna com DEFAULT true → linhas legadas nascem concluídas
    //    (sem rewrite). Se a coluna já existe, este passo é no-op.
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_concluido BOOLEAN NOT NULL DEFAULT true`,
    );

    // 2) A partir de agora, novos cadastros nascem `false` (vão para o wizard).
    await db.execute(
      sql`ALTER TABLE users ALTER COLUMN onboarding_concluido SET DEFAULT false`,
    );
  } catch (err) {
    console.error("[bootstrap-onboarding] falha:", err);
    return;
  }

  console.info("[bootstrap-onboarding] schema ready (users.onboarding_concluido)");
}
