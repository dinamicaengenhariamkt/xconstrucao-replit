/**
 * Smoke (Task #36) — Race entre DELETE /api/obras/[id] e INSERT de candidatura.
 *
 * Roteiro:
 *  1. Cria contratante + cliente + obra dummy.
 *  2. Tx A: SELECT obra FOR UPDATE (simula início do DELETE).
 *  3. Tx B (em paralelo): INSERT candidatura referenciando a obra.
 *     → bloqueia esperando o FK row-lock.
 *  4. Tx A: count candidaturas pendentes (vê 0), DELETE obra, COMMIT.
 *  5. Tx B desbloqueia: INSERT deve FALHAR com violação de FK (23503).
 *
 * Espera: ou Tx A aborta com 409 (se candidatura comitou antes), ou Tx B
 * estoura FK depois do DELETE. Nunca: obra deletada + candidatura órfã.
 *
 * Uso: tsx scripts/smoke-task36-delete-obra-race.ts
 */
import { Pool } from "pg";
import { randomUUID } from "crypto";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não setado.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const userId = randomUUID();
  const clienteId = randomUUID();
  const obraId = randomUUID();
  const empUserId = randomUUID();

  const setup = await pool.connect();
  try {
    await setup.query("BEGIN");
    await setup.query(
      `INSERT INTO users (id, username, email, password, role, name)
       VALUES ($1, $2, $3, 'x', 'contratante', 'Smoke Contratante')`,
      [userId, `smoke-c-${userId.slice(0, 8)}`, `smoke-c-${userId.slice(0, 8)}@x.test`],
    );
    await setup.query(
      `INSERT INTO users (id, username, email, password, role, name)
       VALUES ($1, $2, $3, 'x', 'empreiteiro', 'Smoke Empreiteiro')`,
      [empUserId, `smoke-e-${empUserId.slice(0, 8)}`, `smoke-e-${empUserId.slice(0, 8)}@x.test`],
    );
    await setup.query(
      `INSERT INTO clientes (id, user_id, nome, email, telefone)
       VALUES ($1, $2, 'Smoke Cliente', 'smoke@x.test', '0000')`,
      [clienteId, userId],
    );
    await setup.query(
      `INSERT INTO obras (id, cliente_id, nome, endereco, status, visibilidade)
       VALUES ($1, $2, 'Obra Smoke #36', 'Rua X', 'planejamento', 'publicada')`,
      [obraId, clienteId],
    );
    await setup.query("COMMIT");
  } finally {
    setup.release();
  }

  const txA = await pool.connect();
  const txB = await pool.connect();
  let outcome = "";
  try {
    await txA.query("BEGIN");
    await txA.query("SELECT id FROM obras WHERE id = $1 FOR UPDATE", [obraId]);

    // Em paralelo: Tx B tenta inserir candidatura. Vai bloquear no FK lock.
    const txBPromise = (async () => {
      await txB.query("BEGIN");
      try {
        await txB.query(
          `INSERT INTO candidaturas (obra_id, empreiteiro_id, valor_proposta, status)
           VALUES ($1, $2, 1000, 'pendente')`,
          [obraId, empUserId],
        );
        await txB.query("COMMIT");
        return "B_INSERTED";
      } catch (e: any) {
        await txB.query("ROLLBACK").catch(() => {});
        return `B_FAILED:${e.code}:${e.message.split("\n")[0]}`;
      }
    })();

    // Pequeno delay pra Tx B "alcançar" o lock.
    await new Promise((r) => setTimeout(r, 200));

    // Tx A: count pendentes → 0 (B ainda não comitou). DELETE. COMMIT.
    const { rows: pend } = await txA.query(
      `SELECT COUNT(*)::int AS c FROM candidaturas WHERE obra_id = $1 AND status = 'pendente'`,
      [obraId],
    );
    if (pend[0].c > 0) {
      await txA.query("ROLLBACK");
      outcome = `A_409 (viu ${pend[0].c} pendente — Tx B comitou antes do lock)`;
    } else {
      await txA.query("DELETE FROM obras WHERE id = $1", [obraId]);
      await txA.query("COMMIT");
      outcome = "A_DELETED";
    }

    const bResult = await txBPromise;
    console.log(`Tx A: ${outcome}`);
    console.log(`Tx B: ${bResult}`);

    // Invariante de segurança: nunca obra deletada + candidatura órfã.
    const { rows: orphans } = await pool.query(
      `SELECT id FROM candidaturas WHERE obra_id = $1`,
      [obraId],
    );
    const { rows: obrasLeft } = await pool.query(`SELECT id FROM obras WHERE id = $1`, [obraId]);
    if (obrasLeft.length === 0 && orphans.length > 0) {
      console.error("FALHA: obra deletada mas candidatura órfã sobrou:", orphans);
      process.exit(2);
    }
    const okA = outcome === "A_DELETED" && bResult.startsWith("B_FAILED:23503");
    const okB = outcome.startsWith("A_409") && bResult === "B_INSERTED";
    if (okA || okB) {
      console.log("OK — race resolvida corretamente.");
    } else {
      console.error("Resultado inesperado.");
      process.exit(3);
    }
  } finally {
    txA.release();
    txB.release();
    // Cleanup
    await pool.query(`DELETE FROM candidaturas WHERE obra_id = $1`, [obraId]).catch(() => {});
    await pool.query(`DELETE FROM obras WHERE id = $1`, [obraId]).catch(() => {});
    await pool.query(`DELETE FROM clientes WHERE id = $1`, [clienteId]).catch(() => {});
    await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [userId, empUserId]).catch(() => {});
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
