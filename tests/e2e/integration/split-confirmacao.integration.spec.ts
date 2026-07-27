import { test, expect, type APIRequestContext } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { financeiro, obras, pagamentosSplit, users } from "@shared/db/schema";
import {
  uniqueEmail,
  uniqueUsername,
  waitForVerificationEmail,
} from "../helpers";

/**
 * Integração (J48) — Confirmação de pagamento de obra via webhook / split.
 *
 * `aplicarEventoSplit` (features/marketplace/aplicar-evento-split.ts) é chamado
 * pelo webhook real quando o `externalReference` tem o prefixo
 * `xconstrucao-obra|financeiroId|obraId|splitId` (helper `buildExternalRefObra`
 * em features/marketplace/split-service.ts). O simulador de teste
 * `POST /api/test/webhooks/asaas` (gated por E2E_TEST_AUTH=1) roteia por esse
 * mesmo prefixo direto para `aplicarEventoSplit` — sem depender de credencial
 * ASAAS — então o caminho feliz é 100% testável aqui (app/api/test/webhooks/asaas/route.ts).
 *
 * Cobertura:
 *   1. Confirmação feliz: split pendente + financeiro pendente → payment_succeeded
 *      → processed:true, split confirmado, financeiro pago (metodo asaas_split),
 *      obras.valor_pago recomputado.
 *   2. Idempotência: reenvio do mesmo evento (split já confirmado) → processed:false,
 *      valor_pago não duplica.
 *   3. payment_failed: split pendente → falhou, financeiro segue pendente.
 *   4. Split inexistente: processed:false, sem erro 500.
 *   5. REGRESSÃO DE FRONTEIRA: evento de assinatura (prefixo `xconstrucao|...`,
 *      sem o `-obra`) não deve tocar pagamentos_split — prova que o roteamento
 *      por prefixo de externalReference não vaza entre os dois fluxos.
 *
 * Isolamento: cria users/obra/financeiro/split E2E fresh por teste, limpa
 * em `finally` de cada teste (sem afterEach global, pois os ids variam).
 */

const ENDPOINT = "/api/test/webhooks/asaas";
const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };
const CPF_VALIDO = "52998224725";
// Empreiteiro se cadastra como pessoa jurídica (registerSchema exige CNPJ).
const CNPJ_VALIDO = "11222333000181";

function uniqueEventId(tag: string): string {
  return `E2E-split-${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function post(request: APIRequestContext, body: unknown) {
  return request.post(ENDPOINT, {
    headers: { "content-type": "application/json" },
    data: body,
  });
}

/**
 * Verifica o email de um usuário recém-registrado via link capturado
 * (EMAIL_TEST_MODE=1). Necessário para satisfazer fluxos que exigem
 * emailVerified=true — mantém o padrão dos demais specs desta suíte mesmo
 * que este endpoint específico não exija sessão.
 */
async function verificarEmail(request: APIRequestContext, email: string): Promise<void> {
  const captured = await waitForVerificationEmail(request, email);
  const verifyUrl = captured.meta?.verificationUrl as string;
  const token = new URL(verifyUrl).searchParams.get("token");
  expect(token, `token de verificação deve existir no link capturado para ${email}`).toBeTruthy();
  const res = await request.get(`/api/auth/verify-email?token=${encodeURIComponent(token!)}`, {
    maxRedirects: 0,
  });
  expect(
    res.headers()["location"] ?? "",
    `verify-email deveria confirmar o email de ${email}`,
  ).toContain("success=");
}

/** Registra um contratante E2E (pagador) e verifica o email. Retorna o id. */
async function registrarContratante(request: APIRequestContext, tag: string): Promise<string> {
  const email = uniqueEmail(`split-conf-ctr-${tag}`);
  const res = await request.post("/api/auth/register", {
    data: {
      name: `E2E Contratante SplitConf ${tag}`,
      email,
      username: uniqueUsername(`splcfctr${tag}`),
      password: "Xconstr@E2E2026!",
      role: "contratante",
      phone: "11977770000",
      cpfCnpj: CPF_VALIDO,
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(
    [200, 201].includes(res.status()),
    `registro E2E contratante deve funcionar, recebeu ${res.status()}`,
  ).toBeTruthy();
  await verificarEmail(request, email);
  const row = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  expect(row[0]?.id, "usuário deve existir no banco após registro").toBeTruthy();
  return row[0].id;
}

/** Registra um empreiteiro E2E (recebedor) e verifica o email. Retorna o id. */
async function registrarEmpreiteiro(request: APIRequestContext, tag: string): Promise<string> {
  const email = uniqueEmail(`split-conf-emp-${tag}`);
  const res = await request.post("/api/auth/register", {
    data: {
      name: `E2E Empreiteiro SplitConf ${tag}`,
      email,
      username: uniqueUsername(`splcfemp${tag}`),
      password: "Xconstr@E2E2026!",
      role: "empreiteiro",
      phone: "11988880000",
      cpfCnpj: CNPJ_VALIDO,
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(
    [200, 201].includes(res.status()),
    `registro E2E empreiteiro deve funcionar, recebeu ${res.status()}`,
  ).toBeTruthy();
  await verificarEmail(request, email);
  const row = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  expect(row[0]?.id, "usuário deve existir no banco após registro").toBeTruthy();
  return row[0].id;
}

/** Cria uma obra E2E mínima. Retorna o id. */
async function criarObra(): Promise<string> {
  const [row] = await db
    .insert(obras)
    .values({
      nome: "E2E Split Confirmação — Obra",
      endereco: "Rua de Teste, 123",
    })
    .returning({ id: obras.id });
  return row.id;
}

/** Insere um lançamento `financeiro` pendente de obra (tipo saida). Retorna o id. */
async function criarFinanceiroPendente(args: {
  obraId: string;
  pagadorUserId: string;
  recebedorUserId: string;
  valor: number;
}): Promise<string> {
  const [row] = await db
    .insert(financeiro)
    .values({
      tipo: "saida",
      descricao: "E2E Split Confirmação — pagamento de obra",
      valor: String(args.valor),
      data: new Date().toISOString().slice(0, 10),
      escopo: "obra",
      obraId: args.obraId,
      categoria: "Medição",
      status: "pendente",
      pagadorUserId: args.pagadorUserId,
      recebedorUserId: args.recebedorUserId,
    })
    .returning({ id: financeiro.id });
  return row.id;
}

/** Insere um `pagamentos_split` pendente. Retorna o id. */
async function criarSplitPendente(args: {
  financeiroId: string;
  obraId: string;
  recebedorUserId: string;
  valorTotal: number;
}): Promise<string> {
  const valorEmpreiteiro = args.valorTotal * 0.9;
  const [row] = await db
    .insert(pagamentosSplit)
    .values({
      financeiroId: args.financeiroId,
      obraId: args.obraId,
      recebedorUserId: args.recebedorUserId,
      valorTotal: String(args.valorTotal),
      valorPlataforma: String(args.valorTotal - valorEmpreiteiro),
      valorEmpreiteiro: String(valorEmpreiteiro),
      percentualPlataforma: "10",
      walletIdEmpreiteiro: `E2E-wallet-${Date.now().toString(36)}`,
      status: "pendente",
    })
    .returning({ id: pagamentosSplit.id });
  return row.id;
}

function externalRefObra(financeiroId: string, obraId: string, splitId: string): string {
  return `xconstrucao-obra|${financeiroId}|${obraId}|${splitId}`;
}

async function limparTudo(args: {
  financeiroId?: string | null;
  obraId?: string | null;
  userIds?: Array<string | null | undefined>;
}): Promise<void> {
  if (args.financeiroId) {
    await db.delete(pagamentosSplit).where(eq(pagamentosSplit.financeiroId, args.financeiroId)).catch(() => {});
    await db.delete(financeiro).where(eq(financeiro.id, args.financeiroId)).catch(() => {});
  }
  if (args.obraId) {
    await db.delete(obras).where(eq(obras.id, args.obraId)).catch(() => {});
  }
  for (const id of args.userIds ?? []) {
    if (!id) continue;
    await db.delete(users).where(eq(users.id, id)).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// 1 — Confirmação feliz
// ---------------------------------------------------------------------------

test.describe("J48 — split-confirmacao: confirmação feliz", () => {
  test("payment_succeeded com split pendente → confirmado + financeiro pago + obras.valor_pago recomputado", async ({
    request,
  }) => {
    const pagadorId = await registrarContratante(request, "happy");
    const recebedorId = await registrarEmpreiteiro(request, "happy");
    const obraId = await criarObra();
    const valor = 1000;
    const financeiroId = await criarFinanceiroPendente({
      obraId,
      pagadorUserId: pagadorId,
      recebedorUserId: recebedorId,
      valor,
    });
    const splitId = await criarSplitPendente({ financeiroId, obraId, recebedorUserId: recebedorId, valorTotal: valor });

    try {
      const res = await post(request, {
        type: "payment_succeeded",
        eventId: uniqueEventId("happy"),
        externalReference: externalRefObra(financeiroId, obraId, splitId),
      });
      expect(res.status(), "confirmação feliz deve responder 200").toBe(200);
      const body = (await res.json()) as { received?: boolean; processed?: boolean };
      expect(body.received).toBe(true);
      expect(body.processed, "primeira confirmação deve ser processed:true").toBe(true);

      const [splitRow] = await db
        .select({ status: pagamentosSplit.status })
        .from(pagamentosSplit)
        .where(eq(pagamentosSplit.id, splitId))
        .limit(1);
      expect(splitRow?.status, "split deve estar confirmado").toBe("confirmado");

      const [financeiroRow] = await db
        .select({ status: financeiro.status, metodoPagamento: financeiro.metodoPagamento })
        .from(financeiro)
        .where(eq(financeiro.id, financeiroId))
        .limit(1);
      expect(financeiroRow?.status, "financeiro deve estar pago").toBe("pago");
      expect(financeiroRow?.metodoPagamento, "metodoPagamento deve ser asaas_split").toBe("asaas_split");

      const [obraRow] = await db
        .select({ valorPago: obras.valorPago })
        .from(obras)
        .where(eq(obras.id, obraId))
        .limit(1);
      expect(Number(obraRow?.valorPago), "obras.valor_pago deve refletir o lançamento pago").toBe(valor);
    } finally {
      await limparTudo({ financeiroId, obraId, userIds: [pagadorId, recebedorId] });
    }
  });
});

// ---------------------------------------------------------------------------
// 2 — Idempotência
// ---------------------------------------------------------------------------

test.describe("J48 — split-confirmacao: idempotência", () => {
  test("reenvio do mesmo evento (split já confirmado) → processed:false e valor_pago não duplica", async ({
    request,
  }) => {
    const pagadorId = await registrarContratante(request, "idem");
    const recebedorId = await registrarEmpreiteiro(request, "idem");
    const obraId = await criarObra();
    const valor = 500;
    const financeiroId = await criarFinanceiroPendente({
      obraId,
      pagadorUserId: pagadorId,
      recebedorUserId: recebedorId,
      valor,
    });
    const splitId = await criarSplitPendente({ financeiroId, obraId, recebedorUserId: recebedorId, valorTotal: valor });

    try {
      const ref = externalRefObra(financeiroId, obraId, splitId);
      const eventId = uniqueEventId("idem");

      const first = await post(request, { type: "payment_succeeded", eventId, externalReference: ref });
      expect(first.status()).toBe(200);
      const firstBody = (await first.json()) as { processed?: boolean };
      expect(firstBody.processed, "primeiro envio deve ser processed:true").toBe(true);

      const [obraRowAfterFirst] = await db
        .select({ valorPago: obras.valorPago })
        .from(obras)
        .where(eq(obras.id, obraId))
        .limit(1);
      expect(Number(obraRowAfterFirst?.valorPago)).toBe(valor);

      // Reenvia o MESMO evento (split já confirmado — não deve re-creditar).
      const second = await post(request, { type: "payment_succeeded", eventId, externalReference: ref });
      expect(second.status()).toBe(200);
      const secondBody = (await second.json()) as { processed?: boolean };
      expect(secondBody.processed, "segundo envio (split já confirmado) deve ser processed:false").toBe(false);

      const [obraRowAfterSecond] = await db
        .select({ valorPago: obras.valorPago })
        .from(obras)
        .where(eq(obras.id, obraId))
        .limit(1);
      expect(
        Number(obraRowAfterSecond?.valorPago),
        "obras.valor_pago NÃO deve dobrar no reprocessamento (anti-duplicação)",
      ).toBe(valor);

      const [splitRow] = await db
        .select({ status: pagamentosSplit.status })
        .from(pagamentosSplit)
        .where(eq(pagamentosSplit.id, splitId))
        .limit(1);
      expect(splitRow?.status, "split continua confirmado").toBe("confirmado");
    } finally {
      await limparTudo({ financeiroId, obraId, userIds: [pagadorId, recebedorId] });
    }
  });
});

// ---------------------------------------------------------------------------
// 3 — payment_failed
// ---------------------------------------------------------------------------

test.describe("J48 — split-confirmacao: payment_failed", () => {
  test("payment_failed com split pendente → split falhou, financeiro segue pendente", async ({ request }) => {
    const pagadorId = await registrarContratante(request, "fail");
    const recebedorId = await registrarEmpreiteiro(request, "fail");
    const obraId = await criarObra();
    const valor = 750;
    const financeiroId = await criarFinanceiroPendente({
      obraId,
      pagadorUserId: pagadorId,
      recebedorUserId: recebedorId,
      valor,
    });
    const splitId = await criarSplitPendente({ financeiroId, obraId, recebedorUserId: recebedorId, valorTotal: valor });

    try {
      const res = await post(request, {
        type: "payment_failed",
        eventId: uniqueEventId("fail"),
        externalReference: externalRefObra(financeiroId, obraId, splitId),
      });
      expect(res.status()).toBe(200);
      const body = (await res.json()) as { processed?: boolean };
      expect(body.processed, "payment_failed deve ser processed:true").toBe(true);

      const [splitRow] = await db
        .select({ status: pagamentosSplit.status })
        .from(pagamentosSplit)
        .where(eq(pagamentosSplit.id, splitId))
        .limit(1);
      expect(splitRow?.status, "split deve estar falhou").toBe("falhou");

      const [financeiroRow] = await db
        .select({ status: financeiro.status })
        .from(financeiro)
        .where(eq(financeiro.id, financeiroId))
        .limit(1);
      expect(financeiroRow?.status, "financeiro deve seguir pendente em falha de pagamento").toBe("pendente");
    } finally {
      await limparTudo({ financeiroId, obraId, userIds: [pagadorId, recebedorId] });
    }
  });
});

// ---------------------------------------------------------------------------
// 4 — Split inexistente
// ---------------------------------------------------------------------------

test.describe("J48 — split-confirmacao: split inexistente", () => {
  test("externalReference de obra com splitId aleatório → processed:false, sem erro", async ({ request }) => {
    const financeiroIdFake = "00000000-0000-0000-0000-000000000000";
    const obraIdFake = "00000000-0000-0000-0000-000000000000";
    const splitIdFake = "00000000-0000-0000-0000-000000000000";

    const res = await post(request, {
      type: "payment_succeeded",
      eventId: uniqueEventId("missing"),
      externalReference: externalRefObra(financeiroIdFake, obraIdFake, splitIdFake),
    });
    expect(res.status(), "split inexistente não deve gerar erro 500").toBe(200);
    const body = (await res.json()) as { processed?: boolean };
    expect(body.processed, "split inexistente deve ser processed:false").toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5 — Regressão de fronteira: evento de assinatura não toca pagamentos_split
// ---------------------------------------------------------------------------

test.describe("J48 — split-confirmacao: regressão de fronteira (assinatura vs. obra)", () => {
  test("evento de assinatura (prefixo sem '-obra') não altera pagamentos_split pendente", async ({ request }) => {
    const pagadorId = await registrarContratante(request, "border");
    const recebedorId = await registrarEmpreiteiro(request, "border");
    const obraId = await criarObra();
    const valor = 300;
    const financeiroId = await criarFinanceiroPendente({
      obraId,
      pagadorUserId: pagadorId,
      recebedorUserId: recebedorId,
      valor,
    });
    const splitId = await criarSplitPendente({ financeiroId, obraId, recebedorUserId: recebedorId, valorTotal: valor });

    try {
      // externalReference de ASSINATURA: "xconstrucao|userId|planoId|ciclo" —
      // prefixo distinto de "xconstrucao-obra|...". userId/planoId inexistentes
      // (não colidem com seed), o objetivo é só provar o roteamento.
      const res = await post(request, {
        type: "payment_succeeded",
        eventId: uniqueEventId("border"),
        externalReference:
          "xconstrucao|00000000-0000-0000-0000-000000000099|00000000-0000-0000-0000-000000000099|mensal",
        valor: 99.9,
      });
      expect(res.status()).toBe(200);
      const body = (await res.json()) as { processed?: boolean };
      // Vai para aplicarEventoWebhook (fluxo de assinatura), que registra o
      // evento mesmo com subscription inexistente → processed:true. O que
      // importa aqui é que NÃO tocou o split de obra criado acima.
      expect(typeof body.processed).toBe("boolean");

      const [splitRow] = await db
        .select({ status: pagamentosSplit.status })
        .from(pagamentosSplit)
        .where(eq(pagamentosSplit.id, splitId))
        .limit(1);
      expect(
        splitRow?.status,
        "evento de assinatura não deve alterar o pagamentos_split de obra — continua pendente",
      ).toBe("pendente");

      const [financeiroRow] = await db
        .select({ status: financeiro.status })
        .from(financeiro)
        .where(eq(financeiro.id, financeiroId))
        .limit(1);
      expect(
        financeiroRow?.status,
        "evento de assinatura não deve alterar o financeiro de obra — continua pendente",
      ).toBe("pendente");
    } finally {
      await limparTudo({ financeiroId, obraId, userIds: [pagadorId, recebedorId] });
    }
  });
});
