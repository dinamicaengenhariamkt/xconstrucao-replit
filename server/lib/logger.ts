/**
 * Logger central da plataforma — J33 Observabilidade Técnica.
 *
 * Uso duplo: Pino (stdout JSON estruturado) + persistência em `app_errors` / `job_runs`.
 * J33-B: erros de nível "error"/"fatal" também vão para Sentry (quando SENTRY_DSN configurado).
 * Falhas no write ao banco são silenciosas — nunca derrubam o app.
 */
import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino(
  isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
        },
        level: "debug",
      }
    : { level: "info" }
);

/* ------------------------------------------------------------------ *
 * Tipos                                                               *
 * ------------------------------------------------------------------ */
export type LogLevel = "info" | "warn" | "error" | "fatal";
export type JobStatus = "ok" | "error" | "running";

interface LogErrorOpts {
  stack?: string;
  route?: string;
  userId?: string | null;
  meta?: Record<string, unknown> | null;
  source?: "server" | "client";
  fingerprint?: string;
}

interface LogJobRunOpts {
  error?: string | null;
  meta?: Record<string, unknown> | null;
  startedAt?: Date;
}

/* ------------------------------------------------------------------ *
 * Helpers internos                                                    *
 * ------------------------------------------------------------------ */
async function getPool() {
  try {
    const { pool } = await import("../db");
    return pool;
  } catch {
    return null;
  }
}

function buildFingerprint(route?: string, message?: string) {
  return `${route ?? "unknown"}::${(message ?? "").slice(0, 80)}`;
}

async function captureInSentry(message: string, opts: LogErrorOpts) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    const err = new Error(message);
    if (opts.stack) err.stack = opts.stack;
    Sentry.captureException(err, {
      extra: {
        route: opts.route,
        userId: opts.userId,
        source: opts.source,
        meta: opts.meta,
      },
    });
  } catch {
    // Sentry não disponível — ok
  }
}

/* ------------------------------------------------------------------ *
 * logError                                                            *
 * ------------------------------------------------------------------ */
export async function logError(
  level: LogLevel,
  message: string,
  opts: LogErrorOpts = {}
): Promise<void> {
  const { stack, route, userId, meta, source = "server", fingerprint } = opts;

  // 1. Pino stdout (sempre — mesmo se o banco falhar)
  logger[level]({ route, userId, source, meta }, message);

  // 2. Persistência no banco (silenciosa em falha)
  const pool = await getPool();
  if (pool) {
    try {
      const fp = fingerprint ?? buildFingerprint(route, message);
      await pool.query(
        `INSERT INTO app_errors (level, message, stack, route, user_id, meta, fingerprint, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          level,
          message.slice(0, 2000),
          stack ? stack.slice(0, 8000) : null,
          route ?? null,
          userId ?? null,
          meta ? JSON.stringify(meta) : null,
          fp,
          source,
        ]
      );
    } catch {
      // Tabela pode ainda não existir no primeiro boot — ok, Pino já logou.
    }
  }

  // 3. Sentry (apenas erros/fatais de origem server, de forma assíncrona)
  if ((level === "error" || level === "fatal") && source !== "client") {
    void captureInSentry(message, opts);
  }
}

/* ------------------------------------------------------------------ *
 * logJobRun                                                           *
 * ------------------------------------------------------------------ */
export async function logJobRun(
  job: string,
  status: JobStatus,
  opts: LogJobRunOpts = {}
): Promise<void> {
  const { error, meta, startedAt } = opts;
  const now = new Date();
  const start = startedAt ?? now;

  // 1. Pino stdout
  if (status === "error") {
    logger.error({ job, status, error }, `[job] ${job} — ${status}`);
  } else {
    logger.info({ job, status }, `[job] ${job} — ${status}`);
  }

  // 2. Persistência no banco
  const pool = await getPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO job_runs (job, status, started_at, finished_at, error, meta)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        job,
        status,
        start,
        status !== "running" ? now : null,
        error ? error.slice(0, 4000) : null,
        meta ? JSON.stringify(meta) : null,
      ]
    );
  } catch {
    // Tabela pode ainda não existir no primeiro boot.
  }
}

/**
 * Helper de conveniência para capturar um Error object.
 */
export async function captureError(
  err: unknown,
  opts: LogErrorOpts & { message?: string } = {}
): Promise<void> {
  const error = err instanceof Error ? err : new Error(String(err));
  const message = opts.message ?? error.message ?? "Unknown error";
  await logError("error", message, {
    stack: error.stack,
    ...opts,
  });
}
