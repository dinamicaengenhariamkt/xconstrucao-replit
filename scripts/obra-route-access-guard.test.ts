import assert from "node:assert/strict";
import { test } from "node:test";
import { checkObraRouteAccess } from "./obra-route-access-guard";

const detail = "app/api/obras/[id]/financeiro/route.ts";
const share = "app/api/xgestao/obras/[id]/share/route.ts";
const guarded = `
import { findObraAccess as authorize } from "@features/obras/api/access";
export async function GET() { return await authorize("id", { id: "user", role: "empreiteiro" }); }
export async function PATCH() { return await authorize("id", { id: "user", role: "empreiteiro" }); }
`;

test("requires a real imported access call per handler, not a comment or import alone", () => {
  assert.deepEqual(checkObraRouteAccess(detail, guarded), []);
  const missing = checkObraRouteAccess(detail, `
    import { findObraAccess } from "@features/obras/api/access";
    // findObraAccess(id, user)
    export async function GET() { return findObraAccess("id", { id: "u", role: "empreiteiro" }); }
    export async function POST() { return db.select().from(obras); }
  `);
  assert.deepEqual(missing.map((issue) => issue.method), ["POST"]);
  assert.equal(checkObraRouteAccess(detail,
    `export async function GET() { findObraAccess("id", user); }`).length, 1);
});

test("accepts a local authorization wrapper called by each handler", () => {
  const content = `
    import { findObraAccess } from "@features/obras/api/access";
    async function authorize() { return findObraAccess("id", { id: "u", role: "empreiteiro" }); }
    export async function PATCH() { return authorize(); }
    export async function DELETE() { return authorize(); }
  `;
  assert.deepEqual(checkObraRouteAccess(detail, content), []);
});

test("accepts the xgestão share guard, but not company lookup alone", () => {
  assert.deepEqual(checkObraRouteAccess(share, `
    import { requireXgestaoObraAccess } from "@features/xgestao/obra-publica/server/share-api";
    export async function GET(request) { return requireXgestaoObraAccess(request, "id"); }
  `), []);
  assert.equal(checkObraRouteAccess(share, `
    import { resolverEmpresaDoUsuario } from "@features/xgestao/equipe/server/access";
    export async function GET() { return resolverEmpresaDoUsuario("u"); }
  `).length, 1);
});

test("creation requires entitlement and does not mistake it for per-work authorization", () => {
  const importLine = `import { assertXgestaoUser } from "@features/xgestao/lib/entitlement";`;
  assert.deepEqual(checkObraRouteAccess("app/api/xgestao/obras/route.ts",
    `${importLine} export async function POST() { return assertXgestaoUser("u"); }`), []);
  assert.equal(checkObraRouteAccess(share,
    `${importLine} export async function GET() { return assertXgestaoUser("u"); }`).length, 1);
});

test("explicit admin and marketplace route exceptions do not hide new detail routes", () => {
  const unsafe = `export async function GET() { return db.select().from(obras); }`;
  for (const file of [
    "app/api/admin/obras/[id]/route.ts",
    "app/api/admin/xgestao/obras/[id]/route.ts",
    "app/api/obras/route.ts",
    "app/api/obras/destaque/route.ts",
    "app/api/empreiteiro/minhas-obras/route.ts",
  ]) assert.deepEqual(checkObraRouteAccess(file, unsafe), [], file);
  assert.equal(checkObraRouteAccess("app/api/obras/[id]/route.ts", unsafe).length, 1);
  assert.equal(checkObraRouteAccess("app/api/obras/[id]/nova/route.ts", unsafe).length, 1);
  assert.equal(checkObraRouteAccess("app/api/xgestao/obras/[id]/nova/route.ts", unsafe).length, 1);
});

test("also catches exported arrow-function handlers", () => {
  assert.deepEqual(checkObraRouteAccess(detail,
    `export const GET = async () => db.select().from(obras);`).map((issue) => issue.method), ["GET"]);
  assert.deepEqual(checkObraRouteAccess(detail, `
    import { findObraAccess } from "@features/obras/api/access";
    export const GET = async () => findObraAccess("id", { id: "u", role: "empreiteiro" });
  `), []);
});