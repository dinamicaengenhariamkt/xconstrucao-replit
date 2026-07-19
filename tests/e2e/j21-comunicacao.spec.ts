import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./helpers";

/**
 * Jornada 21 — Observabilidade de Comunicação (Admin).
 * Pré-requisitos (env injetado pelo playwright.config.ts):
 *   - E2E_TEST_AUTH=1   habilita /api/test/login-as (cookies sem senha)
 *
 * Valida (read-only):
 *   - guards: não-admin recebe 403 nos endpoints /api/admin/*
 *   - admin lista threads, notificações e auditoria (envelope paginado)
 *   - ao abrir uma thread, registra-se admin.chat.read em audit_logs
 */

const ADMIN_EMAIL = "admin@xconstrucao.com";
const CONTRATANTE_EMAIL = "joao@construtora.com"; // seed (server/seed.ts) — role contratante

test.describe("Jornada 21 — Observabilidade de Comunicação", () => {
  test("não-admin recebe 403 nos endpoints de comunicação admin", async ({ request }) => {
    await loginAs(request, CONTRATANTE_EMAIL);

    const threads = await request.get("/api/admin/chat/threads");
    expect(threads.status(), "contratante não pode listar threads admin").toBe(403);

    const notifs = await request.get("/api/admin/notificacoes");
    expect(notifs.status(), "contratante não pode listar notificações admin").toBe(403);

    const audit = await request.get("/api/admin/comunicacao/auditoria");
    expect(audit.status(), "contratante não pode ler auditoria admin").toBe(403);

    await logout(request);
  });

  test("admin lista threads, notificações e auditoria (envelope paginado)", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);

    const threadsRes = await request.get("/api/admin/chat/threads?page=1&pageSize=10");
    expect(threadsRes.ok()).toBeTruthy();
    const threads = await threadsRes.json();
    expect(threads).toHaveProperty("items");
    expect(threads).toHaveProperty("total");
    expect(threads).toHaveProperty("totalPages");
    expect(Array.isArray(threads.items)).toBeTruthy();

    const notifRes = await request.get("/api/admin/notificacoes?page=1&pageSize=10");
    expect(notifRes.ok()).toBeTruthy();
    const notifs = await notifRes.json();
    expect(Array.isArray(notifs.items)).toBeTruthy();
    // Toda notificação persistida hoje é in-app.
    for (const n of notifs.items) expect(n.canal).toBe("in-app");

    const auditRes = await request.get("/api/admin/comunicacao/auditoria?page=1&pageSize=10");
    expect(auditRes.ok()).toBeTruthy();
    const audit = await auditRes.json();
    expect(Array.isArray(audit.items)).toBeTruthy();

    await logout(request);
  });

  test("abrir thread registra admin.chat.read na auditoria", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);

    const threadsRes = await request.get("/api/admin/chat/threads?page=1&pageSize=1");
    const threads = await threadsRes.json();

    test.skip(
      threads.items.length === 0,
      "Sem threads no banco de seed — nada para auditar nesta execução.",
    );

    const threadId = threads.items[0].threadId as string;

    const detalheRes = await request.get(`/api/admin/chat/threads/${threadId}/mensagens`);
    expect(detalheRes.ok()).toBeTruthy();
    const detalhe = await detalheRes.json();
    expect(detalhe.thread.threadId).toBe(threadId);
    expect(Array.isArray(detalhe.mensagens)).toBeTruthy();

    // A leitura deve aparecer na trilha de auditoria.
    const auditRes = await request.get("/api/admin/comunicacao/auditoria?page=1&pageSize=20");
    const audit = await auditRes.json();
    const registrou = audit.items.some(
      (a: { action: string; payload?: { threadId?: string } }) =>
        a.action === "admin.chat.read" && a.payload?.threadId === threadId,
    );
    expect(registrou, "leitura da thread deve gerar admin.chat.read").toBeTruthy();

    await logout(request);
  });
});
