import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, clienteDocumentos, obras, userFiles } from "@shared/db/schema";
import {
  loginAs,
  logout,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  SEED_ADMIN_EMAIL,
} from "../helpers";
import { userIdByEmail } from "../helpers-marketplace";

/**
 * Integração (J36) — G?: admin operacional (impersonate + dossiê do cliente + saúde).
 *
 * Endpoints:
 *   - POST /api/admin/impersonate/[id] · POST /api/admin/impersonate/exit
 *   - GET/POST/DELETE /api/admin/clientes/[id]/documentos
 *   - GET/PATCH       /api/admin/clientes/[id]/obras
 *   - GET             /api/admin/clientes/[id]/atividades
 *   - GET             /api/admin/clientes/[id]/financeiro
 *   - GET             /api/admin/saude
 *
 * Descobertas técnicas:
 *   - impersonate/[id] usa requireVerifiedUser + checa `guard.user.role !==
 *     "superadmin"` (não `isAdminLike`) — só SUPERADMIN impersona. O seed
 *     `admin@xconstrucao.com` é promovido a superadmin no boot
 *     (server/bootstrap-superadmin.ts), então é o único ator disponível que passa.
 *     Barra self-impersonation (400), alvo inexistente (404), alvo superadmin
 *     (403) e alvo inativo (400). O cookie de impersonação é `secure: true` —
 *     como os testes rodam sobre HTTP local, validamos o efeito melhor pelo
 *     endpoint (GET /api/auth/me reflete `impersonation`) em vez de inspecionar
 *     o Set-Cookie a olho nu.
 *   - impersonate/exit não exige verificação de sessão "normal" (funciona mesmo
 *     durante impersonation) — sempre limpa o cookie e devolve 200, mesmo sem
 *     nunca ter impersonado ninguém (idempotente).
 *   - clientes/[id]/{documentos,obras,atividades,financeiro} usam `requireAdmin`
 *     (isAdminLike: admin OU superadmin) — cobrimos com o admin de seed.
 *   - documentos POST exige um `userFiles.id` com `kind='cliente_documento'` já
 *     existente (anti-IDOR); como não há endpoint de upload trivial num teste
 *     HTTP puro, inserimos a linha `userFiles` diretamente via `db` (mesmo padrão
 *     de outras specs de integração que criam fixtures pelo Drizzle). DELETE é
 *     soft-delete (`deletedAt`).
 *   - obras/[id] PATCH tem escopo duplo (obraId + clienteId) — usamos a obra
 *     E2E criada no teste para provar o efeito e o 404 quando a obra não é
 *     daquele cliente.
 *   - saude é somente leitura (dashboards de app_errors/job_runs/audit_logs) —
 *     cobrimos guards + 200 com o shape básico.
 *   - Isolamento: clienteId resolvido do cliente seed do contratante
 *     (joão@construtora.com) via `db.select` direto (userIdByEmail +
 *     tabela clientes). Documento/obra criados e limpos neste spec; nunca
 *     tocamos o dossiê do cliente além do que criamos.
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; seed com joão
 * (contratante+cliente), maria (empreiteiro+empreiteira), admin (→ superadmin).
 */

const UUID_INEXISTENTE = "00000000-0000-0000-0000-000000000000";

/** Resolve o `clientes.id` do contratante seed (joão) via consulta direta. */
async function clienteIdDoSeed(): Promise<string> {
  const userId = await userIdByEmail(SEED_CONTRATANTE_EMAIL);
  const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, userId)).limit(1);
  expect(cli?.id, "cliente seed do contratante deve existir").toBeTruthy();
  return cli!.id;
}

// ===========================================================================
// impersonate
// ===========================================================================

test.describe("Integração — admin: impersonate", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post(`/api/admin/impersonate/${UUID_INEXISTENTE}`);
    expect(res.status()).toBe(401);
  });

  test("não-superadmin (contratante) → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const alvoId = await userIdByEmail(SEED_EMPREITEIRO_EMAIL);
    const res = await request.post(`/api/admin/impersonate/${alvoId}`);
    expect(res.status(), "contratante não pode impersonar").toBe(403);
    await logout(request);
  });

  test("self-impersonation → 400", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const adminId = await userIdByEmail(SEED_ADMIN_EMAIL);
    const res = await request.post(`/api/admin/impersonate/${adminId}`);
    expect(res.status(), "impersonar a si mesmo deve ser barrado").toBe(400);
    await logout(request);
  });

  test("alvo inexistente → 404", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.post(`/api/admin/impersonate/${UUID_INEXISTENTE}`);
    expect(res.status()).toBe(404);
    await logout(request);
  });

  test("fluxo feliz: superadmin impersona contratante → cookie de impersonação emitido → exit limpa o cookie", async ({
    request,
  }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const alvoId = await userIdByEmail(SEED_CONTRATANTE_EMAIL);

    const iniciar = await request.post(`/api/admin/impersonate/${alvoId}`);
    expect(iniciar.status(), `impersonate deveria dar 200; corpo: ${await iniciar.text()}`).toBe(200);
    const body = await iniciar.json();
    expect(body.ok).toBe(true);
    expect(body.target?.email).toBe(SEED_CONTRATANTE_EMAIL);
    expect(body.target?.id).toBe(alvoId);

    // Efeito real: a resposta emite o cookie de impersonação. Ele é `secure: true`
    // (produção) e o request context do Playwright roda sobre HTTP puro em
    // 127.0.0.1 — o cookie-jar do teste não reaproveita cookies Secure numa
    // origem não-TLS (mesma semântica de um browser real), então checamos o
    // Set-Cookie bruto da resposta em vez de depender do jar para inspecionar
    // `/me` como o alvo impersonado.
    const setCookieIniciar = iniciar.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie");
    expect(
      setCookieIniciar.some((h) => h.value.toLowerCase().includes("impersonation")),
      "resposta deve emitir o cookie de impersonação"
    ).toBeTruthy();

    // exit: sempre limpa o cookie de impersonação (maxAge=0), mesmo sem o jar
    // ter carregado o de início — o endpoint não exige estar "em" impersonation.
    const sair = await request.post("/api/admin/impersonate/exit");
    expect(sair.status(), `exit deveria dar 200; corpo: ${await sair.text()}`).toBe(200);
    expect((await sair.json()).ok).toBe(true);
    const setCookieSair = sair.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie");
    expect(
      setCookieSair.some((h) => h.value.toLowerCase().includes("impersonation") && /max-age=0/i.test(h.value)),
      "exit deve expirar o cookie de impersonação"
    ).toBeTruthy();

    await logout(request);
  });

  test("exit sem nunca ter impersonado → 200 idempotente", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.post("/api/admin/impersonate/exit");
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
    await logout(request);
  });
});

// ===========================================================================
// clientes/[id]/documentos
// ===========================================================================

test.describe("Integração — admin: clientes/[id]/documentos", () => {
  test("GET sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get(`/api/admin/clientes/${UUID_INEXISTENTE}/documentos`);
    expect(res.status()).toBe(401);
  });

  test("GET como não-admin (empreiteiro) → 403", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const res = await request.get(`/api/admin/clientes/${UUID_INEXISTENTE}/documentos`);
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("POST payload inválido (sem fileId) → 400", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.post(`/api/admin/clientes/${UUID_INEXISTENTE}/documentos`, {
      data: { nome: "Contrato" },
    });
    expect(res.status()).toBe(400);
    await logout(request);
  });

  test("POST com cliente inexistente → 404", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.post(`/api/admin/clientes/${UUID_INEXISTENTE}/documentos`, {
      data: { fileId: UUID_INEXISTENTE, nome: "Contrato" },
    });
    expect(res.status()).toBe(404);
    await logout(request);
  });

  test("fluxo feliz: POST anexa (com userFiles real) → GET lista → DELETE soft-remove", async ({ request }) => {
    const clienteId = await clienteIdDoSeed();
    const contratanteUserId = await userIdByEmail(SEED_CONTRATANTE_EMAIL);

    // Fixture: arquivo real do kind esperado (anti-IDOR checa isso no service).
    const [file] = await db
      .insert(userFiles)
      .values({
        ownerUserId: contratanteUserId,
        kind: "cliente_documento",
        visibility: "private",
        bucketKey: `e2e/admin-operacional/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`,
        originalName: "contrato-e2e.pdf",
        mime: "application/pdf",
        sizeBytes: 1024,
      })
      .returning({ id: userFiles.id });

    let documentoId: string | null = null;
    try {
      await loginAs(request, SEED_ADMIN_EMAIL);

      const post = await request.post(`/api/admin/clientes/${clienteId}/documentos`, {
        data: { fileId: file!.id, nome: "E2E Contrato Social" },
      });
      expect(post.status(), `POST deveria dar 201; corpo: ${await post.text()}`).toBe(201);
      expect((await post.json()).ok).toBe(true);

      // Efeito real no banco.
      const [criado] = await db
        .select({ id: clienteDocumentos.id, nome: clienteDocumentos.nome })
        .from(clienteDocumentos)
        .where(eq(clienteDocumentos.fileId, file!.id))
        .limit(1);
      expect(criado?.id, "documento deve existir no banco").toBeTruthy();
      expect(criado?.nome).toBe("E2E Contrato Social");
      documentoId = criado!.id;

      // Aparece na listagem.
      const get = await request.get(`/api/admin/clientes/${clienteId}/documentos`);
      expect(get.status()).toBe(200);
      const lista = (await get.json()) as Array<{ id: string; nome: string }>;
      expect(lista.some((d) => d.id === documentoId), "documento deve aparecer na listagem").toBeTruthy();

      // DELETE sem documentoId → 400.
      const delSemId = await request.delete(`/api/admin/clientes/${clienteId}/documentos`);
      expect(delSemId.status()).toBe(400);

      // DELETE do documento criado → soft-delete.
      const del = await request.delete(
        `/api/admin/clientes/${clienteId}/documentos?documentoId=${documentoId}`
      );
      expect(del.status(), `DELETE deveria dar 200; corpo: ${await del.text()}`).toBe(200);
      expect((await del.json()).ok).toBe(true);

      const [apagado] = await db
        .select({ deletedAt: clienteDocumentos.deletedAt })
        .from(clienteDocumentos)
        .where(eq(clienteDocumentos.id, documentoId))
        .limit(1);
      expect(apagado?.deletedAt, "documento deve estar soft-deletado").toBeTruthy();

      // Não aparece mais na listagem.
      const getDepois = await request.get(`/api/admin/clientes/${clienteId}/documentos`);
      const listaDepois = (await getDepois.json()) as Array<{ id: string }>;
      expect(listaDepois.some((d) => d.id === documentoId), "documento removido não deve aparecer").toBeFalsy();

      // DELETE de novo (já removido) → 404.
      const delDeNovo = await request.delete(
        `/api/admin/clientes/${clienteId}/documentos?documentoId=${documentoId}`
      );
      expect(delDeNovo.status(), "remover documento já removido → 404").toBe(404);

      await logout(request);
    } finally {
      await db.delete(clienteDocumentos).where(eq(clienteDocumentos.fileId, file!.id)).catch(() => {});
      await db.delete(userFiles).where(eq(userFiles.id, file!.id)).catch(() => {});
    }
  });
});

// ===========================================================================
// clientes/[id]/obras
// ===========================================================================

test.describe("Integração — admin: clientes/[id]/obras", () => {
  test("GET sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get(`/api/admin/clientes/${UUID_INEXISTENTE}/obras`);
    expect(res.status()).toBe(401);
  });

  test("GET como não-admin → 403", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const res = await request.get(`/api/admin/clientes/${UUID_INEXISTENTE}/obras`);
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("PATCH payload inválido (status fora do enum) → 400", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.patch(`/api/admin/clientes/${UUID_INEXISTENTE}/obras`, {
      data: { obraId: UUID_INEXISTENTE, status: "nao-existe", previsaoFim: null },
    });
    expect(res.status()).toBe(400);
    await logout(request);
  });

  test("PATCH de obra que não pertence ao cliente → 404 (escopo duplo)", async ({ request }) => {
    const clienteId = await clienteIdDoSeed();
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.patch(`/api/admin/clientes/${clienteId}/obras`, {
      data: { obraId: UUID_INEXISTENTE, status: "pausada", previsaoFim: null },
    });
    expect(res.status()).toBe(404);
    await logout(request);
  });

  test("fluxo feliz: GET lista → PATCH altera status → efeito persiste no banco", async ({ request }) => {
    const clienteId = await clienteIdDoSeed();
    const contratanteUserId = await userIdByEmail(SEED_CONTRATANTE_EMAIL);
    const empUserId = await userIdByEmail(SEED_EMPREITEIRO_EMAIL);
    void contratanteUserId;
    void empUserId;

    const [obra] = await db
      .insert(obras)
      .values({
        nome: `E2E admin-operacional — Obra ${Date.now()}`,
        endereco: "Rua E2E Admin, 200",
        clienteId,
        status: "planejamento",
        visibilidade: "publicada",
        statusModeracao: "aprovada",
      })
      .returning({ id: obras.id });

    try {
      await loginAs(request, SEED_ADMIN_EMAIL);

      const get = await request.get(`/api/admin/clientes/${clienteId}/obras`);
      expect(get.status()).toBe(200);
      const lista = (await get.json()) as Array<{ id: string }>;
      expect(lista.some((o) => o.id === obra!.id), "obra E2E deve aparecer na listagem").toBeTruthy();

      const patch = await request.patch(`/api/admin/clientes/${clienteId}/obras`, {
        data: { obraId: obra!.id, status: "pausada", previsaoFim: "2026-12-31" },
      });
      expect(patch.status(), `PATCH deveria dar 200; corpo: ${await patch.text()}`).toBe(200);

      const [depois] = await db
        .select({ status: obras.status, previsao: obras.dataPrevisao })
        .from(obras)
        .where(eq(obras.id, obra!.id))
        .limit(1);
      expect(depois?.status, "status deve refletir a mudança").toBe("pausada");
      expect(depois?.previsao).toBe("2026-12-31");

      await logout(request);
    } finally {
      await db.delete(obras).where(eq(obras.id, obra!.id)).catch(() => {});
    }
  });
});

// ===========================================================================
// clientes/[id]/atividades (read-only)
// ===========================================================================

test.describe("Integração — admin: clientes/[id]/atividades", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get(`/api/admin/clientes/${UUID_INEXISTENTE}/atividades`);
    expect(res.status()).toBe(401);
  });

  test("como não-admin → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.get(`/api/admin/clientes/${UUID_INEXISTENTE}/atividades`);
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("admin lista atividades do cliente seed → 200 array", async ({ request }) => {
    const clienteId = await clienteIdDoSeed();
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.get(`/api/admin/clientes/${clienteId}/atividades`);
    expect(res.status(), `esperado 200; corpo: ${await res.text()}`).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
    await logout(request);
  });
});

// ===========================================================================
// clientes/[id]/financeiro (read-only)
// ===========================================================================

test.describe("Integração — admin: clientes/[id]/financeiro", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get(`/api/admin/clientes/${UUID_INEXISTENTE}/financeiro`);
    expect(res.status()).toBe(401);
  });

  test("como não-admin → 403", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const res = await request.get(`/api/admin/clientes/${UUID_INEXISTENTE}/financeiro`);
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("admin consulta financeiro do cliente seed → 200 com o shape esperado", async ({ request }) => {
    const clienteId = await clienteIdDoSeed();
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.get(`/api/admin/clientes/${clienteId}/financeiro`);
    expect(res.status(), `esperado 200; corpo: ${await res.text()}`).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("totalPago");
    expect(body).toHaveProperty("saldoPendente");
    expect(Array.isArray(body.pagamentos)).toBe(true);
    await logout(request);
  });
});

// ===========================================================================
// GET /api/admin/saude (read-only)
// ===========================================================================

test.describe("Integração — admin: saude", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/admin/saude");
    expect(res.status()).toBe(401);
  });

  test("como não-admin → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.get("/api/admin/saude");
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("admin consulta saúde da plataforma → 200 com o shape esperado", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.get("/api/admin/saude");
    expect(res.status(), `esperado 200; corpo: ${await res.text()}`).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("erros");
    expect(body).toHaveProperty("usuarios");
    expect(body).toHaveProperty("jobs");
    expect(body).toHaveProperty("webhooks");
    expect(typeof body.erros.total24h).toBe("number");
    await logout(request);
  });
});
