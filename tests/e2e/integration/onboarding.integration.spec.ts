import { test, expect, type APIRequestContext } from "@playwright/test";
import { loginAs, uniqueEmail, uniqueUsername } from "../helpers";

/**
 * Integração (J51) — Wizard de Onboarding (primeiro acesso).
 *
 * Cobre o contrato do gate `users.onboarding_concluido`:
 *   Fluxo 1 — Usuário recém-registrado nasce com onboardingConcluido=false.
 *   Fluxo 2 — POST /api/onboarding/concluir marca a flag true (concluir OU pular).
 *   Fluxo 3 — Idempotência: chamar de novo mantém true, sem erro.
 *   Fluxo 4 — Passo 1 grava PF/PJ explícito via PATCH /api/perfil/contratante.
 *   Fluxo 5 — Guard: anônimo não pode concluir (401).
 *
 * Isolamento: cada fluxo cria um usuário E2E fresh (nunca toca no seed).
 * Pré-requisitos: E2E_TEST_AUTH=1; seed padrão.
 */

const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };
const CPF_VALIDO = "52998224725";
const SENHA = "Xconstr@E2E2026!";

async function registrarContratante(
  request: APIRequestContext,
): Promise<{ email: string }> {
  const email = uniqueEmail("onb-ctr");
  const res = await request.post("/api/auth/register", {
    data: {
      name: "E2E Onboarding Contratante",
      email,
      username: uniqueUsername("onbctr"),
      password: SENHA,
      role: "contratante",
      phone: "11966660000",
      cpfCnpj: CPF_VALIDO,
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(
    [200, 201].includes(res.status()),
    `registro E2E contratante deve funcionar, recebeu ${res.status()}`,
  ).toBeTruthy();
  return { email };
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
});
