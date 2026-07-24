import { test, expect, type APIRequestContext } from "@playwright/test";
import { eq, inArray } from "drizzle-orm";
import { db } from "@shared/db/db";
import { surveys, surveyRespostas } from "@shared/db/schema";
import {
  loginAs,
  logout,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  SEED_ADMIN_EMAIL,
} from "../helpers";

/**
 * Integração (J20) — Satisfação (NPS/CSAT).
 *
 * Cobre os três endpoints:
 *   - GET  /api/surveys/pendentes            (app/api/surveys/pendentes/route.ts)
 *   - POST /api/surveys/[id]/responder       (app/api/surveys/[id]/responder/route.ts)
 *   - GET  /api/admin/financeiro/satisfacao  (app/api/admin/financeiro/satisfacao/route.ts)
 *
 * Estratégia de isolamento: os convites são inseridos DIRETO no banco para os
 * usuários seed (origem marcada "E2E-j20-…" para cleanup determinístico), em vez
 * de depender do gatilho completo de conclusão de obra. O caminho do gatilho é
 * exercitado indiretamente pelos specs de obras/pagamento; aqui focamos no
 * contrato dos endpoints (authz, faixa, unicidade, agregação).
 */

const ORIGEM_TAG = "E2E-j20";

async function getMyId(request: APIRequestContext): Promise<string> {
  const res = await request.get("/api/auth/me");
  expect(res.status()).toBe(200);
  const data = (await res.json()) as { id?: string };
  expect(data?.id, "id deve existir em /api/auth/me").toBeTruthy();
  return data.id!;
}

/** Insere um convite pendente para um usuário e devolve o id. */
async function criarSurveyPendente(args: {
  userId: string;
  tipo: "nps" | "csat";
  persona: "contratante" | "empreiteiro";
  sufixoOrigem: string;
}): Promise<string> {
  const [row] = await db
    .insert(surveys)
    .values({
      tipo: args.tipo,
      persona: args.persona,
      userId: args.userId,
      obraId: null,
      origemTipo: ORIGEM_TAG,
      origemId: `${ORIGEM_TAG}-${args.sufixoOrigem}`,
    })
    .returning({ id: surveys.id });
  return row!.id;
}

/** Remove todos os convites E2E deste spec (e suas respostas por cascade). */
async function limparSurveysE2E(): Promise<void> {
  const rows = await db
    .select({ id: surveys.id })
    .from(surveys)
    .where(eq(surveys.origemTipo, ORIGEM_TAG));
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return;
  await db.delete(surveyRespostas).where(inArray(surveyRespostas.surveyId, ids)).catch(() => {});
  await db.delete(surveys).where(inArray(surveys.id, ids)).catch(() => {});
}

test.afterAll(async () => {
  await limparSurveysE2E();
});

// ---------------------------------------------------------------------------
// GET /api/surveys/pendentes — guard de autenticação
// ---------------------------------------------------------------------------

test.describe("J20 — GET /pendentes: guard", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/surveys/pendentes");
    expect(res.status(), "sem sessão deve retornar 401").toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Fluxo feliz: convite aparece em /pendentes e é respondido
// ---------------------------------------------------------------------------

test.describe("J20 — responder pesquisa (fluxo feliz + erros)", () => {
  test("NPS: pendente aparece, resposta válida → 200, some da lista", async ({ request }) => {
    await limparSurveysE2E();
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const userId = await getMyId(request);
    const surveyId = await criarSurveyPendente({
      userId,
      tipo: "nps",
      persona: "contratante",
      sufixoOrigem: "nps-feliz",
    });

    try {
      // Aparece em pendentes.
      const pend = await request.get("/api/surveys/pendentes");
      expect(pend.status()).toBe(200);
      const lista = (await pend.json()) as Array<{ id: string; tipo: string }>;
      expect(lista.some((s) => s.id === surveyId), "convite deve aparecer em pendentes").toBeTruthy();

      // Responde com nota válida.
      const res = await request.post(`/api/surveys/${surveyId}/responder`, {
        data: { nota: 9, comentario: "E2E ótimo" },
      });
      expect(res.status(), "resposta válida deve retornar 200").toBe(200);

      // Estado no banco: survey respondido + linha em survey_respostas.
      const [s] = await db.select({ status: surveys.status }).from(surveys).where(eq(surveys.id, surveyId)).limit(1);
      expect(s?.status, "survey deve ficar respondido").toBe("respondido");
      const [r] = await db
        .select({ nota: surveyRespostas.nota })
        .from(surveyRespostas)
        .where(eq(surveyRespostas.surveyId, surveyId))
        .limit(1);
      expect(r?.nota, "resposta deve ter a nota gravada").toBe(9);

      // Some da lista de pendentes.
      const pend2 = await request.get("/api/surveys/pendentes");
      const lista2 = (await pend2.json()) as Array<{ id: string }>;
      expect(lista2.some((x) => x.id === surveyId), "convite respondido não deve mais aparecer").toBeFalsy();

      // Segunda resposta no mesmo convite → 409.
      const dup = await request.post(`/api/surveys/${surveyId}/responder`, { data: { nota: 8 } });
      expect(dup.status(), "responder de novo deve retornar 409").toBe(409);
    } finally {
      await logout(request);
    }
  });

  test("NPS: nota fora da faixa (11) → 422; sem resposta gravada", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const userId = await getMyId(request);
    const surveyId = await criarSurveyPendente({
      userId,
      tipo: "nps",
      persona: "contratante",
      sufixoOrigem: "nps-faixa",
    });

    try {
      const res = await request.post(`/api/surveys/${surveyId}/responder`, { data: { nota: 11 } });
      expect(res.status(), "nota 11 num NPS deve retornar 422").toBe(422);

      const rows = await db
        .select({ id: surveyRespostas.id })
        .from(surveyRespostas)
        .where(eq(surveyRespostas.surveyId, surveyId));
      expect(rows.length, "nenhuma resposta deve ser gravada quando fora da faixa").toBe(0);
    } finally {
      await logout(request);
    }
  });

  test("body inválido (nota ausente) → 400", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const userId = await getMyId(request);
    const surveyId = await criarSurveyPendente({
      userId,
      tipo: "nps",
      persona: "contratante",
      sufixoOrigem: "nps-zod",
    });
    try {
      const res = await request.post(`/api/surveys/${surveyId}/responder`, { data: {} });
      expect(res.status(), "sem nota deve retornar 400").toBe(400);
    } finally {
      await logout(request);
    }
  });

  test("survey inexistente → 404", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    try {
      const res = await request.post(`/api/surveys/00000000-0000-0000-0000-000000000000/responder`, {
        data: { nota: 5 },
      });
      expect(res.status(), "survey inexistente deve retornar 404").toBe(404);
    } finally {
      await logout(request);
    }
  });

  test("responder convite de OUTRA persona → 403", async ({ request }) => {
    // Convite pertence ao empreiteiro; o contratante tenta responder.
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const empId = await getMyId(request);
    await logout(request);
    const surveyId = await criarSurveyPendente({
      userId: empId,
      tipo: "nps",
      persona: "empreiteiro",
      sufixoOrigem: "nps-idor",
    });

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    try {
      const res = await request.post(`/api/surveys/${surveyId}/responder`, { data: { nota: 7 } });
      expect(res.status(), "responder survey de outro usuário deve retornar 403").toBe(403);
    } finally {
      await logout(request);
    }
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/financeiro/satisfacao — authz + agregação
// ---------------------------------------------------------------------------

test.describe("J20 — GET /admin/financeiro/satisfacao", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/admin/financeiro/satisfacao");
    expect(res.status()).toBe(401);
  });

  test("contratante → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.get("/api/admin/financeiro/satisfacao");
    expect(res.status(), "não-admin não pode ver satisfação").toBe(403);
    await logout(request);
  });

  test("admin → 200 com métricas OU 204 (dados pendentes), nunca 500", async ({ request }) => {
    // Garante que existe ≥1 resposta NPS recente para o caminho 200.
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const userId = await getMyId(request);
    const surveyId = await criarSurveyPendente({
      userId,
      tipo: "nps",
      persona: "contratante",
      sufixoOrigem: "nps-agg",
    });
    await request.post(`/api/surveys/${surveyId}/responder`, { data: { nota: 10 } });
    await logout(request);

    await loginAs(request, SEED_ADMIN_EMAIL);
    try {
      const res = await request.get("/api/admin/financeiro/satisfacao");
      expect([200, 204].includes(res.status()), `esperado 200/204, recebeu ${res.status()}`).toBeTruthy();
      if (res.status() === 200) {
        const body = (await res.json()) as { npsResponses: number; breakdown: unknown };
        expect(body.npsResponses, "deve haver ao menos 1 resposta").toBeGreaterThanOrEqual(1);
        expect(body.breakdown, "deve trazer o breakdown do NPS").toBeTruthy();
      }
    } finally {
      await logout(request);
    }
  });
});
