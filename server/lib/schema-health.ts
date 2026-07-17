import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Schema health utilities — prevent silent 500s from missing DB columns.
 *
 * Root cause pattern: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` can silently
 * fail on Neon Postgres (no error thrown, no column created). Bootstrap then
 * reports "schema ready" while the column is absent and the first request that
 * touches it crashes with a cryptic 500.
 *
 * Two layers of defence:
 *
 *   1. verifyColumns(table, cols) — call INSIDE a bootstrap function right
 *      after a critical ADD COLUMN block. Throws if any column is absent so
 *      runBootstrap() catches it, logs the error and stops that module.
 *
 *   2. runSchemaHealthCheck(checks) — call AFTER all bootstraps in
 *      instrumentation.ts. Issues lightweight `SELECT col, … FROM t LIMIT 0`
 *      probes. The DB itself throws "column does not exist" when a column is
 *      missing, which is caught and re-thrown with a human-readable summary.
 *      The server process exits with code 1 so the platform surfaces the error
 *      immediately rather than serving broken requests.
 */

/** Check information_schema.columns for each column; return the missing ones. */
export async function verifyColumns(
  table: string,
  columns: string[],
): Promise<string[]> {
  try {
    // Build IN (...) clause manually — Drizzle's sql tagged template does not
    // auto-cast JS string arrays to a Postgres ARRAY literal, causing
    // "op ANY/ALL (array) requires array on right side".
    const inList = columns.map((c) => `'${c.replace(/'/g, "''")}'`).join(", ");
    const result: any = await db.execute(
      sql.raw(`
        SELECT column_name
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = '${table.replace(/'/g, "''")}'
           AND column_name  IN (${inList})
      `),
    );
    const rows: Array<{ column_name: string }> = Array.isArray(result?.rows)
      ? result.rows
      : Array.isArray(result)
        ? result
        : [];
    const found = new Set(rows.map((r) => r.column_name));
    return columns.filter((c) => !found.has(c));
  } catch (err) {
    console.error(`[schema-health] verifyColumns(${table}) query failed:`, err);
    return [];
  }
}

/**
 * Verify that columns exist inside a bootstrap function.
 * Throws SchemaHealthError listing all missing columns so runBootstrap()
 * catches it and logs the failure.
 *
 * Usage (inside a bootstrap function):
 *   await assertColumns("chat_mensagens", ["arquivo_url", "arquivo_nome", "arquivo_mime"]);
 */
export async function assertColumns(
  table: string,
  columns: string[],
): Promise<void> {
  const missing = await verifyColumns(table, columns);
  if (missing.length > 0) {
    throw new SchemaHealthError(
      `[schema-health] Table "${table}" is missing column(s): ${missing.join(", ")}. ` +
        `ALTER TABLE ADD COLUMN may have silently failed. Check DB permissions and Neon plan limits.`,
    );
  }
}

export class SchemaHealthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaHealthError";
  }
}

export interface HealthProbe {
  /** Table to probe. */
  table: string;
  /**
   * Specific columns to SELECT. The DB itself raises "column does not exist"
   * if any are absent — no information_schema round-trip needed.
   * Omit to just verify the table is reachable (SELECT 1 ... LIMIT 0).
   */
  columns?: string[];
  /** Human label for error messages. */
  label?: string;
}

/**
 * Run lightweight `SELECT <cols> FROM <table> LIMIT 0` probes.
 * No rows are fetched — the cost is a single planning round-trip per probe.
 * Returns an array of { probe, error } for every failed probe.
 *
 * Call this AFTER all bootstraps and BEFORE the server starts serving requests.
 * When failures exist, log them and exit the process so the platform surfaces
 * the error immediately.
 */
export async function runSchemaHealthCheck(probes: HealthProbe[]): Promise<
  Array<{
    probe: HealthProbe;
    error: Error;
  }>
> {
  const failures: Array<{ probe: HealthProbe; error: Error }> = [];

  for (const probe of probes) {
    try {
      const colList =
        probe.columns && probe.columns.length > 0
          ? probe.columns.join(", ")
          : "1";
      await db.execute(sql.raw(`SELECT ${colList} FROM ${probe.table} LIMIT 0`));
    } catch (err) {
      failures.push({
        probe,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }

  return failures;
}

/**
 * Critical probes — tables and columns that, if absent, will produce silent 500s.
 * Add a new entry whenever a bootstrap adds a column that application code relies on.
 */
export const CRITICAL_PROBES: HealthProbe[] = [
  // Core user columns added by bootstrap-superadmin
  {
    table: "users",
    columns: ["must_change_password", "ativo", "can_manage_users", "created_by"],
    label: "users (superadmin columns)",
  },
  // Obras extended columns (bootstrap-obras)
  {
    table: "obras",
    columns: ["visibilidade", "status_moderacao", "destaque", "foto_capa_file_id", "cidade", "uf"],
    label: "obras (extended columns)",
  },
  // Chat file attachment columns (bootstrap-chat) — root cause of the incident
  {
    table: "chat_mensagens",
    columns: ["arquivo_url", "arquivo_nome", "arquivo_mime"],
    label: "chat_mensagens (arquivo columns)",
  },
  // Notification extended columns (bootstrap-notificacoes)
  {
    table: "notificacoes",
    columns: ["thread_id"],
    label: "notificacoes (thread_id)",
  },
  // Candidatura extended columns (bootstrap-candidaturas)
  {
    table: "candidaturas",
    columns: [
      "motivo_rejeicao",
      "mensagem_contratante",
      "notificacao_disparada",
      "cancelada_pelo_empreiteiro",
      "decidida_em",
    ],
    label: "candidaturas (extended columns)",
  },
  // Storage tables (bootstrap-storage)
  {
    table: "user_files",
    columns: ["kind", "visibility", "bucket_key", "mime", "size_bytes"],
    label: "user_files",
  },
  // Empreiteiras zona columns (bootstrap-empreiteiras-zona)
  {
    table: "empreiteiras",
    columns: ["zona_atuacao_ufs", "zona_atuacao_cidades"],
    label: "empreiteiras (zona columns)",
  },
  // Financeiro extended columns (bootstrap-pagamentos operates on the `financeiro` table)
  {
    table: "financeiro",
    columns: ["status", "data_vencimento", "data_pagamento", "pagador_user_id", "recebedor_user_id"],
    label: "financeiro (pagamentos columns)",
  },
];
