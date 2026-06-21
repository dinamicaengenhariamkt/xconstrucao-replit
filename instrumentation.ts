export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
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

    const { bootstrapPlanosSchema } = await import("./server/bootstrap-planos");
    await runBootstrap("planos", bootstrapPlanosSchema);

    const { bootstrapAnunciosSchema } = await import("./server/bootstrap-anuncios");
    await runBootstrap("anuncios", bootstrapAnunciosSchema);

    // J23 — roda DEPOIS de bootstrapAnunciosSchema (precisa de `anunciantes`/`anuncios`).
    const { bootstrapAnunciosSelfServiceSchema } = await import("./server/bootstrap-anuncios-self-service");
    await runBootstrap("anuncios-self-service", bootstrapAnunciosSelfServiceSchema);

    const { bootstrapFaqSchema } = await import("./server/bootstrap-faq");
    await runBootstrap("faq", bootstrapFaqSchema);

    // J28 — documentos legais versionados + seed v1 (depende do enum consent_document).
    const { bootstrapLegalDocumentsSchema } = await import("./server/bootstrap-legal-documents");
    await runBootstrap("legal-documents", bootstrapLegalDocumentsSchema);

    const { bootstrapKpiSnapshotsSchema } = await import("./server/bootstrap-kpi-snapshots");
    await runBootstrap("kpi-snapshots", bootstrapKpiSnapshotsSchema);

    // ----------------------------------------------------------------
    // Jobs de negócio (periódicos — marcados como job_runs independentes)
    // ----------------------------------------------------------------
    const { markOverduePagamentos } = await import("./features/financeiro/mark-overdue-job");
    await runBootstrap("mark-overdue-pagamentos", markOverduePagamentos);

    const { snapshotKpisJob } = await import("./features/financeiro/snapshot-kpis-job");
    await runBootstrap("snapshot-kpis", snapshotKpisJob);

    const { dispatchPendingCandidaturaNotifications } = await import(
      "./features/notificacoes/candidatura-dispatcher"
    );
    await runBootstrap("dispatch-candidatura-notifications", dispatchPendingCandidaturaNotifications);

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
  }
}
