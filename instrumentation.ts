export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { seedDatabase } = await import("./server/seed");
    await seedDatabase().catch(console.error);

    const { bootstrapSuperAdmin } = await import("./server/bootstrap-superadmin");
    await bootstrapSuperAdmin().catch((err) => {
      console.error("[instrumentation] bootstrapSuperAdmin failed:", err);
    });

    const { bootstrapStorageSchema } = await import("./server/bootstrap-storage");
    await bootstrapStorageSchema().catch((err) => {
      console.error("[instrumentation] bootstrapStorageSchema failed:", err);
    });

    const { bootstrapObrasSchema } = await import("./server/bootstrap-obras");
    await bootstrapObrasSchema().catch((err) => {
      console.error("[instrumentation] bootstrapObrasSchema failed:", err);
    });

    const { bootstrapMarketplaceSchema } = await import("./server/bootstrap-marketplace");
    await bootstrapMarketplaceSchema().catch((err) => {
      console.error("[instrumentation] bootstrapMarketplaceSchema failed:", err);
    });

    const { bootstrapCandidaturasSchema } = await import("./server/bootstrap-candidaturas");
    await bootstrapCandidaturasSchema().catch((err) => {
      console.error("[instrumentation] bootstrapCandidaturasSchema failed:", err);
    });

    const { bootstrapPagamentosSchema } = await import("./server/bootstrap-pagamentos");
    await bootstrapPagamentosSchema().catch((err) => {
      console.error("[instrumentation] bootstrapPagamentosSchema failed:", err);
    });

    const { bootstrapMedicoesSchema } = await import("./server/bootstrap-medicoes");
    await bootstrapMedicoesSchema().catch((err) => {
      console.error("[instrumentation] bootstrapMedicoesSchema failed:", err);
    });

    const { bootstrapNotificacoesSchema } = await import("./server/bootstrap-notificacoes");
    await bootstrapNotificacoesSchema().catch((err) => {
      console.error("[instrumentation] bootstrapNotificacoesSchema failed:", err);
    });

    const { markOverduePagamentos } = await import("./features/financeiro/mark-overdue-job");
    await markOverduePagamentos().catch((err) => {
      console.error("[instrumentation] markOverduePagamentos failed:", err);
    });

    const { backfillConsents } = await import("./server/backfill-consents");
    const result = await backfillConsents().catch((err) => ({ ok: false, inserted: 0, error: String(err) }));
    if (!result.ok) {
      console.error("[instrumentation] backfillConsents did not complete cleanly:", result.error);
    } else {
      console.info(`[instrumentation] backfillConsents complete (inserted=${result.inserted})`);
    }
  }
}
