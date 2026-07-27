#!/usr/bin/env tsx
/**
 * Backfill de `users.cpf_cnpj` a partir dos perfis de domínio.
 *
 * Uso:
 *   npx tsx scripts/backfill-user-cpf-cnpj.ts --dry-run   # só mostra
 *   npx tsx scripts/backfill-user-cpf-cnpj.ts             # aplica
 *
 * CONTEXTO
 * A coluna `users.cpf_cnpj` foi criada na J42 e é lida por
 * `features/marketplace/subconta-service.ts` para abrir a subconta Asaas do
 * empreiteiro (J45). Mas `createUserWithProfile` gravava o documento apenas
 * em `clientes.cnpj_cpf` / `empreiteiras.cnpj` — nunca em `users`. Resultado:
 * a coluna nascia sempre NULL e o onboarding de recebimento respondia
 * PERFIL_INCOMPLETO ("Informe seu CPF/CNPJ") para quem já tinha informado.
 *
 * O cadastro já foi corrigido; este script recupera quem se cadastrou antes.
 *
 * SEGURANÇA
 * Só preenche linhas onde `users.cpf_cnpj IS NULL` — nunca sobrescreve um
 * valor existente. Idempotente: rodar de novo não altera nada.
 *
 * NORMALIZAÇÃO
 * Os perfis podem ter o documento formatado ("123.456.789-00"), porque telas
 * antigas de admin gravavam com máscara. `users.cpf_cnpj` guarda só dígitos —
 * é o formato que a API do Asaas espera. O UPDATE aplica regexp_replace e
 * descarta o que não tiver 11 (CPF) ou 14 (CNPJ) dígitos.
 */

import { sql } from "drizzle-orm";
import { db } from "../shared/db/db";

const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Origem do documento por papel. `clientes` para contratante, `empreiteiras`
 * para empreiteiro — as duas únicas tabelas de perfil que guardam documento
 * fiscal (anunciante coleta no checkout, não no cadastro).
 */
const FONTES = [
  { tabela: "clientes", coluna: "cnpj_cpf", papel: "contratante" },
  { tabela: "empreiteiras", coluna: "cnpj", papel: "empreiteiro" },
];

/** Só dígitos, e apenas se o resultado for um CPF (11) ou CNPJ (14) plausível. */
function selectDigitos(tabela: string, coluna: string): string {
  return `regexp_replace(p.${coluna}, '\\D', '', 'g')`;
}

async function main() {
  console.log("");
  console.log("═".repeat(60));
  console.log("  BACKFILL — users.cpf_cnpj");
  console.log(`  Modo: ${DRY_RUN ? "DRY-RUN (nada será alterado)" : "EXECUÇÃO"}`);
  console.log("═".repeat(60));

  const antes = await db.execute(
    sql.raw("SELECT count(*)::int AS total, count(cpf_cnpj)::int AS com_doc FROM users"),
  );
  const { total, com_doc } = antes.rows[0] as { total: number; com_doc: number };
  console.log(`  Antes: ${com_doc}/${total} usuários com documento`);
  console.log("");

  let totalAtualizado = 0;

  for (const f of FONTES) {
    const digitos = selectDigitos(f.tabela, f.coluna);
    const where =
      `u.cpf_cnpj IS NULL ` +
      `AND p.user_id = u.id ` +
      `AND p.${f.coluna} IS NOT NULL ` +
      `AND length(${digitos}) IN (11, 14)`;

    // Conta antes de aplicar — serve tanto para o dry-run quanto para o log.
    const previa = await db.execute(
      sql.raw(`SELECT count(*)::int AS n FROM users u, ${f.tabela} p WHERE ${where}`),
    );
    const n = Number((previa.rows[0] as { n: number } | undefined)?.n ?? 0);

    if (n === 0) {
      console.log(`  ${f.papel.padEnd(12)} nada a preencher`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ${f.papel.padEnd(12)} ${n} usuário(s) seriam preenchidos (de ${f.tabela}.${f.coluna})`);
      totalAtualizado += n;
      continue;
    }

    await db.execute(
      sql.raw(
        `UPDATE users u SET cpf_cnpj = ${digitos} FROM ${f.tabela} p WHERE ${where}`,
      ),
    );
    console.log(`  ${f.papel.padEnd(12)} ${n} usuário(s) preenchidos (de ${f.tabela}.${f.coluna})`);
    totalAtualizado += n;
  }

  console.log("");

  if (DRY_RUN) {
    console.log(`  DRY-RUN — ${totalAtualizado} linha(s) seriam alteradas.`);
    console.log("═".repeat(60));
    return;
  }

  const depois = await db.execute(
    sql.raw("SELECT count(*)::int AS total, count(cpf_cnpj)::int AS com_doc FROM users"),
  );
  const d = depois.rows[0] as { total: number; com_doc: number };
  console.log(`  Depois: ${d.com_doc}/${d.total} usuários com documento`);

  // Quem continua sem documento e teria problema no onboarding de recebimento.
  const semDoc = await db.execute(
    sql.raw(
      `SELECT role, count(*)::int AS n FROM users
       WHERE cpf_cnpj IS NULL AND role IN ('contratante','empreiteiro')
       GROUP BY role ORDER BY role`,
    ),
  );
  const pendentes = semDoc.rows as Array<{ role: string; n: number }>;
  if (pendentes.length > 0) {
    console.log("");
    console.log("  Ainda sem documento (perfil também não tinha):");
    for (const p of pendentes) console.log(`    ${String(p.n).padStart(5)}  ${p.role}`);
    console.log("  → precisam informar o documento pelo perfil antes de");
    console.log("    configurar recebimento (empreiteiro) ou assinar plano.");
  }

  console.log("");
  console.log("  Backfill concluído ✔");
  console.log("═".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[backfill-user-cpf-cnpj] Falha:", err);
    process.exit(1);
  });
