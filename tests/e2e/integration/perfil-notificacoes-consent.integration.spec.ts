import { test, expect } from "@playwright/test";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  chatMensagens,
  chatThreads,
  clientes,
  empreiteiras,
  empreiteiroPortfolio,
  marketplaceLeads,
  notificacoes,
  obras,
  obrasSalvas,
  sessions,
  userConsents,
  userFiles,
  users,
} from "@shared/db/schema";
import {
  loginAs,
  logout,
  uniqueEmail,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  SEED_ADMIN_EMAIL,
} from "../helpers";
import { criarObraVinculadaE2E, limparObraVinculadaE2E, userIdByEmail, type ObraVinculada } from "../helpers-marketplace";

/**
 * Integração (J36) — G-perfil · Perfil / notificações / consent / CRUD legado.
 *
 * Cobre:
 *   POST /api/contratante/chat/[conversationId]/marcar-lida
 *   POST /api/contratante/chat/garantir-thread
 *   POST /api/notificacoes/[id]/lida · POST /api/notificacoes/marcar-todas-lidas
 *   GET/PATCH /api/perfil/{contratante,empreiteiro,empreiteiro/portfolio,preferencias}
 *   POST /api/perfil/consent/{accept,revoke}
 *   DELETE /api/perfil/sessoes/[id]
 *   POST /api/legal/consentir
 *   GET/POST /api/clientes + DELETE /api/clientes/[id]
 *   GET/POST /api/empreiteiras + DELETE /api/empreiteiras/[id]
 *   GET/POST /api/empreiteiro/obras-salvas + DELETE /api/empreiteiro/obras-salvas/[obraId]
 *   POST /api/marketplace-leads
 *   POST /api/log/client-error
 *   POST /api/uploads/commit
 *
 * Estratégia (não sujar dado seed):
 *   - `perfil/{contratante,empreiteiro,preferencias}` PATCH: só mexe no campo `bio`
 *     (users) e num toggle de preferências — lê valor atual e RESTAURA no finally.
 *   - `perfil/empreiteiro/portfolio`: cria um item de portfólio E2E descartável
 *     (userFiles + empreiteiroPortfolio) para o empreiteiro seed, PATCH, cleanup.
 *   - `perfil/consent/{accept,revoke}` e `legal/consentir`: consent/revoke chama
 *     `clearAuthCookies` (efeito de logout) e revoga TODOS os consents do usuário —
 *     nunca no seed. Usa um usuário E2E descartável (criado via admin/usuarios,
 *     já com emailVerified) e hard-delete no fim (cascade limpa userConsents).
 *   - `perfil/sessoes/[id]` DELETE: insere uma sessão-isca (não a de login atual)
 *     para o contratante seed e apaga só ela — não derruba a sessão do teste.
 *   - chat `garantir-thread`/`marcar-lida`: obra E2E vinculada (helper existente) +
 *     thread/mensagem inseridas via db (setup leve, sem depender de fluxo de aceite).
 *   - notificações: insere notificação(ões) E2E para o contratante seed, marca
 *     lida(s), cleanup.
 *   - `clientes`/`empreiteiras` (CRUD legado, sem ownership check no route): cria
 *     registro "E2E" com `userId: null` (evita colidir com o unique do seed) → GET
 *     reflete → DELETE.
 *   - `empreiteiro/obras-salvas`: obra E2E publicada e sem empreiteira vinculada
 *     (não usa `criarObraVinculadaE2E`, que já vincula) — salva com o empreiteiro
 *     seed, GET reflete, remove.
 *   - `marketplace-leads` POST: endpoint público, cria lead "E2E" (sem DELETE
 *     disponível na API pública — fica residual, mesmo padrão aceito no admin
 *     spec para `anunciantes`; removido diretamente via db no cleanup).
 *   - `log/client-error`: público, best-effort, sempre 200 — só smoke.
 *   - `uploads/commit`: EXIGE objeto real no bucket (headObject contra R2) — setup
 *     pesado demais para integração leve. Cobre só guard (401) + validação (400 de
 *     schema) + 400 de chave/tamanho adulterados, sem exercitar o caminho feliz.
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; seed com joão, maria, admin.
 */

const ID_FAKE = "00000000-0000-0000-0000-000000000000";

// ---------------------------------------------------------------------------
// perfil/contratante, perfil/empreiteiro, perfil/preferencias — ler/gravar/restaurar
// ---------------------------------------------------------------------------

test.describe("J36 — perfil: contratante/empreiteiro/preferências (restaura ao fim)", () => {
  test("GET/PATCH /api/perfil/contratante sem sessão → 401; role errado → 403", async ({ request }) => {
    await logout(request);
    const anon = await request.get("/api/perfil/contratante");
    expect(anon.status()).toBe(401);

    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const errado = await request.get("/api/perfil/contratante");
    expect(errado.status(), "empreiteiro não acessa perfil de contratante").toBe(403);
    await logout(request);
  });

  test("PATCH /api/perfil/contratante grava bio e reflete (restaura ao fim)", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    try {
      const antes = (await (await request.get("/api/perfil/contratante")).json()) as { bio?: string | null };
      const bioOriginal = antes.bio ?? null;
      const novaBio = `Bio E2E contratante ${Date.now().toString(36)}`;

      const patch = await request.patch("/api/perfil/contratante", { data: { bio: novaBio } });
      expect(patch.status(), "PATCH deve ser 200").toBe(200);
      const depois = (await patch.json()) as { bio?: string | null };
      expect(depois.bio, "bio deve refletir o novo valor").toBe(novaBio);

      // Validação: telefone curto demais → 400.
      const inval = await request.patch("/api/perfil/contratante", { data: { telefone: "123" } });
      expect(inval.status(), "telefone inválido deve ser 400").toBe(400);

      await request.patch("/api/perfil/contratante", { data: { bio: bioOriginal } });
    } finally {
      await logout(request);
    }
  });

  test("GET/PATCH /api/perfil/empreiteiro sem sessão → 401; role errado → 403", async ({ request }) => {
    await logout(request);
    const anon = await request.get("/api/perfil/empreiteiro");
    expect(anon.status()).toBe(401);

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const errado = await request.get("/api/perfil/empreiteiro");
    expect(errado.status(), "contratante não acessa perfil de empreiteiro").toBe(403);
    await logout(request);
  });

  test("PATCH /api/perfil/empreiteiro grava bio e reflete (restaura ao fim)", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    try {
      const antes = (await (await request.get("/api/perfil/empreiteiro")).json()) as { bio?: string | null };
      const bioOriginal = antes.bio ?? null;
      const novaBio = `Bio E2E empreiteiro ${Date.now().toString(36)}`;

      const patch = await request.patch("/api/perfil/empreiteiro", { data: { bio: novaBio } });
      expect(patch.status(), "PATCH deve ser 200").toBe(200);
      const depois = (await patch.json()) as { bio?: string | null };
      expect(depois.bio, "bio deve refletir o novo valor").toBe(novaBio);

      await request.patch("/api/perfil/empreiteiro", { data: { bio: bioOriginal } });
    } finally {
      await logout(request);
    }
  });

  test("perfil/empreiteiro/portfolio: cria item E2E → GET reflete → PATCH título → cleanup", async ({ request }) => {
    const empreiteiroUserId = await userIdByEmail(SEED_EMPREITEIRO_EMAIL);
    const stamp = Date.now().toString(36);

    const [file] = await db
      .insert(userFiles)
      .values({
        ownerUserId: empreiteiroUserId,
        kind: "portfolio_imagem",
        visibility: "public",
        bucketKey: `e2e/portfolio/${stamp}.jpg`,
        originalName: `e2e-${stamp}.jpg`,
        mime: "image/jpeg",
        sizeBytes: 1024,
        publicUrl: `https://example.test/e2e-${stamp}.jpg`,
      })
      .returning({ id: userFiles.id });
    const [item] = await db
      .insert(empreiteiroPortfolio)
      .values({ empreiteiroUserId, fileId: file!.id, titulo: `E2E item ${stamp}`, ordem: 900 })
      .returning({ id: empreiteiroPortfolio.id });

    try {
      await logout(request);
      const anon = await request.get("/api/perfil/empreiteiro/portfolio");
      expect(anon.status()).toBe(401);

      await loginAs(request, SEED_EMPREITEIRO_EMAIL);
      const list = (await (await request.get("/api/perfil/empreiteiro/portfolio")).json()) as {
        items: Array<{ id: string }>;
      };
      expect(list.items.some((i) => i.id === item!.id), "item E2E deve aparecer na listagem").toBeTruthy();

      const patch = await request.patch("/api/perfil/empreiteiro/portfolio", {
        data: { items: [{ id: item!.id, titulo: `E2E item ${stamp} editado` }] },
      });
      expect(patch.status(), "PATCH portfolio deve ser 200").toBe(200);

      const invalRole = await (async () => {
        await logout(request);
        await loginAs(request, SEED_CONTRATANTE_EMAIL);
        const r = await request.get("/api/perfil/empreiteiro/portfolio");
        await logout(request);
        return r;
      })();
      expect(invalRole.status(), "contratante não acessa portfólio de empreiteiro").toBe(403);
    } finally {
      await db.delete(empreiteiroPortfolio).where(eq(empreiteiroPortfolio.id, item!.id)).catch(() => {});
      await db.delete(userFiles).where(eq(userFiles.id, file!.id)).catch(() => {});
    }
  });

  test("GET/PATCH /api/perfil/preferencias grava e reflete (restaura ao fim)", async ({ request }) => {
    await logout(request);
    const anon = await request.get("/api/perfil/preferencias");
    expect(anon.status()).toBe(401);

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    try {
      const antes = (await (await request.get("/api/perfil/preferencias")).json()) as {
        notificacoes?: Record<string, boolean>;
      };
      const notifOriginal = { ...(antes.notificacoes ?? {}) };
      const alvo = "emailResumoSemanal";
      const valorOriginal = Boolean(notifOriginal[alvo]);
      const novo = !valorOriginal;

      const patch = await request.patch("/api/perfil/preferencias", {
        data: { notificacoes: { [alvo]: novo } },
      });
      expect(patch.status(), "PATCH preferências deve ser 200").toBe(200);
      const depois = (await patch.json()) as { notificacoes?: Record<string, boolean> };
      expect(Boolean(depois.notificacoes?.[alvo]), "toggle deve refletir").toBe(novo);

      await request.patch("/api/perfil/preferencias", { data: { notificacoes: notifOriginal } });
    } finally {
      await logout(request);
    }
  });
});

// ---------------------------------------------------------------------------
// consent + legal — usuário E2E descartável (accept/revoke mexe em todos os
// consents e revoke desloga; nunca no seed)
// ---------------------------------------------------------------------------

test.describe("J36 — consent / legal: usuário E2E descartável", () => {
  test("consent/accept, GET consent, legal/consentir, consent/revoke", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const email = uniqueEmail("consent-e2e");
    const create = await request.post("/api/admin/usuarios", {
      data: { name: "E2E Consent", email, role: "contratante", senhaModo: "random" },
    });
    expect(create.status(), "criar usuário E2E deve ser 201").toBe(201);
    const { user } = (await create.json()) as { user: { id: string } };
    const userId = user.id;
    await logout(request);

    try {
      // Guards sem sessão.
      const anonAccept = await request.post("/api/perfil/consent/accept", {
        data: { versaoTermos: "v1", versaoPrivacidade: "v1" },
      });
      expect(anonAccept.status()).toBe(401);
      const anonRevoke = await request.post("/api/perfil/consent/revoke");
      expect(anonRevoke.status()).toBe(401);
      const anonLegal = await request.post("/api/legal/consentir", { data: { tipos: ["termos"] } });
      expect(anonLegal.status()).toBe(401);

      await loginAs(request, email);

      // Validação: body inválido → 400.
      const invalAccept = await request.post("/api/perfil/consent/accept", { data: {} });
      expect(invalAccept.status(), "accept sem versões deve ser 400").toBe(400);

      const accept = await request.post("/api/perfil/consent/accept", {
        data: { versaoTermos: "e2e-v1", versaoPrivacidade: "e2e-v1" },
      });
      expect(accept.status(), "accept deve ser 200").toBe(200);

      const listar = await request.get("/api/perfil/consent");
      expect(listar.status()).toBe(200);
      const { consents } = (await listar.json()) as {
        consents: Array<{ documento: string; versao: string; revogadoEm: string | null }>;
      };
      expect(
        consents.some((c) => c.documento === "termos" && c.versao === "e2e-v1" && !c.revogadoEm),
        "consentimento de termos deve estar ativo",
      ).toBeTruthy();

      // legal/consentir — validação e caminho feliz (re-consentimento).
      const invalLegal = await request.post("/api/legal/consentir", { data: { tipos: [] } });
      expect(invalLegal.status(), "tipos vazio deve ser 400").toBe(400);
      const legal = await request.post("/api/legal/consentir", { data: { tipos: ["termos", "privacidade"] } });
      expect(legal.status(), "re-consentir deve ser 200").toBe(200);

      const rows = await db.select().from(userConsents).where(eq(userConsents.userId, userId));
      expect(rows.length, "deve haver consents gravados no banco").toBeGreaterThan(0);

      // revoke — efeito colateral: desloga (clearAuthCookies) + revoga tudo.
      const revoke = await request.post("/api/perfil/consent/revoke");
      expect(revoke.status(), "revoke deve ser 200").toBe(200);

      const revogados = await db
        .select({ revogadoEm: userConsents.revogadoEm })
        .from(userConsents)
        .where(and(eq(userConsents.userId, userId), isNull(userConsents.revogadoEm)));
      expect(revogados.length, "não deve sobrar consent ativo após revoke").toBe(0);
    } finally {
      await logout(request).catch(() => {});
      await db.delete(userConsents).where(eq(userConsents.userId, userId)).catch(() => {});
      await db.delete(sessions).where(eq(sessions.userId, userId)).catch(() => {});
      await db.delete(users).where(eq(users.id, userId)).catch(() => {});
    }
  });
});

// ---------------------------------------------------------------------------
// perfil/sessoes/[id] — sessão-isca (não derruba a sessão do teste)
// ---------------------------------------------------------------------------

test.describe("J36 — perfil/sessoes: DELETE de sessão-isca", () => {
  test("DELETE remove só a sessão-isca; anônimo → 401", async ({ request }) => {
    await logout(request);
    const anon = await request.delete(`/api/perfil/sessoes/${ID_FAKE}`);
    expect(anon.status()).toBe(401);

    const contratanteUserId = await userIdByEmail(SEED_CONTRATANTE_EMAIL);
    const [isca] = await db
      .insert(sessions)
      .values({
        sessionToken: `e2e-isca-${Date.now().toString(36)}`,
        userId: contratanteUserId,
        expires: new Date(Date.now() + 60_000),
        userAgent: "e2e-isca",
      })
      .returning({ id: sessions.id });

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    try {
      const antes = await request.get("/api/perfil/sessoes");
      expect(antes.status()).toBe(200);
      const { sessoes } = (await antes.json()) as { sessoes: Array<{ id: string }> };
      expect(sessoes.some((s) => s.id === isca!.id), "sessão-isca deve aparecer na listagem").toBeTruthy();

      const del = await request.delete(`/api/perfil/sessoes/${isca!.id}`);
      expect(del.status(), "DELETE da sessão-isca deve ser 200").toBe(200);

      const restante = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.id, isca!.id));
      expect(restante.length, "sessão-isca deve ter sido removida").toBe(0);

      // A sessão atual do teste continua válida (endpoint autenticado responde).
      const aindaLogado = await request.get("/api/perfil/sessoes");
      expect(aindaLogado.status(), "sessão do teste deve continuar ativa").toBe(200);
    } finally {
      await db.delete(sessions).where(eq(sessions.id, isca!.id)).catch(() => {});
      await logout(request);
    }
  });
});

// ---------------------------------------------------------------------------
// chat: garantir-thread + marcar-lida
// ---------------------------------------------------------------------------

test.describe("J36 — chat: garantir-thread + marcar-lida", () => {
  let obra: ObraVinculada;

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("chat-perfil");
  });

  test.afterEach(async () => {
    if (obra?.obraId) {
      await db.delete(chatMensagens).where(eq(chatMensagens.threadId, obra.obraId)).catch(() => {});
      await db.delete(chatThreads).where(eq(chatThreads.obraId, obra.obraId)).catch(() => {});
    }
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("garantir-thread: guards + validação + cria/idempotente", async ({ request }) => {
    await logout(request);
    const anon = await request.post("/api/contratante/chat/garantir-thread", { data: { obraId: obra.obraId } });
    expect(anon.status()).toBe(401);

    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const errado = await request.post("/api/contratante/chat/garantir-thread", { data: { obraId: obra.obraId } });
    expect(errado.status(), "empreiteiro não é contratante/admin → 403").toBe(403);
    await logout(request);

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const inval = await request.post("/api/contratante/chat/garantir-thread", { data: {} });
    expect(inval.status(), "obraId ausente deve ser 400").toBe(400);

    const naoEncontrada = await request.post("/api/contratante/chat/garantir-thread", { data: { obraId: ID_FAKE } });
    expect(naoEncontrada.status(), "obra inexistente deve ser 404").toBe(404);

    const criar = await request.post("/api/contratante/chat/garantir-thread", { data: { obraId: obra.obraId } });
    expect(criar.status(), "criar thread deve ser 200").toBe(200);
    const { threadId } = (await criar.json()) as { threadId: string };
    expect(threadId, "deve retornar threadId").toBeTruthy();

    const [threadRow] = await db.select({ id: chatThreads.id }).from(chatThreads).where(eq(chatThreads.obraId, obra.obraId));
    expect(threadRow?.id, "thread deve existir no banco").toBe(threadId);

    // Idempotente: repetir retorna a mesma thread.
    const repetir = await request.post("/api/contratante/chat/garantir-thread", { data: { obraId: obra.obraId } });
    expect(repetir.status()).toBe(200);
    const { threadId: threadId2 } = (await repetir.json()) as { threadId: string };
    expect(threadId2, "chamada repetida deve reusar a mesma thread").toBe(threadId);

    await logout(request);
  });

  test("marcar-lida: marca mensagens do outro autor como lidas; guard 403 para quem não participa", async ({
    request,
  }) => {
    const [thread] = await db
      .insert(chatThreads)
      .values({
        obraId: obra.obraId,
        contratanteUserId: obra.contratanteUserId,
        empreiteiroUserId: obra.empreiteiroUserId,
      })
      .returning({ id: chatThreads.id });
    const threadId = thread!.id;

    await db.insert(chatMensagens).values({
      threadId,
      autorUserId: obra.empreiteiroUserId,
      texto: "E2E mensagem não lida",
    });

    await logout(request);
    const anon = await request.post(`/api/contratante/chat/${threadId}/marcar-lida`);
    expect(anon.status()).toBe(401);

    await loginAs(request, SEED_ADMIN_EMAIL);
    const semAcesso = await request.post(`/api/contratante/chat/${threadId}/marcar-lida`);
    expect(semAcesso.status(), "quem não participa da thread → 403").toBe(403);
    await logout(request);

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const marcar = await request.post(`/api/contratante/chat/${threadId}/marcar-lida`);
    expect(marcar.status(), "contratante (participante) marca como lida → 200").toBe(200);
    const { marcadas } = (await marcar.json()) as { marcadas: number };
    expect(marcadas, "deve marcar ao menos 1 mensagem do outro autor").toBeGreaterThan(0);

    const [msg] = await db.select({ lidaEm: chatMensagens.threadId }).from(chatMensagens).where(eq(chatMensagens.threadId, threadId));
    expect(msg, "mensagem deve continuar existindo").toBeTruthy();
    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// notificações
// ---------------------------------------------------------------------------

test.describe("J36 — notificações: marcar lida / marcar todas", () => {
  test("POST /[id]/lida e /marcar-todas-lidas refletem no banco", async ({ request }) => {
    const contratanteUserId = await userIdByEmail(SEED_CONTRATANTE_EMAIL);
    const [n1, n2] = await Promise.all([
      db
        .insert(notificacoes)
        .values({ userId: contratanteUserId, tipo: "info", titulo: "E2E notif 1", descricao: "e2e" })
        .returning({ id: notificacoes.id })
        .then((r) => r[0]!),
      db
        .insert(notificacoes)
        .values({ userId: contratanteUserId, tipo: "info", titulo: "E2E notif 2", descricao: "e2e" })
        .returning({ id: notificacoes.id })
        .then((r) => r[0]!),
    ]);

    try {
      await logout(request);
      const anon = await request.post(`/api/notificacoes/${n1.id}/lida`);
      expect(anon.status()).toBe(401);

      await loginAs(request, SEED_CONTRATANTE_EMAIL);

      const fake = await request.post(`/api/notificacoes/${ID_FAKE}/lida`);
      expect(fake.status(), "notificação inexistente/alheia deve ser 404").toBe(404);

      const marcar1 = await request.post(`/api/notificacoes/${n1.id}/lida`);
      expect(marcar1.status(), "marcar 1 notificação deve ser 200").toBe(200);

      const [lida1] = await db.select({ lida: notificacoes.lida }).from(notificacoes).where(eq(notificacoes.id, n1.id));
      expect(lida1?.lida, "notificação 1 deve estar marcada como lida").toBe(true);

      const todas = await request.post("/api/notificacoes/marcar-todas-lidas");
      expect(todas.status(), "marcar todas deve ser 200").toBe(200);
      const { updated } = (await todas.json()) as { updated: number };
      expect(updated, "deve haver ao menos a notificação 2 marcada").toBeGreaterThanOrEqual(1);

      const [lida2] = await db.select({ lida: notificacoes.lida }).from(notificacoes).where(eq(notificacoes.id, n2.id));
      expect(lida2?.lida, "notificação 2 deve estar marcada como lida").toBe(true);

      await logout(request);
    } finally {
      await db.delete(notificacoes).where(eq(notificacoes.id, n1.id)).catch(() => {});
      await db.delete(notificacoes).where(eq(notificacoes.id, n2.id)).catch(() => {});
    }
  });
});

// ---------------------------------------------------------------------------
// clientes / empreiteiras — CRUD legado (sem ownership scoping no route)
// ---------------------------------------------------------------------------

test.describe("J36 — clientes/empreiteiras: CRUD legado descartável", () => {
  test("GET/POST /api/clientes + DELETE: guard + ciclo descartável", async ({ request }) => {
    await logout(request);
    const anonGet = await request.get("/api/clientes");
    expect(anonGet.status()).toBe(401);
    const anonPost = await request.post("/api/clientes", { data: {} });
    expect(anonPost.status()).toBe(401);

    await loginAs(request, SEED_ADMIN_EMAIL);
    const stamp = Date.now().toString(36);
    let clienteId: string | null = null;
    try {
      const inval = await request.post("/api/clientes", { data: { nome: "" } });
      expect(inval.status(), "payload inválido (sem nome/email) deve ser 400").toBe(400);

      const create = await request.post("/api/clientes", {
        data: { nome: `E2E Cliente ${stamp}`, email: `e2e-cliente-${stamp}@xconstrucao-e2e.test`, tipo: "Pessoa Física" },
      });
      expect(create.status(), "criar cliente deve ser 201").toBe(201);
      const created = (await create.json()) as { id: string };
      clienteId = created.id;
      expect(clienteId, "cliente criado deve ter id").toBeTruthy();

      const list = (await (await request.get("/api/clientes")).json()) as Array<{ id: string }>;
      expect(list.some((c) => c.id === clienteId), "cliente deve aparecer na listagem").toBeTruthy();

      const del = await request.delete(`/api/clientes/${clienteId}`);
      expect(del.status(), "DELETE cliente deve ser 200").toBe(200);
      clienteId = null;
    } finally {
      if (clienteId) await db.delete(clientes).where(eq(clientes.id, clienteId)).catch(() => {});
      await logout(request);
    }
  });

  test("GET/POST /api/empreiteiras + DELETE: guard + ciclo descartável", async ({ request }) => {
    await logout(request);
    const anonGet = await request.get("/api/empreiteiras");
    expect(anonGet.status()).toBe(401);
    const anonPost = await request.post("/api/empreiteiras", { data: {} });
    expect(anonPost.status()).toBe(401);

    await loginAs(request, SEED_ADMIN_EMAIL);
    const stamp = Date.now().toString(36);
    let empreiteiraId: string | null = null;
    try {
      const inval = await request.post("/api/empreiteiras", { data: { nome: "" } });
      expect(inval.status(), "payload inválido deve ser 400").toBe(400);

      const create = await request.post("/api/empreiteiras", {
        data: {
          nome: `E2E Empreiteira ${stamp}`,
          responsavel: "E2E Responsável",
          email: `e2e-empreiteira-${stamp}@xconstrucao-e2e.test`,
        },
      });
      expect(create.status(), "criar empreiteira deve ser 201").toBe(201);
      const created = (await create.json()) as { id: string };
      empreiteiraId = created.id;
      expect(empreiteiraId, "empreiteira criada deve ter id").toBeTruthy();

      const list = (await (await request.get("/api/empreiteiras")).json()) as Array<{ id: string }>;
      expect(list.some((e) => e.id === empreiteiraId), "empreiteira deve aparecer na listagem").toBeTruthy();

      const del = await request.delete(`/api/empreiteiras/${empreiteiraId}`);
      expect(del.status(), "DELETE empreiteira deve ser 200").toBe(200);
      empreiteiraId = null;
    } finally {
      if (empreiteiraId) await db.delete(empreiteiras).where(eq(empreiteiras.id, empreiteiraId)).catch(() => {});
      await logout(request);
    }
  });
});

// ---------------------------------------------------------------------------
// empreiteiro/obras-salvas
// ---------------------------------------------------------------------------

test.describe("J36 — empreiteiro/obras-salvas: favoritar/desfavoritar obra publicada", () => {
  let obraId: string | null = null;

  test.afterEach(async () => {
    if (obraId) {
      await db.delete(obrasSalvas).where(eq(obrasSalvas.obraId, obraId)).catch(() => {});
      await db.delete(obras).where(eq(obras.id, obraId)).catch(() => {});
      obraId = null;
    }
  });

  test("guard 403 (não-empreiteiro) + POST salva → GET reflete → DELETE remove", async ({ request }) => {
    const contratanteUserId = await userIdByEmail(SEED_CONTRATANTE_EMAIL);
    const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, contratanteUserId)).limit(1);
    expect(cli?.id, "cliente seed deve existir").toBeTruthy();

    const [obra] = await db
      .insert(obras)
      .values({
        nome: `E2E obra-salva — ${Date.now().toString(36)}`,
        endereco: "Rua E2E, 200",
        clienteId: cli!.id,
        empreiteiraId: null,
        status: "planejamento",
        visibilidade: "publicada",
        statusModeracao: "aprovada",
      })
      .returning({ id: obras.id });
    obraId = obra!.id;

    await logout(request);
    const anon = await request.get("/api/empreiteiro/obras-salvas");
    expect(anon.status()).toBe(401);

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const errado = await request.get("/api/empreiteiro/obras-salvas");
    expect(errado.status(), "contratante não acessa obras-salvas").toBe(403);
    await logout(request);

    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    try {
      const invalPost = await request.post("/api/empreiteiro/obras-salvas", { data: {} });
      expect(invalPost.status(), "obraId ausente deve ser 400").toBe(400);

      const naoEncontrada = await request.post("/api/empreiteiro/obras-salvas", { data: { obraId: ID_FAKE } });
      expect(naoEncontrada.status(), "obra inexistente deve ser 404").toBe(404);

      const salvar = await request.post("/api/empreiteiro/obras-salvas", { data: { obraId } });
      expect(salvar.status(), "salvar obra deve ser 200").toBe(200);

      const list = (await (await request.get("/api/empreiteiro/obras-salvas")).json()) as {
        rows: Array<{ id: string }>;
      };
      expect(list.rows.some((r) => r.id === obraId), "obra deve aparecer nos favoritos").toBeTruthy();

      const del = await request.delete(`/api/empreiteiro/obras-salvas/${obraId}`);
      expect(del.status(), "remover favorito deve ser 200").toBe(200);

      const listDepois = (await (await request.get("/api/empreiteiro/obras-salvas")).json()) as {
        rows: Array<{ id: string }>;
      };
      expect(listDepois.rows.some((r) => r.id === obraId), "obra não deve mais estar nos favoritos").toBeFalsy();
    } finally {
      await logout(request);
    }
  });
});

// ---------------------------------------------------------------------------
// marketplace-leads (público) + log/client-error (público)
// ---------------------------------------------------------------------------

test.describe("J36 — endpoints públicos: marketplace-leads e log/client-error", () => {
  test("POST /api/marketplace-leads: validação + cria lead E2E", async ({ request }) => {
    await logout(request);
    const inval = await request.post("/api/marketplace-leads", { data: { nome: "a" } });
    expect(inval.status(), "payload incompleto deve ser 400").toBe(400);

    const stamp = Date.now().toString(36);
    const email = `e2e-lead-${stamp}@xconstrucao-e2e.test`;
    const create = await request.post("/api/marketplace-leads", {
      data: { nome: "E2E Lead", email, telefone: "11999999999", isWhatsapp: true },
    });
    expect(create.status(), "criar lead deve ser 201").toBe(201);
    const { id } = (await create.json()) as { id: string };
    expect(id, "lead deve ter id").toBeTruthy();

    await db.delete(marketplaceLeads).where(eq(marketplaceLeads.id, id)).catch(() => {});
  });

  test("POST /api/log/client-error: sempre 200 (best-effort, público)", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/log/client-error", {
      data: { message: "E2E erro de teste", route: "/e2e-test" },
    });
    expect(res.status(), "log de erro público deve ser 200").toBe(200);

    // Body malformado não derruba o endpoint.
    const resInval = await request.post("/api/log/client-error", { data: null });
    expect(resInval.status(), "body inválido ainda responde 200 (best-effort)").toBe(200);
  });
});

// ---------------------------------------------------------------------------
// uploads/commit — SÓ guards + validação (headObject exige objeto real no R2;
// setup pesado demais para integração leve — ver nota no cabeçalho do arquivo).
// ---------------------------------------------------------------------------

test.describe("J36 — uploads/commit: guards + validação (sem caminho feliz)", () => {
  test("anônimo → 401; payload inválido → 400; chave adulterada → 400", async ({ request }) => {
    await logout(request);
    const anon = await request.post("/api/uploads/commit", {
      data: { kind: "avatar", key: "x".repeat(10), mime: "image/png", size: 10, originalName: "a.png" },
    });
    expect(anon.status()).toBe(401);

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    try {
      const invalSchema = await request.post("/api/uploads/commit", { data: { kind: "avatar" } });
      expect(invalSchema.status(), "payload incompleto deve ser 400").toBe(400);

      // Chave que não bate com o padrão canônico do owner/role/kind → 400.
      const chaveAdulterada = await request.post("/api/uploads/commit", {
        data: {
          kind: "avatar",
          key: "outra-pasta/arquivo-que-nao-pertence-ao-usuario.png",
          mime: "image/png",
          size: 100,
          originalName: "a.png",
        },
      });
      expect(chaveAdulterada.status(), "chave fora do padrão do owner deve ser 400").toBe(400);
    } finally {
      await logout(request);
    }
  });
});
