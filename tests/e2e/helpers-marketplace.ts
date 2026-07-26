import { type APIRequestContext, expect } from "@playwright/test";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, financeiro, obras, users } from "@shared/db/schema";
import { SEED_CONTRATANTE_EMAIL, SEED_EMPREITEIRO_EMAIL } from "./helpers";

/**
 * Helpers de setup para specs que precisam de uma obra REAL vinculada
 * (contratante + empreiteiro) e, opcionalmente, de um lançamento financeiro —
 * base para disputas, medições e pagamentos.
 *
 * Estratégia: reaproveita os perfis seed (joão contratante / maria empreiteira),
 * que já possuem `clientes`/`empreiteiras` com `userId`. Cria uma obra E2E
 * ligando os dois. Todo dado carrega o marcador "E2E" e é removido no cleanup.
 */

export interface ObraVinculada {
  obraId: string;
  contratanteUserId: string;
  empreiteiroUserId: string;
  clienteId: string;
  empreiteiraId: string;
}

/**
 * Resolve o userId de um email de persona.
 *
 * Diferente de `loginAs`, este caminho fala com o banco direto e não passa
 * pelo `ensurePersonas`. Como specs de marketplace podem rodar antes de
 * qualquer login, a mensagem de falha aponta o remédio em vez de só constatar
 * a ausência.
 */
export async function userIdByEmail(email: string): Promise<string> {
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  expect(
    u?.id,
    `usuário ${email} deve existir — se a base foi zerada, o setup do spec ` +
      `precisa chamar ensurePersonas(request) (POST /api/test/ensure-users) antes.`,
  ).toBeTruthy();
  return u!.id;
}

/**
 * Cria uma obra E2E vinculando o cliente do contratante seed e a empreiteira do
 * empreiteiro seed. Marca o nome com "E2E" + `tag` para cleanup.
 */
export async function criarObraVinculadaE2E(tag: string): Promise<ObraVinculada> {
  const contratanteUserId = await userIdByEmail(SEED_CONTRATANTE_EMAIL);
  const empreiteiroUserId = await userIdByEmail(SEED_EMPREITEIRO_EMAIL);

  const [cli] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(clientes.userId, contratanteUserId))
    .limit(1);
  const [emp] = await db
    .select({ id: empreiteiras.id })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, empreiteiroUserId))
    .limit(1);
  expect(cli?.id, "cliente seed do contratante deve existir").toBeTruthy();
  expect(emp?.id, "empreiteira seed do empreiteiro deve existir").toBeTruthy();

  const [obra] = await db
    .insert(obras)
    .values({
      nome: `E2E ${tag} — Obra`,
      endereco: "Rua E2E, 100",
      clienteId: cli!.id,
      empreiteiraId: emp!.id,
      status: "em_andamento",
      visibilidade: "publicada",
      statusModeracao: "aprovada",
    })
    .returning({ id: obras.id });

  return {
    obraId: obra!.id,
    contratanteUserId,
    empreiteiroUserId,
    clienteId: cli!.id,
    empreiteiraId: emp!.id,
  };
}

/** Cria um lançamento financeiro E2E de obra (alvo típico de disputa/pagamento). */
export async function criarLancamentoE2E(args: {
  obraId: string;
  pagadorUserId: string;
  recebedorUserId: string;
  tag: string;
  status?: "pendente" | "pago";
}): Promise<string> {
  const [f] = await db
    .insert(financeiro)
    .values({
      tipo: "saida",
      descricao: `E2E ${args.tag} — Lançamento`,
      valor: "1000.00",
      data: "2026-01-01",
      escopo: "obra",
      obraId: args.obraId,
      status: args.status ?? "pendente",
      pagadorUserId: args.pagadorUserId,
      recebedorUserId: args.recebedorUserId,
    })
    .returning({ id: financeiro.id });
  return f!.id;
}

/** Remove uma obra E2E e o que pende dela por cascade (best-effort). */
export async function limparObraVinculadaE2E(obraId: string | null | undefined): Promise<void> {
  if (!obraId) return;
  await db.delete(financeiro).where(eq(financeiro.obraId, obraId)).catch(() => {});
  await db.delete(obras).where(eq(obras.id, obraId)).catch(() => {});
}

/** Login helper que também confirma o role esperado (defensivo). */
export async function assertRole(request: APIRequestContext, esperado: string): Promise<void> {
  const res = await request.get("/api/auth/me");
  expect(res.status()).toBe(200);
  const data = (await res.json()) as { role?: string };
  expect(data?.role, `role deveria ser ${esperado}`).toBe(esperado);
}
