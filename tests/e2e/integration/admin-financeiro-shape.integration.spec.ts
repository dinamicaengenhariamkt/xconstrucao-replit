import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  loginAs,
  logout,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  SEED_ADMIN_EMAIL,
} from "../helpers";

/**
 * Integração (J36) — G10 · Financeiro admin (read-only: authz + shape).
 *
 * Cobre os 26 GETs de `app/api/admin/{financeiro,caixa,entradas,saidas}/**`.
 * São read-only (nenhuma mutação, nenhum estado a preparar/limpar), então o
 * valor está no CONTRATO: quem pode ler e o que volta.
 *
 * Para cada endpoint, o padrão transversal:
 *   - anônimo → 401 (guard `requireVerifiedUser`).
 *   - contratante e empreiteiro (verificados, não-admin) → 403 (`isAdminLike` falso).
 *   - admin → 200, shape esperado (campo âncora presente), e JAMAIS 500
 *     (responde o medo do dono: um agregador que quebra não pode vazar 500).
 *
 * Casos especiais:
 *   - `financeiro/obras/[id]` com id inexistente → 404 (não 500).
 *   - `caixa/indicadores` é um stub que retorna `[]` sempre.
 *
 * Guard confirmado idêntico nos 26 handlers: `requireVerifiedUser` +
 * `isAdminLike` (features/auth/api/auth-utils.ts). Nenhum exige query param
 * (periodo/from/to são opcionais → default de intervalo no service).
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; seed com joão
 * (contratante), maria (empreiteiro), admin (superadmin no boot).
 */

type Shape = "array" | "object";

interface Endpoint {
  /** caminho relativo sob /api */
  path: string;
  /** array puro vs objeto no corpo 200 */
  shape: Shape;
  /** campo âncora que deve existir no corpo (só p/ shape === "object") */
  anchor?: string;
}

/** Os 26 GETs read-only de financeiro admin (mapa confirmado por leitura dos handlers). */
const ENDPOINTS: Endpoint[] = [
  // --- caixa ---
  { path: "/api/admin/caixa/chart", shape: "array" },
  { path: "/api/admin/caixa/indicadores", shape: "array" },
  { path: "/api/admin/caixa/kpis", shape: "object", anchor: "saldoDisponivel" },
  { path: "/api/admin/caixa/movimentacoes", shape: "array" },
  { path: "/api/admin/caixa/resumo", shape: "object", anchor: "saldoAtual" },
  // --- entradas ---
  { path: "/api/admin/entradas/chart", shape: "object", anchor: "chart" },
  { path: "/api/admin/entradas/kpi", shape: "object", anchor: "totalEntradas" },
  { path: "/api/admin/entradas", shape: "array" },
  { path: "/api/admin/entradas/top-clientes", shape: "array" },
  { path: "/api/admin/entradas/top-empreiteiras", shape: "array" },
  // --- financeiro ---
  { path: "/api/admin/financeiro/adoption", shape: "object", anchor: "usuariosAtivos30d" },
  { path: "/api/admin/financeiro/dashboard-stats", shape: "object", anchor: "volumeContratado" },
  { path: "/api/admin/financeiro/obras-atencao", shape: "array" },
  { path: "/api/admin/financeiro/payment-evolution", shape: "array" },
  { path: "/api/admin/financeiro/portfolio-summary", shape: "object", anchor: "health" },
  { path: "/api/admin/financeiro/receitas-plataforma", shape: "object", anchor: "receitas" },
  { path: "/api/admin/financeiro/status-distribution", shape: "array" },
  { path: "/api/admin/financeiro/top-clientes", shape: "array" },
  { path: "/api/admin/financeiro/top-empreiteiras", shape: "array" },
  // --- saidas ---
  { path: "/api/admin/saidas/chart", shape: "object", anchor: "chart" },
  { path: "/api/admin/saidas/futuras", shape: "array" },
  { path: "/api/admin/saidas/kpi", shape: "object", anchor: "totalSaidas" },
  { path: "/api/admin/saidas", shape: "array" },
  { path: "/api/admin/saidas/top-clientes-reembolsados", shape: "array" },
  { path: "/api/admin/saidas/top-empreiteiras-pagas", shape: "array" },
];

/** Lê o corpo como JSON de forma tolerante (nunca lança). */
async function jsonOrNull(res: { json: () => Promise<unknown> }): Promise<unknown> {
  return res.json().catch(() => null);
}

test.describe("Integração — G10 · Financeiro admin (authz + shape)", () => {
  // ---- Authz: anônimo → 401 -------------------------------------------------
  test.describe("anônimo → 401", () => {
    for (const ep of ENDPOINTS) {
      test(`GET ${ep.path} sem sessão → 401`, async ({ request }) => {
        // Garante ausência de cookies de sessão residuais.
        await logout(request);
        const res = await request.get(ep.path);
        expect(res.status(), `${ep.path} anônimo deve ser 401`).toBe(401);
      });
    }
  });

  // ---- Authz: não-admin → 403 ----------------------------------------------
  for (const [rotulo, email] of [
    ["contratante", SEED_CONTRATANTE_EMAIL],
    ["empreiteiro", SEED_EMPREITEIRO_EMAIL],
  ] as const) {
    test.describe(`${rotulo} (não-admin) → 403`, () => {
      test(`todos os endpoints negam ${rotulo}`, async ({ request }) => {
        await loginAs(request, email);
        for (const ep of ENDPOINTS) {
          const res = await request.get(ep.path);
          expect(res.status(), `${ep.path} deve negar ${rotulo} com 403`).toBe(403);
          expect(res.status(), `${ep.path} não pode vazar 500 p/ ${rotulo}`).not.toBe(500);
        }
        await logout(request);
      });
    });
  }

  // ---- Admin → 200 + shape + nunca 500 -------------------------------------
  test.describe("admin → 200 + shape", () => {
    test("todos os endpoints respondem 200 com shape esperado (nunca 500)", async ({ request }) => {
      await loginAs(request, SEED_ADMIN_EMAIL);
      for (const ep of ENDPOINTS) {
        const res = await request.get(ep.path);
        expect(res.status(), `${ep.path} deve responder 200 p/ admin`).toBe(200);
        expect(res.status(), `${ep.path} jamais pode vazar 500`).not.toBe(500);

        const body = await jsonOrNull(res);
        if (ep.shape === "array") {
          expect(Array.isArray(body), `${ep.path} deve retornar array`).toBeTruthy();
        } else {
          expect(
            body && typeof body === "object" && !Array.isArray(body),
            `${ep.path} deve retornar objeto`,
          ).toBeTruthy();
          if (ep.anchor) {
            expect(
              (body as Record<string, unknown>)[ep.anchor],
              `${ep.path} deve conter o campo âncora '${ep.anchor}'`,
            ).not.toBeUndefined();
          }
        }
      }
      await logout(request);
    });

    test("caixa/indicadores é stub → array vazio", async ({ request }) => {
      await loginAs(request, SEED_ADMIN_EMAIL);
      const res = await request.get("/api/admin/caixa/indicadores");
      expect(res.status()).toBe(200);
      expect(await jsonOrNull(res), "indicadores deve ser []").toEqual([]);
      await logout(request);
    });
  });

  // ---- financeiro/obras/[id]: id inexistente → 404 (não 500) ---------------
  test.describe("financeiro/obras/[id]", () => {
    const OBRA_INEXISTENTE = "00000000-0000-0000-0000-000000000000";

    test("id inexistente → 404 (não 500)", async ({ request }) => {
      await loginAs(request, SEED_ADMIN_EMAIL);
      const res = await request.get(`/api/admin/financeiro/obras/${OBRA_INEXISTENTE}`);
      expect(res.status(), "obra inexistente deve ser 404").toBe(404);
      expect(res.status(), "não pode vazar 500").not.toBe(500);
      await logout(request);
    });

    test("não-admin → 403 (antes de resolver a obra)", async ({ request }) => {
      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      const res = await request.get(`/api/admin/financeiro/obras/${OBRA_INEXISTENTE}`);
      expect(res.status(), "não-admin deve ser 403").toBe(403);
      await logout(request);
    });

    test("id de obra real → 200 com detalhe (âncora id)", async ({ request }) => {
      // Descobre uma obra real via a listagem admin de obras (se houver seed).
      await loginAs(request, SEED_ADMIN_EMAIL);
      const obraId = await descobrirObraReal(request);
      test.skip(!obraId, "sem obra no seed para exercitar o caminho feliz do detalhe");

      const res = await request.get(`/api/admin/financeiro/obras/${obraId}`);
      expect(res.status(), "obra real deve responder 200").toBe(200);
      const body = (await jsonOrNull(res)) as Record<string, unknown> | null;
      expect(body?.id, "detalhe deve conter id da obra").toBe(obraId);
      await logout(request);
    });
  });
});

/**
 * Tenta descobrir o id de uma obra existente para exercitar o detalhe financeiro.
 * Best-effort: usa a listagem admin de obras; retorna "" se nada disponível.
 */
async function descobrirObraReal(request: APIRequestContext): Promise<string> {
  const res = await request.get("/api/admin/obras");
  if (!res.ok()) return "";
  const payload = (await res.json().catch(() => null)) as unknown;
  const rows: Array<{ id?: string }> = Array.isArray(payload)
    ? (payload as Array<{ id?: string }>)
    : (((payload as { rows?: Array<{ id?: string }> })?.rows) ?? []);
  return rows.find((o) => typeof o.id === "string")?.id ?? "";
}
