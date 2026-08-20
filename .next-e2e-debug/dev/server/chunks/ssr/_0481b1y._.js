module.exports = [
"[project]/node_modules/drizzle-orm/index.js [app-rsc] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/node_modules_drizzle-orm_1-b5kgt._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/drizzle-orm/index.js [app-rsc] (ecmascript)");
    });
});
}),
"[project]/shared/db/db.ts [app-rsc] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/shared/db/db.ts [app-rsc] (ecmascript)");
    });
});
}),
"[project]/shared/db/schema.ts [app-rsc] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/shared/db/schema.ts [app-rsc] (ecmascript)");
    });
});
}),
];