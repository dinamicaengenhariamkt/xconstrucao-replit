module.exports = [
"[project]/instrumentation.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "register",
    ()=>register
]);
async function register() {
    if ("TURBOPACK compile-time truthy", 1) {
        const { seedDatabase } = await __turbopack_context__.A("[project]/server/seed.ts [instrumentation] (ecmascript, async loader)");
        await seedDatabase().catch(console.error);
    }
}
}),
];

//# sourceMappingURL=instrumentation_ts_cf8be71b._.js.map