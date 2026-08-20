module.exports = [
"[project]/instrumentation.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "register",
    ()=>register
]);
globalThis["__SENTRY_SERVER_MODULES__"] = {
    "@auth/drizzle-adapter": "^1.11.1",
    "@aws-sdk/client-s3": "^3.1045.0",
    "@aws-sdk/s3-request-presigner": "^3.1045.0",
    "@hookform/resolvers": "^3.10.0",
    "@jridgewell/trace-mapping": "^0.3.25",
    "@playwright/test": "^1.59.1",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@react-email/components": "^1.0.7",
    "@sentry/nextjs": "^10.59.0",
    "@tailwindcss/postcss": "^4.1.18",
    "@tanstack/react-query": "^5.60.5",
    "@tanstack/react-query-devtools": "^5.91.3",
    "@types/bcryptjs": "^2.4.6",
    "@types/leaflet": "^1.9.21",
    "bcryptjs": "^3.0.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "drizzle-orm": "^0.39.3",
    "drizzle-zod": "^0.7.0",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "^11.18.2",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.0",
    "leaflet": "^1.9.4",
    "next": "^16.1.6",
    "next-auth": "^5.0.0-beta.30",
    "next-themes": "^0.4.6",
    "node": "20.18.1",
    "otplib": "^13.4.1",
    "pg": "^8.16.3",
    "pino": "^10.3.1",
    "pino-pretty": "^13.1.3",
    "qrcode": "^1.5.4",
    "react": "^18.3.1",
    "react-data-table-component": "^7.7.0",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-email": "^5.2.8",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.4.0",
    "react-leaflet": "^4.2.1",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.2",
    "tailwind-merge": "^2.6.0",
    "tw-animate-css": "^1.2.5",
    "vaul": "^1.1.2",
    "zod": "^3.24.2",
    "zod-validation-error": "^3.4.0",
    "zustand": "^5.0.11",
    "@react-email/render": "^2.0.4",
    "@tailwindcss/typography": "^0.5.15",
    "@types/node": "20.19.27",
    "@types/pg": "^8.20.4",
    "@types/qrcode": "^1.5.6",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "drizzle-kit": "^0.31.8",
    "esbuild": "^0.25.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^4.1.18",
    "tsx": "^4.20.5",
    "typescript": "5.6.3"
};
globalThis["_sentryNextJsVersion"] = "16.3.0";
async function register() {
    if ("TURBOPACK compile-time truthy", 1) {
        // J33-B — Sentry server SDK (graceful: no-op se SENTRY_DSN ausente)
        await __turbopack_context__.A("[project]/sentry.server.config.ts [instrumentation] (ecmascript, async loader)").catch(()=>{});
        // ----------------------------------------------------------------
        // Aviso de ambiente de pagamento.
        //
        // `ASAAS_ENVIRONMENT` é independente de `NODE_ENV` — rodar sandbox no
        // domínio publicado é intencional (clientes testando sem cobrança real).
        // O risco é o inverso: virar a chave para valer e esquecer de trocar,
        // com os pagamentos seguindo simulados sem ninguém perceber. Este bloco
        // torna esse estado impossível de passar despercebido no boot.
        // ----------------------------------------------------------------
        {
            const gateway = process.env.PAYMENT_GATEWAY ?? "(não definido)";
            const asaasEnv = process.env.ASAAS_ENVIRONMENT ?? "sandbox";
            const ehProd = ("TURBOPACK compile-time value", "development") === "production";
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            else {
                console.log(`[boot] pagamentos: gateway=${gateway} asaas_env=${asaasEnv}`);
            }
        }
        // Seed sempre primeiro (cria tabela users — necessária para FKs dos bootstraps)
        const { seedDatabase } = await __turbopack_context__.A("[project]/server/seed.ts [instrumentation] (ecmascript, async loader)");
        await seedDatabase().catch((err)=>{
            console.error("[instrumentation] seedDatabase failed:", err);
        });
        const { bootstrapSuperAdmin } = await __turbopack_context__.A("[project]/server/bootstrap-superadmin.ts [instrumentation] (ecmascript, async loader)");
        await bootstrapSuperAdmin().catch((err)=>{
            console.error("[instrumentation] bootstrapSuperAdmin failed:", err);
        });
        // ----------------------------------------------------------------
        // J33 — Observabilidade: cria app_errors + job_runs ANTES dos demais
        // para que os logJobRun abaixo já possam persistir no banco.
        // ----------------------------------------------------------------
        const { bootstrapObservabilidadeSchema } = await __turbopack_context__.A("[project]/server/bootstrap-observabilidade.ts [instrumentation] (ecmascript, async loader)");
        await bootstrapObservabilidadeSchema().catch((err)=>{
            console.error("[instrumentation] bootstrapObservabilidade failed:", err);
        });
        const { logError, logJobRun } = await __turbopack_context__.A("[project]/server/lib/logger.ts [instrumentation] (ecmascript, async loader)");
        // ----------------------------------------------------------------
        // Helpers para wrapping uniforme
        // ----------------------------------------------------------------
        async function runBootstrap(name, fn) {
            const start = Date.now();
            try {
                await fn();
                await logJobRun(`bootstrap.${name}`, "ok", {
                    startedAt: new Date(start)
                }).catch(()=>{});
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                await logJobRun(`bootstrap.${name}`, "error", {
                    error: error.message,
                    startedAt: new Date(start)
                }).catch(()=>{});
                await logError("error", `[bootstrap.${name}] failed`, {
                    stack: error.stack,
                    route: `bootstrap.${name}`,
                    meta: {
                        job: name
                    }
                }).catch(()=>{});
            }
        }
        // ----------------------------------------------------------------
        // Bootstraps de schema (idempotentes)
        // ----------------------------------------------------------------
        const { bootstrapStorageSchema } = await __turbopack_context__.A("[project]/server/bootstrap-storage.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("storage", bootstrapStorageSchema);
        const { bootstrapEmpreiteirasZona } = await __turbopack_context__.A("[project]/server/bootstrap-empreiteiras-zona.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("empreiteiras-zona", bootstrapEmpreiteirasZona);
        const { bootstrapObrasSchema } = await __turbopack_context__.A("[project]/server/bootstrap-obras.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("obras", bootstrapObrasSchema);
        const { bootstrapMarketplaceSchema } = await __turbopack_context__.A("[project]/server/bootstrap-marketplace.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("marketplace", bootstrapMarketplaceSchema);
        const { bootstrapCandidaturasSchema } = await __turbopack_context__.A("[project]/server/bootstrap-candidaturas.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("candidaturas", bootstrapCandidaturasSchema);
        const { bootstrapCandidaturaAnexosSchema } = await __turbopack_context__.A("[project]/server/bootstrap-candidatura-anexos.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("candidatura-anexos", bootstrapCandidaturaAnexosSchema);
        const { bootstrapPagamentosSchema } = await __turbopack_context__.A("[project]/server/bootstrap-pagamentos.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("pagamentos", bootstrapPagamentosSchema);
        const { bootstrapFinanceiroEscopoSchema } = await __turbopack_context__.A("[project]/server/bootstrap-financeiro-escopo.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("financeiro-escopo", bootstrapFinanceiroEscopoSchema);
        const { bootstrapMedicoesSchema } = await __turbopack_context__.A("[project]/server/bootstrap-medicoes.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("medicoes", bootstrapMedicoesSchema);
        const { bootstrapMedicoesExtrasSchema } = await __turbopack_context__.A("[project]/server/bootstrap-medicoes-extras.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("medicoes-extras", bootstrapMedicoesExtrasSchema);
        const { bootstrapObraOperacaoSchema } = await __turbopack_context__.A("[project]/server/bootstrap-obra-operacao.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("obra-operacao", bootstrapObraOperacaoSchema);
        const { bootstrapNotificacoesSchema } = await __turbopack_context__.A("[project]/server/bootstrap-notificacoes.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("notificacoes", bootstrapNotificacoesSchema);
        const { bootstrapAtividadesSchema } = await __turbopack_context__.A("[project]/server/bootstrap-atividades.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("atividades", bootstrapAtividadesSchema);
        const { bootstrapChatSchema } = await __turbopack_context__.A("[project]/server/bootstrap-chat.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("chat", bootstrapChatSchema);
        const { bootstrapDisputasSchema } = await __turbopack_context__.A("[project]/server/bootstrap-disputas.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("disputas", bootstrapDisputasSchema);
        const { bootstrap2faSchema } = await __turbopack_context__.A("[project]/server/bootstrap-2fa.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("2fa", bootstrap2faSchema);
        // J51 — wizard de onboarding: flag users.onboarding_concluido (só depende de users).
        const { bootstrapOnboardingSchema } = await __turbopack_context__.A("[project]/server/bootstrap-onboarding.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("onboarding", bootstrapOnboardingSchema);
        const { bootstrapPlanosSchema } = await __turbopack_context__.A("[project]/server/bootstrap-planos.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("planos", bootstrapPlanosSchema);
        // J42 — fundação marketplace split. Roda DEPOIS de users/obras/financeiro
        // (FKs de pagamentos_split apontam para essas tabelas).
        const { bootstrapMarketplaceSplitSchema } = await __turbopack_context__.A("[project]/server/bootstrap-marketplace-split.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("marketplace-split", bootstrapMarketplaceSplitSchema);
        const { bootstrapAnunciosSchema } = await __turbopack_context__.A("[project]/server/bootstrap-anuncios.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("anuncios", bootstrapAnunciosSchema);
        // J23 — roda DEPOIS de bootstrapAnunciosSchema (precisa de `anunciantes`/`anuncios`).
        const { bootstrapAnunciosSelfServiceSchema } = await __turbopack_context__.A("[project]/server/bootstrap-anuncios-self-service.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("anuncios-self-service", bootstrapAnunciosSelfServiceSchema);
        const { bootstrapFaqSchema } = await __turbopack_context__.A("[project]/server/bootstrap-faq.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("faq", bootstrapFaqSchema);
        // J58/J59 — contrato entre as partes + termo do anunciante. Roda DEPOIS de
        // obras/candidaturas/users (FKs de contrato_assinaturas) e ANTES de
        // legal-documents, que insere linhas com os valores de enum criados aqui.
        const { bootstrapContratosSchema } = await __turbopack_context__.A("[project]/server/bootstrap-contratos.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("contratos", bootstrapContratosSchema);
        // J28 — documentos legais versionados + seed v1 (depende do enum consent_document).
        const { bootstrapLegalDocumentsSchema } = await __turbopack_context__.A("[project]/server/bootstrap-legal-documents.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("legal-documents", bootstrapLegalDocumentsSchema);
        const { bootstrapKpiSnapshotsSchema } = await __turbopack_context__.A("[project]/server/bootstrap-kpi-snapshots.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("kpi-snapshots", bootstrapKpiSnapshotsSchema);
        const { bootstrapWebhookDeliveryLogSchema } = await __turbopack_context__.A("[project]/server/bootstrap-webhook-delivery-log.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("webhook-delivery-log", bootstrapWebhookDeliveryLogSchema);
        // ----------------------------------------------------------------
        // Jobs de negócio (periódicos — marcados como job_runs independentes)
        // ----------------------------------------------------------------
        const { markOverduePagamentos } = await __turbopack_context__.A("[project]/features/financeiro/mark-overdue-job.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("mark-overdue-pagamentos", ()=>markOverduePagamentos().then(()=>{}));
        // J31 — expira anúncios cujo período terminou (ativa→expirada). Idempotente.
        const { expirarAnuncios } = await __turbopack_context__.A("[project]/features/anuncios/expirar-anuncios-job.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("expirar-anuncios", ()=>expirarAnuncios().then(()=>{}));
        const { snapshotKpisJob } = await __turbopack_context__.A("[project]/features/financeiro/snapshot-kpis-job.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("snapshot-kpis", ()=>snapshotKpisJob().then(()=>{}));
        const { dispatchPendingCandidaturaNotifications } = await __turbopack_context__.A("[project]/features/notificacoes/candidatura-dispatcher.ts [instrumentation] (ecmascript, async loader)");
        await runBootstrap("dispatch-candidatura-notifications", ()=>dispatchPendingCandidaturaNotifications().then(()=>{}));
        // backfillConsents tem assinatura diferente — wrapping manual
        const backfillStart = Date.now();
        try {
            const { backfillConsents } = await __turbopack_context__.A("[project]/server/backfill-consents.ts [instrumentation] (ecmascript, async loader)");
            const result = await backfillConsents().catch((err)=>({
                    ok: false,
                    inserted: 0,
                    error: String(err)
                }));
            if (!result.ok) {
                await logError("error", "[instrumentation] backfillConsents did not complete cleanly", {
                    route: "bootstrap.backfill-consents",
                    meta: {
                        error: result.error
                    }
                }).catch(()=>{});
                await logJobRun("bootstrap.backfill-consents", "error", {
                    error: result.error ?? "unknown",
                    startedAt: new Date(backfillStart)
                }).catch(()=>{});
            } else {
                console.info(`[instrumentation] backfillConsents complete (inserted=${result.inserted})`);
                await logJobRun("bootstrap.backfill-consents", "ok", {
                    startedAt: new Date(backfillStart),
                    meta: {
                        inserted: result.inserted
                    }
                }).catch(()=>{});
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            await logError("error", "[instrumentation] backfillConsents threw", {
                stack: error.stack,
                route: "bootstrap.backfill-consents"
            }).catch(()=>{});
            await logJobRun("bootstrap.backfill-consents", "error", {
                error: error.message,
                startedAt: new Date(backfillStart)
            }).catch(()=>{});
        }
        // ----------------------------------------------------------------
        // Post-bootstrap schema health check
        // Issues lightweight SELECT probes against critical tables/columns.
        // The DB itself throws "column does not exist" if any column is absent,
        // catching mismatches BEFORE the server starts serving requests.
        // ----------------------------------------------------------------
        try {
            const { runSchemaHealthCheck, CRITICAL_PROBES } = await __turbopack_context__.A("[project]/server/lib/schema-health.ts [instrumentation] (ecmascript, async loader)");
            const failures = await runSchemaHealthCheck(CRITICAL_PROBES);
            if (failures.length > 0) {
                const summary = failures.map((f)=>`  • ${f.probe.label ?? f.probe.table}: ${f.error.message}`).join("\n");
                const message = `[instrumentation] SCHEMA HEALTH CHECK FAILED — ${failures.length} probe(s) detected missing columns.\n` + `This means one or more ALTER TABLE ADD COLUMN operations silently failed.\n` + `Requests that touch these columns will crash with 500 errors.\n\n` + `Failed probes:\n${summary}\n\n` + `Resolution: check Neon Postgres plan limits, ALTER TABLE permissions, and re-deploy.`;
                console.error(message);
                await logError("error", "[instrumentation] schema health check failed", {
                    route: "bootstrap.schema-health",
                    meta: {
                        failures: failures.map((f)=>({
                                table: f.probe.table,
                                label: f.probe.label,
                                error: f.error.message
                            }))
                    }
                }).catch(()=>{});
                await logJobRun("bootstrap.schema-health", "error", {
                    error: `${failures.length} probe(s) failed`,
                    startedAt: new Date()
                }).catch(()=>{});
                // Exit so the platform surfaces the error immediately rather than serving broken requests.
                process.exit(1);
            } else {
                console.info(`[instrumentation] schema health check passed (${CRITICAL_PROBES.length} probes)`);
                await logJobRun("bootstrap.schema-health", "ok", {
                    startedAt: new Date()
                }).catch(()=>{});
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error("[instrumentation] schema health check threw unexpectedly:", error.message);
            await logError("error", "[instrumentation] schema health check threw", {
                stack: error.stack,
                route: "bootstrap.schema-health"
            }).catch(()=>{});
        }
    }
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
}
}),
];

//# sourceMappingURL=instrumentation_ts_1oq3o45._.js.map