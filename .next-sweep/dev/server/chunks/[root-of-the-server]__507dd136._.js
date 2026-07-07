module.exports = [
"[project]/server/lib/logger.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "captureError",
    ()=>captureError,
    "logError",
    ()=>logError,
    "logJobRun",
    ()=>logJobRun,
    "logger",
    ()=>logger
]);
/**
 * Logger central da plataforma — J33 Observabilidade Técnica.
 *
 * Uso duplo: Pino (stdout JSON estruturado) + persistência em `app_errors` / `job_runs`.
 * J33-B: erros de nível "error"/"fatal" também vão para Sentry (quando SENTRY_DSN configurado).
 * Falhas no write ao banco são silenciosas — nunca derrubam o app.
 */ var __TURBOPACK__imported__module__$5b$externals$5d2f$pino__$5b$external$5d$__$28$pino$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$pino$29$__ = __turbopack_context__.i("[externals]/pino [external] (pino, cjs, [project]/node_modules/pino)");
;
const isDev = ("TURBOPACK compile-time value", "development") !== "production";
const logger = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$pino__$5b$external$5d$__$28$pino$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$pino$29$__["default"])(("TURBOPACK compile-time truthy", 1) ? {
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname"
        }
    },
    level: "debug"
} : "TURBOPACK unreachable");
/* ------------------------------------------------------------------ *
 * Helpers internos                                                    *
 * ------------------------------------------------------------------ */ async function getPool() {
    try {
        const { pool } = await __turbopack_context__.A("[project]/server/db.ts [instrumentation] (ecmascript, async loader)");
        return pool;
    } catch  {
        return null;
    }
}
function buildFingerprint(route, message) {
    return `${route ?? "unknown"}::${(message ?? "").slice(0, 80)}`;
}
async function captureInSentry(message, opts) {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) return;
    try {
        const Sentry = await __turbopack_context__.A("[project]/node_modules/@sentry/nextjs/build/cjs/index.server.js [instrumentation] (ecmascript, async loader)");
        const err = new Error(message);
        if (opts.stack) err.stack = opts.stack;
        Sentry.captureException(err, {
            extra: {
                route: opts.route,
                userId: opts.userId,
                source: opts.source,
                meta: opts.meta
            }
        });
    } catch  {
    // Sentry não disponível — ok
    }
}
async function logError(level, message, opts = {}) {
    const { stack, route, userId, meta, source = "server", fingerprint } = opts;
    // 1. Pino stdout (sempre — mesmo se o banco falhar)
    logger[level]({
        route,
        userId,
        source,
        meta
    }, message);
    // 2. Persistência no banco (silenciosa em falha)
    const pool = await getPool();
    if (pool) {
        try {
            const fp = fingerprint ?? buildFingerprint(route, message);
            await pool.query(`INSERT INTO app_errors (level, message, stack, route, user_id, meta, fingerprint, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                level,
                message.slice(0, 2000),
                stack ? stack.slice(0, 8000) : null,
                route ?? null,
                userId ?? null,
                meta ? JSON.stringify(meta) : null,
                fp,
                source
            ]);
        } catch  {
        // Tabela pode ainda não existir no primeiro boot — ok, Pino já logou.
        }
    }
    // 3. Sentry (apenas erros/fatais de origem server, de forma assíncrona)
    if ((level === "error" || level === "fatal") && source !== "client") {
        void captureInSentry(message, opts);
    }
}
async function logJobRun(job, status, opts = {}) {
    const { error, meta, startedAt } = opts;
    const now = new Date();
    const start = startedAt ?? now;
    // 1. Pino stdout
    if (status === "error") {
        logger.error({
            job,
            status,
            error
        }, `[job] ${job} — ${status}`);
    } else {
        logger.info({
            job,
            status
        }, `[job] ${job} — ${status}`);
    }
    // 2. Persistência no banco
    const pool = await getPool();
    if (!pool) return;
    try {
        await pool.query(`INSERT INTO job_runs (job, status, started_at, finished_at, error, meta)
       VALUES ($1, $2, $3, $4, $5, $6)`, [
            job,
            status,
            start,
            status !== "running" ? now : null,
            error ? error.slice(0, 4000) : null,
            meta ? JSON.stringify(meta) : null
        ]);
    } catch  {
    // Tabela pode ainda não existir no primeiro boot.
    }
}
async function captureError(err, opts = {}) {
    const error = err instanceof Error ? err : new Error(String(err));
    const message = opts.message ?? error.message ?? "Unknown error";
    await logError("error", message, {
        stack: error.stack,
        ...opts
    });
}
}),
"[externals]/pino [external] (pino, cjs, [project]/node_modules/pino)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("pino-28069d5257187539", () => require("pino-28069d5257187539"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__507dd136._.js.map