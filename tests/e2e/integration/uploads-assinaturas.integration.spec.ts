import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  loginAs,
  logout,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  SEED_ADMIN_EMAIL,
} from "../helpers";

/**
 * Integração (J36) — G11 · Uploads & Assinaturas.
 *
 * Uploads: authz + validação + IDOR. O storage R2 costuma estar AUSENTE no
 * ambiente E2E, então `presign` responde 503 — asseguramos o guard e a validação
 * de payload, e o caminho de vínculo real usa `POST /api/test/file-setup` (insere
 * a linha `user_files` direto no banco, sem R2). O assert de maior valor é o IDOR
 * do DELETE: um usuário não pode apagar arquivo de outro (403).
 *
 * Assinaturas: guards de persona + estado, SEM mutar o estado do seed. O adapter
 * de gateway em teste é o `manual` (ativa de verdade no 201), então evitamos o
 * caminho de ativação real — cobrimos persona errada (403), plano inválido (404),
 * e cancelar sem assinatura ativa (409).
 *
 * Guard comum (requireVerifiedUser): anônimo → 401. Uploads DELETE/sign: dono ou
 * superadmin, senão 403; inexistente → 404.
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; seed com joão
 * (contratante), maria (empreiteiro), admin (superadmin no boot).
 */

/**
 * Cria uma linha `user_files` para o dono informado, sem depender do R2.
 * Retorna o fileId ou "" se o endpoint test-only estiver indisponível.
 */
async function criarArquivo(
  request: APIRequestContext,
  email: string,
  kind = "obra_anexo",
): Promise<string> {
  const res = await request.post("/api/test/file-setup", {
    data: { email, kind, originalName: "arquivo-e2e.pdf" },
  });
  if (!res.ok()) return "";
  const body = (await res.json().catch(() => null)) as { fileId?: string } | null;
  return body?.fileId ?? "";
}

test.describe("Integração — G11 · Uploads & Assinaturas", () => {
  // ======================= UPLOADS =========================================

  test.describe("uploads/presign — authz + validação", () => {
    test("anônimo → 401", async ({ request }) => {
      await logout(request);
      const res = await request.post("/api/uploads/presign", {
        data: { kind: "obra_anexo", mime: "application/pdf", size: 1024, filename: "a.pdf" },
      });
      expect(res.status(), "presign sem sessão deve ser 401").toBe(401);
    });

    test("payload inválido → 400 (não 500), quando storage disponível", async ({ request }) => {
      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      // kind inexistente + sem filename → Zod barra. Se o storage estiver ausente,
      // o 503 vem ANTES do parse (a ordem no handler é: guard → storage → zod),
      // então aceitamos 400 (storage on) OU 503 (storage off) — nunca 500.
      const res = await request.post("/api/uploads/presign", {
        data: { kind: "inexistente", mime: "x", size: 0 },
      });
      expect(
        [400, 503].includes(res.status()),
        `payload inválido deve dar 400 (ou 503 se storage off), recebeu ${res.status()}`,
      ).toBeTruthy();
      expect(res.status(), "presign jamais deve vazar 500 aqui").not.toBe(500);
      await logout(request);
    });

    test("payload válido → 200 (storage on) ou 503 (storage off), nunca 500", async ({ request }) => {
      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      const res = await request.post("/api/uploads/presign", {
        data: { kind: "obra_anexo", mime: "application/pdf", size: 2048, filename: "planta-e2e.pdf" },
      });
      expect(
        [200, 503].includes(res.status()),
        `presign válido deve dar 200 ou 503, recebeu ${res.status()}`,
      ).toBeTruthy();
      expect(res.status(), "presign jamais deve vazar 500").not.toBe(500);
      if (res.status() === 200) {
        const body = (await res.json()) as { uploadUrl?: string; key?: string };
        expect(body.uploadUrl, "200 deve trazer uploadUrl").toBeTruthy();
        expect(body.key, "200 deve trazer key").toBeTruthy();
      }
      await logout(request);
    });
  });

  test.describe("uploads/[id] DELETE — IDOR", () => {
    const UPLOAD_INEXISTENTE = "00000000-0000-0000-0000-000000000000";

    test("anônimo → 401", async ({ request }) => {
      await logout(request);
      const res = await request.delete(`/api/uploads/${UPLOAD_INEXISTENTE}`);
      expect(res.status(), "delete sem sessão deve ser 401").toBe(401);
    });

    test("id inexistente → 404", async ({ request }) => {
      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      const res = await request.delete(`/api/uploads/${UPLOAD_INEXISTENTE}`);
      expect(res.status(), "upload inexistente deve ser 404").toBe(404);
      await logout(request);
    });

    test("deletar arquivo de OUTRO dono → 403 (não apaga)", async ({ request }) => {
      // Cria um arquivo do empreiteiro (maria)...
      await loginAs(request, SEED_ADMIN_EMAIL); // login-as qualquer, criar via test-only
      const fileId = await criarArquivo(request, SEED_EMPREITEIRO_EMAIL, "obra_anexo");
      await logout(request);
      test.skip(!fileId, "endpoint /api/test/file-setup indisponível — pular IDOR");

      // ...e o contratante (joão) tenta apagá-lo → 403.
      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      const res = await request.delete(`/api/uploads/${fileId}`);
      expect(res.status(), "não-dono não pode apagar arquivo alheio (403)").toBe(403);
      expect(res.status(), "não-dono jamais deve conseguir apagar (200)").not.toBe(200);
      await logout(request);
    });

    test("dono apaga o próprio arquivo → 200 { ok: true }", async ({ request }) => {
      await loginAs(request, SEED_ADMIN_EMAIL);
      const fileId = await criarArquivo(request, SEED_CONTRATANTE_EMAIL, "obra_anexo");
      await logout(request);
      test.skip(!fileId, "endpoint /api/test/file-setup indisponível — pular");

      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      const res = await request.delete(`/api/uploads/${fileId}`);
      expect(res.status(), "dono deve conseguir apagar (200)").toBe(200);
      const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      expect(body?.ok, "delete do próprio deve responder ok:true").toBe(true);

      // Soft-delete: uma 2ª tentativa não acha mais → 404.
      const again = await request.delete(`/api/uploads/${fileId}`);
      expect(again.status(), "arquivo já apagado deve dar 404").toBe(404);
      await logout(request);
    });
  });

  test.describe("uploads/sign — authz + validação", () => {
    test("anônimo → 401", async ({ request }) => {
      await logout(request);
      const res = await request.get("/api/uploads/sign?id=00000000-0000-0000-0000-000000000000");
      expect(res.status(), "sign sem sessão deve ser 401").toBe(401);
    });

    test("sem key nem id → 400", async ({ request }) => {
      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      const res = await request.get("/api/uploads/sign");
      expect(res.status(), "sign sem key/id deve ser 400").toBe(400);
      await logout(request);
    });

    test("assinar arquivo de OUTRO dono → 403", async ({ request }) => {
      await loginAs(request, SEED_ADMIN_EMAIL);
      const fileId = await criarArquivo(request, SEED_EMPREITEIRO_EMAIL, "empreiteiro_documento");
      await logout(request);
      test.skip(!fileId, "endpoint /api/test/file-setup indisponível — pular");

      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      const res = await request.get(`/api/uploads/sign?id=${fileId}`);
      // documento privado de outro dono → 403 (contratante não é dono nem superadmin).
      expect(res.status(), "não-dono não pode assinar arquivo privado alheio (403)").toBe(403);
      await logout(request);
    });
  });

  test.describe("chat/[threadId]/upload/presign — authz", () => {
    const THREAD_INEXISTENTE = "00000000-0000-0000-0000-000000000000";

    test("anônimo → 401", async ({ request }) => {
      await logout(request);
      const res = await request.post(`/api/chat/${THREAD_INEXISTENTE}/upload/presign`, {
        data: { filename: "a.pdf", mime: "application/pdf", size: 1024 },
      });
      expect(res.status(), "chat presign sem sessão deve ser 401").toBe(401);
    });

    test("thread inexistente/sem acesso → 403 (não vaza 500)", async ({ request }) => {
      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      const res = await request.post(`/api/chat/${THREAD_INEXISTENTE}/upload/presign`, {
        data: { filename: "a.pdf", mime: "application/pdf", size: 1024 },
      });
      // podeAcessarThread falso → 403 FORBIDDEN (checado antes do 503 de storage).
      expect(res.status(), "thread sem acesso deve ser 403").toBe(403);
      expect(res.status(), "não pode vazar 500").not.toBe(500);
      await logout(request);
    });
  });

  // ======================= ASSINATURAS =====================================

  test.describe("assinaturas/checkout — persona + validação (sem mutar seed)", () => {
    test("anônimo → 401", async ({ request }) => {
      await logout(request);
      const res = await request.post("/api/assinaturas/checkout", { data: { planoId: "qualquer" } });
      expect(res.status(), "checkout sem sessão deve ser 401").toBe(401);
    });

    test("admin (persona não aplicável) → 403", async ({ request }) => {
      await loginAs(request, SEED_ADMIN_EMAIL);
      const res = await request.post("/api/assinaturas/checkout", { data: { planoId: "qualquer" } });
      expect(res.status(), "admin não pode assinar (403)").toBe(403);
      await logout(request);
    });

    test("payload sem planoId → 400", async ({ request }) => {
      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      const res = await request.post("/api/assinaturas/checkout", { data: {} });
      // Zod barra planoId ausente. (Persona contratante passa o role-gate.)
      expect(res.status(), "checkout sem planoId deve ser 400").toBe(400);
      await logout(request);
    });

    test("planoId inexistente → 404 PLANO_INVALIDO (sem ativar nada)", async ({ request }) => {
      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      const res = await request.post("/api/assinaturas/checkout", {
        data: { planoId: "plano-e2e-inexistente", ciclo: "mensal" },
      });
      expect(res.status(), "plano inexistente deve ser 404").toBe(404);
      const body = (await res.json().catch(() => null)) as { code?: string } | null;
      expect(body?.code, "code deve ser PLANO_INVALIDO").toBe("PLANO_INVALIDO");
      await logout(request);
    });
  });

  test.describe("assinaturas/cancelar — estado", () => {
    test("anônimo → 401", async ({ request }) => {
      await logout(request);
      const res = await request.post("/api/assinaturas/cancelar");
      expect(res.status(), "cancelar sem sessão deve ser 401").toBe(401);
    });

    test("sem assinatura ativa → 409", async ({ request }) => {
      // O empreiteiro seed não tem assinatura ativa no fluxo default → 409.
      // (Se por acaso tiver, o teste registra e pula — não queremos cancelar
      // uma assinatura real do seed.)
      await loginAs(request, SEED_EMPREITEIRO_EMAIL);
      const res = await request.post("/api/assinaturas/cancelar");
      test.skip(
        res.status() === 200,
        "empreiteiro seed possui assinatura ativa nesta execução — não cancelar",
      );
      expect(res.status(), "sem assinatura ativa deve ser 409").toBe(409);
      await logout(request);
    });
  });
});
