export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { seedDatabase } = await import("./server/seed");
    await seedDatabase().catch(console.error);
    const { backfillConsents } = await import("./server/backfill-consents");
    await backfillConsents().catch(console.error);
  }
}
