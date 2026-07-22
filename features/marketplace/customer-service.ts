import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { getPaymentGateway } from "@features/planos/gateway";
import { findOrCreateCustomer } from "@features/planos/gateway/asaas-gateway";

/**
 * J44 — Provisiona o customer Asaas de um usuário PROATIVAMENTE (no cadastro),
 * em vez de lazy no primeiro checkout. Best-effort e NÃO-bloqueante: qualquer
 * falha (rede, gateway ausente) é engolida e logada — nunca deve impedir o
 * cadastro. O fallback lazy em `iniciarCheckout` continua válido.
 *
 * Gate: só fala com o Asaas quando `PAYMENT_GATEWAY=asaas`. Em ambiente manual
 * (dev/E2E) retorna silenciosamente sem tocar a rede.
 *
 * Idempotente: se `users.asaasCustomerId` já existe, não refaz.
 */
export async function provisionarCustomerAsaas(args: {
  userId: string;
  name: string;
  email: string;
  cpfCnpj?: string | null;
}): Promise<{ ok: boolean; customerId?: string }> {
  try {
    const gateway = getPaymentGateway();
    if (gateway.provider !== "asaas") return { ok: false };

    // Já provisionado? Não refaz.
    const [row] = await db
      .select({ asaasCustomerId: users.asaasCustomerId })
      .from(users)
      .where(eq(users.id, args.userId))
      .limit(1);
    if (row?.asaasCustomerId) return { ok: true, customerId: row.asaasCustomerId };

    const customer = await findOrCreateCustomer(
      args.email,
      args.name,
      args.cpfCnpj ?? undefined,
    );

    await db.update(users).set({ asaasCustomerId: customer.id }).where(eq(users.id, args.userId));
    return { ok: true, customerId: customer.id };
  } catch (err) {
    // Best-effort: não propaga. O customer será criado lazy no 1º checkout.
    console.warn(`[marketplace] provisionarCustomerAsaas falhou (userId=${args.userId}):`, err);
    return { ok: false };
  }
}
