export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { seedDatabase } = await import("./server/seed");
    await seedDatabase().catch(console.error);
    const { backfillConsents } = await import("./server/backfill-consents");
    const result = await backfillConsents().catch((err) => ({ ok: false, inserted: 0, error: String(err) }));
    if (!result.ok) {
      console.error("[instrumentation] backfillConsents did not complete cleanly:", result.error);
    } else {
      console.info(`[instrumentation] backfillConsents complete (inserted=${result.inserted})`);
    }
  }
}
