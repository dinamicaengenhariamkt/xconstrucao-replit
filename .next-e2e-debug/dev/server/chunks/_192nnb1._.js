module.exports = [
"[project]/node_modules/drizzle-orm/index.js [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/node_modules_drizzle-orm_0tqlx-8._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/drizzle-orm/index.js [app-route] (ecmascript)");
    });
});
}),
"[project]/shared/db/db.ts [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/shared/db/db.ts [app-route] (ecmascript)");
    });
});
}),
"[project]/shared/db/schema.ts [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/shared/db/schema.ts [app-route] (ecmascript)");
    });
});
}),
];