/**
 * Validação do parseWebhook do AsaasGateway com payloads reais do sandbox ASAS.
 *
 * Executa: npx tsx scripts/test-asaas-webhook.ts
 *
 * Não requer banco nem credenciais ASAS — testa apenas o parsing do payload.
 * Cobre os formatos documentados em https://docs.asaas.com/reference/notifications
 */

import { AsaasGateway } from "../features/planos/gateway/asaas-gateway";

const gw = new AsaasGateway();

type TestCase = {
  name: string;
  payload: Record<string, unknown>;
  expect: {
    type: string;
    eventId?: string;
    eventIdPrefix?: string;
    gatewaySubscriptionId?: string | undefined;
    externalReference?: string | undefined;
    valor?: number | undefined;
  };
};

// ── Payloads realistas do sandbox ASAS ────────────────────────────────────────

const CASES: TestCase[] = [
  {
    name: "PAYMENT_CONFIRMED via PIX (primeiro pagamento de assinatura)",
    payload: {
      event: "PAYMENT_CONFIRMED",
      payment: {
        object: "payment",
        id: "pay_abc123",
        customer: "cus_xyz",
        subscription: "sub_def456",
        externalReference: "xconstrucao|user-uuid|plano-uuid|mensal",
        value: 99.9,
        netValue: 96.9,
        status: "CONFIRMED",
        billingType: "PIX",
        dueDate: "2026-07-18",
        confirmedDate: "2026-07-18",
      },
    },
    expect: {
      type: "payment_succeeded",
      eventIdPrefix: "PAYMENT_CONFIRMED:",
      gatewaySubscriptionId: "sub_def456",
      externalReference: "xconstrucao|user-uuid|plano-uuid|mensal",
      valor: 99.9,
    },
  },
  {
    name: "PAYMENT_RECEIVED via Boleto (após compensação bancária)",
    payload: {
      event: "PAYMENT_RECEIVED",
      payment: {
        id: "pay_bol789",
        customer: "cus_xyz",
        subscription: "sub_def456",
        externalReference: "xconstrucao|user-uuid|plano-uuid|mensal",
        value: 99.9,
        status: "RECEIVED",
        billingType: "BOLETO",
      },
    },
    expect: {
      type: "payment_succeeded",
      eventIdPrefix: "PAYMENT_RECEIVED:",
      gatewaySubscriptionId: "sub_def456",
      externalReference: "xconstrucao|user-uuid|plano-uuid|mensal",
      valor: 99.9,
    },
  },
  {
    name: "PAYMENT_CONFIRMED segundo mês (externalReference null — assinatura já existe no banco)",
    payload: {
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_renovacao001",
        customer: "cus_xyz",
        subscription: "sub_def456",
        externalReference: null,
        value: 99.9,
        status: "CONFIRMED",
        billingType: "CREDIT_CARD",
      },
    },
    expect: {
      type: "payment_succeeded",
      eventIdPrefix: "PAYMENT_CONFIRMED:",
      gatewaySubscriptionId: "sub_def456",
      externalReference: undefined,
      valor: 99.9,
    },
  },
  {
    name: "PAYMENT_OVERDUE (boleto vencido)",
    payload: {
      event: "PAYMENT_OVERDUE",
      payment: {
        id: "pay_abc123",
        customer: "cus_xyz",
        subscription: "sub_def456",
        externalReference: "xconstrucao|user-uuid|plano-uuid|mensal",
        value: 99.9,
        status: "OVERDUE",
        billingType: "BOLETO",
      },
    },
    expect: {
      type: "payment_failed",
      eventIdPrefix: "PAYMENT_OVERDUE:",
      gatewaySubscriptionId: "sub_def456",
    },
  },
  {
    name: "PAYMENT_CONFIRMED após PAYMENT_OVERDUE — eventIds distintos para mesmo payment.id",
    payload: {
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_abc123",
        customer: "cus_xyz",
        subscription: "sub_def456",
        externalReference: null,
        value: 99.9,
        status: "CONFIRMED",
        billingType: "BOLETO",
      },
    },
    expect: {
      type: "payment_succeeded",
      eventIdPrefix: "PAYMENT_CONFIRMED:",
      gatewaySubscriptionId: "sub_def456",
    },
  },
  {
    name: "SUBSCRIPTION_DELETED (cancelamento via dashboard ASAS)",
    payload: {
      event: "SUBSCRIPTION_DELETED",
      subscription: {
        id: "sub_def456",
        customer: "cus_xyz",
        externalReference: "xconstrucao|user-uuid|plano-uuid|mensal",
        value: 99.9,
        status: "REMOVED",
        cycle: "MONTHLY",
      },
    },
    expect: {
      type: "subscription_canceled",
      eventIdPrefix: "SUBSCRIPTION_DELETED:",
      gatewaySubscriptionId: "sub_def456",
      externalReference: "xconstrucao|user-uuid|plano-uuid|mensal",
    },
  },
  {
    name: "PAYMENT_DELETED (estorno ou exclusão manual)",
    payload: {
      event: "PAYMENT_DELETED",
      payment: {
        id: "pay_del001",
        customer: "cus_xyz",
        subscription: "sub_def456",
        externalReference: null,
        value: 99.9,
        status: "DELETED",
        billingType: "PIX",
      },
    },
    expect: {
      type: "payment_failed",
      eventIdPrefix: "PAYMENT_DELETED:",
      gatewaySubscriptionId: "sub_def456",
    },
  },
  {
    name: "Evento desconhecido deve ser ignorado",
    payload: {
      event: "PAYMENT_UPDATED",
      payment: {
        id: "pay_upd001",
        customer: "cus_xyz",
        value: 99.9,
      },
    },
    expect: {
      type: "ignored",
    },
  },
  {
    name: "Payload vazio deve retornar ignorado sem exceção",
    payload: {},
    expect: {
      type: "ignored",
    },
  },
  {
    name: "Evento sem payment.subscription — checkout one-time (não assinatura)",
    payload: {
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_onetime",
        customer: "cus_xyz",
        externalReference: "xconstrucao|user-uuid|plano-uuid|mensal",
        value: 99.9,
        status: "CONFIRMED",
        billingType: "PIX",
      },
    },
    expect: {
      type: "payment_succeeded",
      eventIdPrefix: "PAYMENT_CONFIRMED:",
      gatewaySubscriptionId: undefined,
      externalReference: "xconstrucao|user-uuid|plano-uuid|mensal",
      valor: 99.9,
    },
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(`FALHOU: ${msg}`);
}

for (const tc of CASES) {
  try {
    const result = await gw.parseWebhook(JSON.stringify(tc.payload), {});

    assert(result.type === tc.expect.type, `type esperado="${tc.expect.type}" recebido="${result.type}"`);

    if (tc.expect.eventIdPrefix !== undefined) {
      assert(result.eventId.startsWith(tc.expect.eventIdPrefix), `eventId deve começar com "${tc.expect.eventIdPrefix}" mas foi "${result.eventId}"`);
    }
    if ("eventId" in tc.expect && tc.expect.eventId !== undefined) {
      assert(result.eventId === tc.expect.eventId, `eventId esperado="${tc.expect.eventId}" recebido="${result.eventId}"`);
    }
    if ("gatewaySubscriptionId" in tc.expect) {
      assert(result.gatewaySubscriptionId === tc.expect.gatewaySubscriptionId, `gatewaySubscriptionId esperado="${tc.expect.gatewaySubscriptionId}" recebido="${result.gatewaySubscriptionId}"`);
    }
    if ("externalReference" in tc.expect) {
      assert(result.externalReference === tc.expect.externalReference, `externalReference esperado="${tc.expect.externalReference}" recebido="${result.externalReference}"`);
    }
    if ("valor" in tc.expect) {
      assert(result.valor === tc.expect.valor, `valor esperado=${tc.expect.valor} recebido=${result.valor}`);
    }

    console.log(`  ✓ ${tc.name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${tc.name}`);
    console.error(`    ${(err as Error).message}`);
    failed++;
  }
}

// Verifica deduplicação de eventId: PAYMENT_OVERDUE e PAYMENT_CONFIRMED
// para o mesmo payment.id devem gerar eventIds distintos.
const overdueResult = await gw.parseWebhook(JSON.stringify({
  event: "PAYMENT_OVERDUE",
  payment: { id: "pay_same", customer: "cus_x", subscription: "sub_x", value: 99.9 },
}), {});
const confirmedResult = await gw.parseWebhook(JSON.stringify({
  event: "PAYMENT_CONFIRMED",
  payment: { id: "pay_same", customer: "cus_x", subscription: "sub_x", value: 99.9 },
}), {});
try {
  assert(overdueResult.eventId !== confirmedResult.eventId, `eventIds devem ser distintos para eventos diferentes no mesmo payment — overdue="${overdueResult.eventId}" confirmed="${confirmedResult.eventId}"`);
  console.log("  ✓ eventIds distintos para PAYMENT_OVERDUE vs PAYMENT_CONFIRMED no mesmo payment.id");
  passed++;
} catch (err) {
  console.error(`  ✗ ${(err as Error).message}`);
  failed++;
}

// Verifica que externalReference nulo vira undefined (não a string "null")
const nullRefResult = await gw.parseWebhook(JSON.stringify({
  event: "PAYMENT_CONFIRMED",
  payment: { id: "pay_nullref", customer: "cus_x", subscription: "sub_x", externalReference: null, value: 10 },
}), {});
try {
  assert(nullRefResult.externalReference === undefined, `externalReference null deve vira undefined, mas foi "${nullRefResult.externalReference}"`);
  console.log("  ✓ externalReference null vira undefined corretamente");
  passed++;
} catch (err) {
  console.error(`  ✗ ${(err as Error).message}`);
  failed++;
}

console.log(`\n${passed + failed} testes — ${passed} passaram, ${failed} falharam.`);
if (failed > 0) process.exit(1);
