export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // J33-B — Sentry server SDK (graceful: no-op se SENTRY_DSN ausente)
    await import("./sentry.server.config").catch(() => {});

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
      const ehProd = process.env.NODE_ENV === "production";

      if (ehProd && gateway === "asaas" && asaasEnv !== "production") {
        const linha = "!".repeat(72);
        console.warn(
          `\n${linha}\n` +
            `  ATENÇÃO: aplicação em PRODUÇÃO com Asaas em "${asaasEnv}".\n` +
            `  Os pagamentos são SIMULADOS — nenhuma cobrança real será feita.\n` +
            `  Para cobrar de verdade: ASAAS_ENVIRONMENT=production.\n` +
            `${linha}\n`,
        );
      } else {
        console.log(`[boot] pagamentos: gateway=${gateway} asaas_env=${asaasEnv}`);
      }
    }

    // Seed sempre primeiro (cria tabela users — necessária para FKs dos bootstraps)
    const { seedDatabase } = await import("./server/seed");
    await seedDatabase().catch((err) => {
      console.error("[instrumentation] seedDatabase failed:", err);
    });

    const { bootstrapSuperAdmin } = await import("./server/bootstrap-superadmin");
    await bootstrapSuperAdmin().catch((err) => {
      console.error("[instrumentation] bootstrapSuperAdmin failed:", err);
    });

    // ----------------------------------------------------------------
    // J33 — Observabilidade: cria app_errors + job_runs ANTES dos demais
    // para que os logJobRun abaixo já possam persistir no banco.
    // ----------------------------------------------------------------
    const { bootstrapObservabilidadeSchema } = await import("./server/bootstrap-observabilidade");
    await bootstrapObservabilidadeSchema().catch((err) => {
      console.error("[instrumentation] bootstrapObservabilidade failed:", err);
    });

    const { logError, logJobRun } = await import("./server/lib/logger");

    // ----------------------------------------------------------------
    // Helpers para wrapping uniforme
    // ----------------------------------------------------------------
    async function runBootstrap(name: string, fn: () => Promise<void>) {
      const start = Date.now();
      try {
        await fn();
        await logJobRun(`bootstrap.${name}`, "ok", { startedAt: new Date(start) }).catch(() => {});
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        await logJobRun(`bootstrap.${name}`, "error", {
          error: error.message,
          startedAt: new Date(start),
        }).catch(() => {});
        await logError("error", `[bootstrap.${name}] failed`, {
          stack: error.stack,
          route: `bootstrap.${name}`,
          meta: { job: name },
        }).catch(() => {});
      }
    }

    // ----------------------------------------------------------------
    // Bootstraps de schema (idempotentes)
    // ----------------------------------------------------------------
    const { bootstrapStorageSchema } = await import("./server/bootstrap-storage");
    await runBootstrap("storage", bootstrapStorageSchema);

    const { bootstrapEmpreiteirasZona } = await import("./server/bootstrap-empreiteiras-zona");
    await runBootstrap("empreiteiras-zona", bootstrapEmpreiteirasZona);

    const { bootstrapObrasSchema } = await import("./server/bootstrap-obras");
    await runBootstrap("obras", bootstrapObrasSchema);

    const { bootstrapMarketplaceSchema } = await import("./server/bootstrap-marketplace");
    await runBootstrap("marketplace", bootstrapMarketplaceSchema);

    const { bootstrapCandidaturasSchema } = await import("./server/bootstrap-candidaturas");
    await runBootstrap("candidaturas", bootstrapCandidaturasSchema);

    const { bootstrapCandidaturaAnexosSchema } = await import("./server/bootstrap-candidatura-anexos");
    await runBootstrap("candidatura-anexos", bootstrapCandidaturaAnexosSchema);

    const { bootstrapPagamentosSchema } = await import("./server/bootstrap-pagamentos");
    await runBootstrap("pagamentos", bootstrapPagamentosSchema);

    const { bootstrapFinanceiroEscopoSchema } = await import("./server/bootstrap-financeiro-escopo");
    await runBootstrap("financeiro-escopo", bootstrapFinanceiroEscopoSchema);

    const { bootstrapMedicoesSchema } = await import("./server/bootstrap-medicoes");
    await runBootstrap("medicoes", bootstrapMedicoesSchema);

    const { bootstrapMedicoesExtrasSchema } = await import("./server/bootstrap-medicoes-extras");
    await runBootstrap("medicoes-extras", bootstrapMedicoesExtrasSchema);

    const { bootstrapObraOperacaoSchema } = await import("./server/bootstrap-obra-operacao");
    await runBootstrap("obra-operacao", bootstrapObraOperacaoSchema);

    const { bootstrapObraShareLinksSchema } = await import("./server/bootstrap-obra-share-links");
    await runBootstrap("obra-share-links", bootstrapObraShareLinksSchema);

    const { bootstrapNotificacoesSchema } = await import("./server/bootstrap-notificacoes");
    await runBootstrap("notificacoes", bootstrapNotificacoesSchema);

    const { bootstrapAtividadesSchema } = await import("./server/bootstrap-atividades");
    await runBootstrap("atividades", bootstrapAtividadesSchema);

    const { bootstrapChatSchema } = await import("./server/bootstrap-chat");
    await runBootstrap("chat", bootstrapChatSchema);

    const { bootstrapDisputasSchema } = await import("./server/bootstrap-disputas");
    await runBootstrap("disputas", bootstrapDisputasSchema);

    const { bootstrap2faSchema } = await import("./server/bootstrap-2fa");
    await runBootstrap("2fa", bootstrap2faSchema);

    // J51 — wizard de onboarding: flag users.onboarding_concluido (só depende de users).
    const { bootstrapOnboardingSchema } = await import("./server/bootstrap-onboarding");
    await runBootstrap("onboarding", bootstrapOnboardingSchema);

    const { bootstrapPlanosSchema } = await import("./server/bootstrap-planos");
    await runBootstrap("planos", bootstrapPlanosSchema);

    // J42 — fundação marketplace split. Roda DEPOIS de users/obras/financeiro
    // (FKs de pagamentos_split apontam para essas tabelas).
    const { bootstrapMarketplaceSplitSchema } = await import("./server/bootstrap-marketplace-split");
    await runBootstrap("marketplace-split", bootstrapMarketplaceSplitSchema);

    const { bootstrapAnunciosSchema } = await import("./server/bootstrap-anuncios");
    await runBootstrap("anuncios", bootstrapAnunciosSchema);

    // J23 — roda DEPOIS de bootstrapAnunciosSchema (precisa de `anunciantes`/`anuncios`).
    const { bootstrapAnunciosSelfServiceSchema } = await import("./server/bootstrap-anuncios-self-service");
    await runBootstrap("anuncios-self-service", bootstrapAnunciosSelfServiceSchema);

    const { bootstrapFaqSchema } = await import("./server/bootstrap-faq");
    await runBootstrap("faq", bootstrapFaqSchema);

    // J58/J59 — contrato entre as partes + termo do anunciante. Roda DEPOIS de
    // obras/candidaturas/users (FKs de contrato_assinaturas) e ANTES de
    // legal-documents, que insere linhas com os valores de enum criados aqui.
    const { bootstrapContratosSchema } = await import("./server/bootstrap-contratos");
    await runBootstrap("contratos", bootstrapContratosSchema);

    // J28 — documentos legais versionados + seed v1 (depende do enum consent_document).
    const { bootstrapLegalDocumentsSchema } = await import("./server/bootstrap-legal-documents");
    await runBootstrap("legal-documents", bootstrapLegalDocumentsSchema);

    const { bootstrapKpiSnapshotsSchema } = await import("./server/bootstrap-kpi-snapshots");
    await runBootstrap("kpi-snapshots", bootstrapKpiSnapshotsSchema);

    const { bootstrapWebhookDeliveryLogSchema } = await import("./server/bootstrap-webhook-delivery-log");
    await runBootstrap("webhook-delivery-log", bootstrapWebhookDeliveryLogSchema);

    // ----------------------------------------------------------------
    // Jobs de negócio (periódicos — marcados como job_runs independentes)
    // ----------------------------------------------------------------
    const { markOverduePagamentos } = await import("./features/financeiro/mark-overdue-job");
    await runBootstrap("mark-overdue-pagamentos", () => markOverduePagamentos().then(() => {}));

    // J31 — expira anúncios cujo período terminou (ativa→expirada). Idempotente.
    const { expirarAnuncios } = await import("./features/anuncios/expirar-anuncios-job");
    await runBootstrap("expirar-anuncios", () => expirarAnuncios().then(() => {}));

    const { snapshotKpisJob } = await import("./features/financeiro/snapshot-kpis-job");
    await runBootstrap("snapshot-kpis", () => snapshotKpisJob().then(() => {}));

    const { dispatchPendingCandidaturaNotifications } = await import(
      "./features/notificacoes/candidatura-dispatcher"
    );
    await runBootstrap("dispatch-candidatura-notifications", () => dispatchPendingCandidaturaNotifications().then(() => {}));

    // backfillConsents tem assinatura diferente — wrapping manual
    const backfillStart = Date.now();
    try {
      const { backfillConsents } = await import("./server/backfill-consents");
      const result = await backfillConsents().catch((err: unknown) => ({
        ok: false,
        inserted: 0,
        error: String(err),
      }));
      if (!result.ok) {
        await logError("error", "[instrumentation] backfillConsents did not complete cleanly", {
          route: "bootstrap.backfill-consents",
          meta: { error: result.error },
        }).catch(() => {});
        await logJobRun("bootstrap.backfill-consents", "error", {
          error: result.error ?? "unknown",
          startedAt: new Date(backfillStart),
        }).catch(() => {});
      } else {
        console.info(`[instrumentation] backfillConsents complete (inserted=${result.inserted})`);
        await logJobRun("bootstrap.backfill-consents", "ok", {
          startedAt: new Date(backfillStart),
          meta: { inserted: result.inserted },
        }).catch(() => {});
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      await logError("error", "[instrumentation] backfillConsents threw", {
        stack: error.stack,
        route: "bootstrap.backfill-consents",
      }).catch(() => {});
      await logJobRun("bootstrap.backfill-consents", "error", {
        error: error.message,
        startedAt: new Date(backfillStart),
      }).catch(() => {});
    }

    // ----------------------------------------------------------------
    // Post-bootstrap schema health check
    // Issues lightweight SELECT probes against critical tables/columns.
    // The DB itself throws "column does not exist" if any column is absent,
    // catching mismatches BEFORE the server starts serving requests.
    // ----------------------------------------------------------------
    try {
      const { runSchemaHealthCheck, CRITICAL_PROBES } = await import("./server/lib/schema-health");
      const failures = await runSchemaHealthCheck(CRITICAL_PROBES);
      if (failures.length > 0) {
        const summary = failures
          .map((f) => `  • ${f.probe.label ?? f.probe.table}: ${f.error.message}`)
          .join("\n");
        const message =
          `[instrumentation] SCHEMA HEALTH CHECK FAILED — ${failures.length} probe(s) detected missing columns.\n` +
          `This means one or more ALTER TABLE ADD COLUMN operations silently failed.\n` +
          `Requests that touch these columns will crash with 500 errors.\n\n` +
          `Failed probes:\n${summary}\n\n` +
          `Resolution: check Neon Postgres plan limits, ALTER TABLE permissions, and re-deploy.`;
        console.error(message);
        await logError("error", "[instrumentation] schema health check failed", {
          route: "bootstrap.schema-health",
          meta: { failures: failures.map((f) => ({ table: f.probe.table, label: f.probe.label, error: f.error.message })) },
        }).catch(() => {});
        await logJobRun("bootstrap.schema-health", "error", {
          error: `${failures.length} probe(s) failed`,
          startedAt: new Date(),
        }).catch(() => {});
        // Exit so the platform surfaces the error immediately rather than serving broken requests.
        process.exit(1);
      } else {
        console.info(`[instrumentation] schema health check passed (${CRITICAL_PROBES.length} probes)`);
        await logJobRun("bootstrap.schema-health", "ok", { startedAt: new Date() }).catch(() => {});
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[instrumentation] schema health check threw unexpectedly:", error.message);
      await logError("error", "[instrumentation] schema health check threw", {
        stack: error.stack,
        route: "bootstrap.schema-health",
      }).catch(() => {});
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config").catch(() => {});
  }
}
