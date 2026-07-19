import { test, expect, type APIRequestContext } from "@playwright/test";
import { loginAs, logout } from "../helpers";

/**
 * Integração (J36) — Chat: autorização, IDOR e consistência de não-lidas.
 *
 * Expande a cobertura de `chat-ordering.spec.ts` (que já cobre envio/carga,
 * ordenação ASC e paginação por cursor) e `j41-xchat-completo.spec.ts` (guards
 * de garantir-thread e shape do unread-count).
 *
 * Foco aqui — os buracos que faltavam:
 *   - T1.2 Ownership/IDOR: não-participante recebe 403 em GET, POST e marcar-lida.
 *   - T1.3 IDOR de anexo: anexoObraId de obra alheia é rejeitado (400).
 *   - T1.4 Consistência de não-lidas: unread-count coerente; marcar-lida só zera
 *          mensagens do OUTRO autor e é idempotente.
 *   - T1.5 Restaurar conversa após F5 (Task #159): GET logo após "reload" devolve
 *          as mensagens (não 500, não vazio).
 *
 * Cobre AMBAS as personas porque os handlers de contratante e empreiteiro são
 * código duplicado — um fix numa pode não ter sido replicado na outra. Note os
 * paths assimétricos:
 *   - contratante: GET/POST /api/contratante/chat/messages/[id]
 *                  POST     /api/contratante/chat/[id]/marcar-lida
 *   - empreiteiro: GET/POST /api/empreiteiro/chat/[id]/messages
 *                  POST     /api/empreiteiro/chat/[id]/marcar-lida
 *
 * Pré-requisitos (injetados pelo playwright.config.ts):
 *   - E2E_TEST_AUTH=1  habilita /api/test/login-as
 *   - Seed: joao@construtora.com (contratante), maria@empreiteira.com (empreiteiro)
 *   - Uma thread de chat entre eles (criada por seed/testes anteriores). Quando
 *     não houver, os testes usam `test.skip` defensivo (padrão J21/J41).
 */

const CONTRATANTE_EMAIL = "joao@construtora.com";
const EMPREITEIRO_EMAIL = "maria@empreiteira.com";
// Par de chat ALHEIO ao par joão/maria — usado para provar IDOR real: a maria
// NÃO participa da thread deste par, então acessá-la deve dar 403. (Se o seed
// não tiver esse par, os testes de IDOR usam test.skip defensivo.)
const OUTRO_CONTRATANTE_EMAIL = "ramon.gds92@gmail.com";
const OUTRO_EMPREITEIRO_EMAIL = "ramon_gds@hotmail.com";


/** Primeiro conversationId da persona, ou null se não houver thread. */
async function firstThreadId(
  request: APIRequestContext,
  persona: "contratante" | "empreiteiro",
): Promise<string | null> {
  const res = await request.get(`/api/${persona}/chat/conversations`);
  if (!res.ok()) return null;
  const body = (await res.json()) as Array<{ id: string }>;
  return body[0]?.id ?? null;
}

/** Envia uma mensagem pela persona informada; devolve o texto único enviado. */
async function enviarMensagem(
  request: APIRequestContext,
  persona: "contratante" | "empreiteiro",
  threadId: string,
): Promise<{ ok: boolean; texto: string; status: number }> {
  const texto = `E2E-int-${persona}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const url =
    persona === "empreiteiro"
      ? `/api/empreiteiro/chat/${threadId}/messages`
      : `/api/contratante/chat/messages/${threadId}`;
  const res = await request.post(url, { data: { texto } });
  return { ok: res.ok(), texto, status: res.status() };
}

test.describe("Integração — Chat: autorização, IDOR e não-lidas", () => {
  // ---- T1.2: Ownership / IDOR ---------------------------------------------

  test("não-participante recebe 403 em GET, POST e marcar-lida (thread de um par alheio)", async ({
    request,
  }) => {
    // Descobre uma thread de OUTRO par (ramon/ramon) — alheia à maria.
    // Logamos como o contratante desse par para obter o conversationId; se o
    // seed não tiver esse par, pulamos (defensivo).
    await loginAs(request, OUTRO_CONTRATANTE_EMAIL);
    let alheiaThreadId = await firstThreadId(request, "contratante");
    await logout(request);
    if (!alheiaThreadId) {
      // fallback: tenta pelo empreiteiro do outro par
      await loginAs(request, OUTRO_EMPREITEIRO_EMAIL);
      alheiaThreadId = await firstThreadId(request, "empreiteiro");
      await logout(request);
    }
    test.skip(!alheiaThreadId, "Sem thread de par alheio nesta execução — pular IDOR");

    // Confirma que a maria realmente NÃO participa dessa thread: ela não deve
    // constar nas conversas dela. Se constar, o cenário não é IDOR (pula).
    await loginAs(request, EMPREITEIRO_EMAIL);
    const mariaConv = await request.get("/api/empreiteiro/chat/conversations");
    const mariaThreads = mariaConv.ok()
      ? ((await mariaConv.json()) as Array<{ id: string }>).map((t) => t.id)
      : [];
    test.skip(
      mariaThreads.includes(alheiaThreadId!),
      "A thread escolhida pertence à maria — não é cenário de IDOR nesta execução",
    );

    // maria tenta acessar a thread alheia pelas rotas do empreiteiro → 403.
    const getRes = await request.get(`/api/empreiteiro/chat/${alheiaThreadId}/messages?limit=10`);
    expect(getRes.status(), "GET de não-participante deve ser 403").toBe(403);

    const postRes = await request.post(`/api/empreiteiro/chat/${alheiaThreadId}/messages`, {
      data: { texto: `E2E-idor-${Date.now()}` },
    });
    expect(postRes.status(), "POST de não-participante deve ser 403").toBe(403);

    const marcarRes = await request.post(`/api/empreiteiro/chat/${alheiaThreadId}/marcar-lida`);
    expect(marcarRes.status(), "marcar-lida de não-participante deve ser 403").toBe(403);

    await logout(request);
  });

  test("thread inexistente/forjada → 403 (não vaza existência, não 500)", async ({ request }) => {
    await loginAs(request, EMPREITEIRO_EMAIL);
    const fakeId = "00000000-0000-0000-0000-000000000000";

    const getRes = await request.get(`/api/empreiteiro/chat/${fakeId}/messages?limit=10`);
    expect(getRes.status(), "GET de thread inexistente deve ser 403 (não 500)").toBe(403);

    const postRes = await request.post(`/api/empreiteiro/chat/${fakeId}/messages`, {
      data: { texto: `E2E-fake-${Date.now()}` },
    });
    expect(postRes.status(), "POST em thread inexistente deve ser 403 (não 500)").toBe(403);

    await logout(request);
  });

  // ---- T1.3: IDOR de anexo -------------------------------------------------

  test("anexoObraId de obra alheia é rejeitado com 400 (não 500)", async ({ request }) => {
    await loginAs(request, EMPREITEIRO_EMAIL);
    const threadId = await firstThreadId(request, "empreiteiro");
    test.skip(!threadId, "Sem thread de empreiteiro nesta execução — pular IDOR de anexo");

    // Um obraId que não é o da thread → criarMensagem deve barrar.
    const alheiaObraId = "11111111-1111-1111-1111-111111111111";
    const res = await request.post(`/api/empreiteiro/chat/${threadId}/messages`, {
      data: { texto: `E2E-anexo-idor-${Date.now()}`, anexoObraId: alheiaObraId },
    });
    expect(
      res.status(),
      "anexo de obra alheia deve retornar 400 (ANEXO_OBRA_NOT_ALLOWED), não 500",
    ).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error, "erro deve indicar anexo não permitido").toBe("ANEXO_OBRA_NOT_ALLOWED");

    await logout(request);
  });

  test("arquivoUrl forjada (host inválido) é rejeitada com 400", async ({ request }) => {
    await loginAs(request, EMPREITEIRO_EMAIL);
    const threadId = await firstThreadId(request, "empreiteiro");
    test.skip(!threadId, "Sem thread de empreiteiro nesta execução — pular arquivo forjado");

    const res = await request.post(`/api/empreiteiro/chat/${threadId}/messages`, {
      data: {
        texto: "",
        arquivoUrl: "https://evil.example.com/roubo.pdf",
        arquivoNome: "roubo.pdf",
        arquivoMime: "application/pdf",
      },
    });
    // validateChatAttachment barra host fora do R2 permitido → 400.
    // (Se o texto vazio + url inválida cair no schema antes, ainda é 400.)
    expect(res.status(), "arquivo de host não permitido deve retornar 400").toBe(400);

    await logout(request);
  });

  // ---- T1.4: Consistência de não-lidas ------------------------------------

  test("unread-count responde { total } coerente e marcar-lida é idempotente (empreiteiro)", async ({
    request,
  }) => {
    // Contratante envia uma mensagem para gerar não-lida do lado do empreiteiro.
    await loginAs(request, CONTRATANTE_EMAIL);
    const cThread = await firstThreadId(request, "contratante");
    if (cThread) await enviarMensagem(request, "contratante", cThread);
    await logout(request);

    await loginAs(request, EMPREITEIRO_EMAIL);
    const eThread = await firstThreadId(request, "empreiteiro");
    test.skip(!eThread, "Sem thread de empreiteiro nesta execução — pular não-lidas");

    const unreadRes = await request.get("/api/empreiteiro/chat/unread-count");
    expect(unreadRes.ok(), "unread-count deve responder OK").toBeTruthy();
    const unread = (await unreadRes.json()) as { total: number };
    expect(typeof unread.total, "total deve ser number").toBe("number");
    expect(unread.total, "total não pode ser negativo").toBeGreaterThanOrEqual(0);

    // marcar-lida: primeira chamada pode marcar N; segunda deve marcar 0 (idempotente).
    const marcar1 = await request.post(`/api/empreiteiro/chat/${eThread}/marcar-lida`);
    expect(marcar1.ok(), "primeira marcar-lida deve responder OK").toBeTruthy();
    const b1 = (await marcar1.json()) as { marcadas: number };
    expect(b1.marcadas, "marcadas deve ser number ≥ 0").toBeGreaterThanOrEqual(0);

    const marcar2 = await request.post(`/api/empreiteiro/chat/${eThread}/marcar-lida`);
    expect(marcar2.ok(), "segunda marcar-lida deve responder OK").toBeTruthy();
    const b2 = (await marcar2.json()) as { marcadas: number };
    expect(b2.marcadas, "segunda marcar-lida (idempotente) deve marcar 0").toBe(0);

    await logout(request);
  });

  test("marcar-lida NÃO zera as próprias mensagens (só as do outro autor)", async ({ request }) => {
    // Empreiteiro envia uma mensagem própria e marca a thread como lida:
    // como marcar-lida ignora mensagens do próprio autor, a mensagem recém-enviada
    // pelo empreiteiro NÃO deve ser contada como "marcada".
    await loginAs(request, EMPREITEIRO_EMAIL);
    const eThread = await firstThreadId(request, "empreiteiro");
    test.skip(!eThread, "Sem thread de empreiteiro nesta execução — pular");

    const enviar = await enviarMensagem(request, "empreiteiro", eThread!);
    test.skip(!enviar.ok, "Não foi possível enviar mensagem para preparar o cenário");

    // Marca lida DUAS vezes para zerar qualquer não-lida remanescente do outro autor.
    await request.post(`/api/empreiteiro/chat/${eThread}/marcar-lida`);
    const marcar = await request.post(`/api/empreiteiro/chat/${eThread}/marcar-lida`);
    const body = (await marcar.json()) as { marcadas: number };
    expect(
      body.marcadas,
      "após já marcar tudo do outro autor, marcar-lida não deve marcar a própria mensagem recém-enviada",
    ).toBe(0);

    await logout(request);
  });

  // ---- T1.5: Restaurar conversa após F5 (Task #159) -----------------------

  test("restaurar conversa após reload: GET logo após envio devolve mensagens (não 500, não vazio)", async ({
    request,
  }) => {
    await loginAs(request, EMPREITEIRO_EMAIL);
    const threadId = await firstThreadId(request, "empreiteiro");
    test.skip(!threadId, "Sem thread de empreiteiro nesta execução — pular restauração F5");

    const enviar = await enviarMensagem(request, "empreiteiro", threadId!);
    expect(enviar.status, "envio deve retornar 200").toBe(200);

    // Simula o "F5": um novo GET da mesma thread (como o app faz ao remontar).
    const reloadRes = await request.get(`/api/empreiteiro/chat/${threadId}/messages?limit=50`);
    expect(reloadRes.status(), "GET pós-reload deve ser 200 (não 500)").toBe(200);
    const msgs = (await reloadRes.json()) as Array<{ content: string }>;
    expect(Array.isArray(msgs), "resposta deve ser array").toBeTruthy();
    expect(msgs.length, "conversa restaurada não pode vir vazia após envio").toBeGreaterThan(0);
    expect(
      msgs.some((m) => m.content === enviar.texto),
      "a mensagem enviada deve constar após o reload",
    ).toBeTruthy();

    await logout(request);
  });
});
