import { test, expect, type APIRequestContext } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { loginAs, uniqueEmail, uniqueUsername, SEED_ADMIN_EMAIL } from "../helpers";

/**
 * Integração (J51/J54) — Wizard de Onboarding (primeiro acesso) + validação
 * transversal das personas.
 *
 * Cobre o contrato do gate `users.onboarding_concluido`:
 *   Fluxo 1 — Usuário recém-registrado nasce com onboardingConcluido=false.
 *   Fluxo 2 — POST /api/onboarding/concluir marca a flag true (concluir OU pular).
 *   Fluxo 3 — Idempotência: chamar de novo mantém true, sem erro.
 *   Fluxo 4 — Passo 1 grava PF/PJ explícito via PATCH /api/perfil/contratante.
 *   Fluxo 5 — Guard: anônimo não pode concluir (401).
 *   J54.a — cada persona (contratante/empreiteiro/anunciante) nasce false no banco.
 *   J54.b — empreiteiro criado por ADMIN também nasce false (cai no wizard).
 *   J54.c — FAQ do anunciante responde (visão nova; item de menu não é mais 404).
 *
 * Isolamento: cada fluxo cria um usuário E2E fresh (nunca toca no seed).
 * Pré-requisitos: E2E_TEST_AUTH=1; seed padrão.
 */

const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };
const CPF_VALIDO = "52998224725";
const SENHA = "Xconstr@E2E2026!";

async function registrarPersona(
  request: APIRequestContext,
  role: "contratante" | "empreiteiro" | "anunciante",
  tag: string,
): Promise<{ email: string }> {
  const email = uniqueEmail(`onb-${tag}`);
  const res = await request.post("/api/auth/register", {
    data: {
      name: `E2E Onboarding ${role} ${tag}`,
      email,
      username: uniqueUsername(`onb${tag}`),
      password: SENHA,
      role,
      phone: "11966660000",
      cpfCnpj: CPF_VALIDO,
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(
    [200, 201].includes(res.status()),
    `registro E2E ${role} deve funcionar, recebeu ${res.status()}`,
  ).toBeTruthy();
  return { email };
}

/** Marca o email como verificado (o cadastro nasce sem verificar; rotas com
 *  requireVerifiedUser exigem isso). Espelha o clique no link de verificação. */
async function verificarEmail(email: string): Promise<void> {
  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.email, email));
}

async function registrarContratante(request: APIRequestContext): Promise<{ email: string }> {
  return registrarPersona(request, "contratante", "ctr");
}

/** Lê a flag de onboarding direto no banco pelo email. */
async function onboardingFlag(email: string): Promise<boolean | undefined> {
  const [row] = await db
    .select({ v: users.onboardingConcluido })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row?.v;
}

async function cleanupUser(email: string): Promise<void> {
  await db.delete(users).where(eq(users.email, email)).catch(() => {});
}

test.describe("J51 — Onboarding wizard gate", () => {
  test("Fluxo 1+2+3 — nasce false, concluir marca true, idempotente", async ({ request }) => {
    const { email } = await registrarContratante(request);
    await loginAs(request, email);

    // Fluxo 1 — recém-registrado: gate aberto (wizard deve aparecer).
    const me1 = await request.get("/api/auth/me");
    expect(me1.ok()).toBeTruthy();
    const body1 = await me1.json();
    expect(body1.onboardingConcluido).toBe(false);

    // Fluxo 2 — concluir/pular marca a flag.
    const concluir1 = await request.post("/api/onboarding/concluir");
    expect(concluir1.ok()).toBeTruthy();
    expect((await concluir1.json()).ok).toBe(true);

    const me2 = await request.get("/api/auth/me");
    expect((await me2.json()).onboardingConcluido).toBe(true);

    // Fluxo 3 — idempotência: repetir não muda nada e não falha.
    const concluir2 = await request.post("/api/onboarding/concluir");
    expect(concluir2.ok()).toBeTruthy();
    const me3 = await request.get("/api/auth/me");
    expect((await me3.json()).onboardingConcluido).toBe(true);
  });

  test("Fluxo 4 — Passo 1 grava PF/PJ explícito (PATCH perfil)", async ({ request }) => {
    const { email } = await registrarContratante(request);
    await loginAs(request, email);

    // O cadastro com CPF (11 díg.) inferiu 'Pessoa Física' pela heurística.
    // O wizard sobrescreve com a escolha explícita do usuário.
    const patch = await request.patch("/api/perfil/contratante", {
      data: { tipo: "Pessoa Jurídica", cidade: "São Paulo", estado: "SP" },
    });
    expect(patch.ok()).toBeTruthy();

    const perfil = await request.get("/api/perfil/contratante");
    const body = await perfil.json();
    expect(body.tipo).toBe("Pessoa Jurídica");
    expect(body.cidade).toBe("São Paulo");
    expect(body.estado).toBe("SP");
  });

  test("Fluxo 5 — anônimo não pode concluir (401)", async ({ request }) => {
    // Sem sessão: helpers de request começam sem cookies de auth.
    const res = await request.post("/api/onboarding/concluir", {
      headers: { cookie: "" },
    });
    expect(res.status()).toBe(401);
  });

  // ── J54 — validação transversal das personas ─────────────────────────────

  test("J54.a — cada persona nasce onboarding_concluido=false (cai no wizard)", async ({ request }) => {
    const personas = [
      { role: "contratante" as const, tag: "vc" },
      { role: "empreiteiro" as const, tag: "ve" },
      { role: "anunciante" as const, tag: "va" },
    ];
    const emails: string[] = [];
    try {
      for (const p of personas) {
        const { email } = await registrarPersona(request, p.role, p.tag);
        emails.push(email);
        expect(await onboardingFlag(email), `${p.role} deve nascer com wizard pendente`).toBe(false);
      }
    } finally {
      for (const e of emails) await cleanupUser(e);
    }
  });

  test("J54.b — empreiteiro criado por ADMIN também nasce false", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const email = uniqueEmail("onb-admincria");
    try {
      const res = await request.post("/api/admin/usuarios", {
        data: {
          name: "E2E Empreiteiro Criado Por Admin",
          email,
          role: "empreiteiro",
          senhaModo: "random",
        },
      });
      expect([200, 201].includes(res.status()), `admin cria usuário (${res.status()})`).toBeTruthy();
      // Nasce com o wizard pendente, igual ao cadastro público (prova requisito J54.b).
      expect(await onboardingFlag(email)).toBe(false);
    } finally {
      await cleanupUser(email);
    }
  });

  test("J54.c — FAQ do anunciante responde (visão nova, item de menu resolve)", async ({ request }) => {
    const { email } = await registrarPersona(request, "anunciante", "faq");
    try {
      await verificarEmail(email); // /api/anunciante/faq exige requireVerifiedUser
      await loginAs(request, email);
      const res = await request.get("/api/anunciante/faq");
      expect(res.ok(), `GET /api/anunciante/faq deve responder ok (${res.status()})`).toBeTruthy();
      const items = (await res.json()) as Array<{ id: string; question: string; category: string }>;
      expect(Array.isArray(items)).toBeTruthy();
      // As FAQs semeadas da visão 'anunciante' devem aparecer.
      expect(items.some((i) => i.category === "anuncios")).toBeTruthy();
    } finally {
      await cleanupUser(email);
    }
  });

  test("J54.d — public-config expõe adPaymentEnabled (booleano)", async ({ request }) => {
    const res = await request.get("/api/plataforma/public-config");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { adPaymentEnabled?: unknown };
    expect(typeof body.adPaymentEnabled).toBe("boolean");
  });
});
