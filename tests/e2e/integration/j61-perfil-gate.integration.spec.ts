import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, obras, users } from "@shared/db/schema";
import {
  loginAs,
  logout,
  liberarCotaObras,
  limparObrasE2E,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
} from "../helpers";
import { userIdByEmail } from "../helpers-marketplace";

/**
 * Integração (J61) — Gate de perfil mínimo para operar.
 *
 * Regra: publicar obra (contratante) e enviar proposta (empreiteiro) exigem
 * contato, documento fiscal e endereço preenchidos. Sem isso, 422 com
 * `code: "PERFIL_INCOMPLETO"` e a lista de campos que faltam.
 *
 * Endpoints:
 *   POST /api/obras                      (contratante)
 *   POST /api/empreiteiro/candidaturas   (empreiteiro)
 *
 * O que estes testes travam, além do caminho feliz:
 *   - a ORDEM dos guards — 401 e 403 têm de continuar precedendo o 422, senão
 *     um anônimo receberia "complete seu perfil" em vez de "não autenticado";
 *   - o STATUS não pode ser 402: a suíte trata 402 como cota de plano com
 *     `test.skip` (obras-candidatura:157, j58:136), então um gate devolvendo
 *     402 viraria skip silencioso — falso verde.
 *
 * Setup: manipula `clientes`/`empreiteiras` direto via Drizzle. O endpoint
 * `/api/test/curadoria-setup` só ajusta `perfilCompleto`, que é a coluna da
 * curadoria do admin — deliberadamente distinta do predicado deste gate
 * (ver shared/lib/perfil-operacional.ts). Todo campo alterado é restaurado no
 * `afterAll`.
 *
 * Pré-requisitos: E2E_TEST_AUTH=1.
 */

const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };

/** Campos que o gate do contratante exige — usados para zerar e restaurar. */
type SnapshotCliente = {
  id: string;
  telefone: string | null;
  cnpjCpf: string | null;
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
};

type SnapshotEmpreiteira = {
  id: string;
  telefone: string | null;
  cnpj: string | null;
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  // `especialidades` é notNull no schema (default `[]`) — nunca null.
  especialidades: string[];
  raioKm: number | null;
};

let snapCliente: SnapshotCliente | null = null;
let snapEmpreiteira: SnapshotEmpreiteira | null = null;

async function carregarSnapshots(): Promise<void> {
  const contratanteUserId = await userIdByEmail(SEED_CONTRATANTE_EMAIL);
  const [c] = await db
    .select({
      id: clientes.id,
      telefone: clientes.telefone,
      cnpjCpf: clientes.cnpjCpf,
      cep: clientes.cep,
      endereco: clientes.endereco,
      cidade: clientes.cidade,
      estado: clientes.estado,
    })
    .from(clientes)
    .where(eq(clientes.userId, contratanteUserId))
    .limit(1);
  expect(c?.id, "perfil de contratante das personas deve existir").toBeTruthy();
  snapCliente = c!;

  const empreiteiroUserId = await userIdByEmail(SEED_EMPREITEIRO_EMAIL);
  const [e] = await db
    .select({
      id: empreiteiras.id,
      telefone: empreiteiras.telefone,
      cnpj: empreiteiras.cnpj,
      cep: empreiteiras.cep,
      endereco: empreiteiras.endereco,
      cidade: empreiteiras.cidade,
      estado: empreiteiras.estado,
      especialidades: empreiteiras.especialidades,
      raioKm: empreiteiras.raioKm,
    })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, empreiteiroUserId))
    .limit(1);
  expect(e?.id, "perfil de empreiteiro das personas deve existir").toBeTruthy();
  snapEmpreiteira = e!;
}

/** Zera os campos de endereço/contato para simular perfil incompleto. */
async function esvaziarPerfilContratante(): Promise<void> {
  await db
    .update(clientes)
    .set({ cep: null, endereco: null, cidade: null, estado: null })
    .where(eq(clientes.id, snapCliente!.id));
}

async function esvaziarPerfilEmpreiteiro(): Promise<void> {
  await db
    .update(empreiteiras)
    .set({ cep: null, endereco: null, cidade: null, estado: null, especialidades: [], raioKm: null })
    .where(eq(empreiteiras.id, snapEmpreiteira!.id));
}

async function restaurarPerfis(): Promise<void> {
  if (snapCliente) {
    const { id, ...campos } = snapCliente;
    await db.update(clientes).set(campos).where(eq(clientes.id, id));
  }
  if (snapEmpreiteira) {
    const { id, ...campos } = snapEmpreiteira;
    await db.update(empreiteiras).set(campos).where(eq(empreiteiras.id, id));
  }
}

/** Payload mínimo válido de obra — o gate roda ANTES do Zod, mas isso garante
 *  que um 400 de validação nunca seja confundido com o 422 do gate. */
function payloadObra(tag: string) {
  return {
    nome: `E2E J61 ${tag}`,
    endereco: "Rua do Gate, 100",
    cidade: "São Paulo",
    uf: "SP",
    tipo: "Reforma",
    visibilidade: "rascunho" as const,
  };
}

test.describe("Integração — J61: gate de perfil mínimo para operar", () => {
  test.beforeAll(async ({ request }) => {
    // Garante as personas (e seus perfis completos) antes de tirar o snapshot.
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    await logout(request);
    await carregarSnapshots();
  });

  test.afterAll(async ({ request }) => {
    await restaurarPerfis();
    await limparObrasE2E(request).catch(() => {});
  });

  // ── Contratante ─────────────────────────────────────────────────────────

  test("G1 · contratante com perfil incompleto → 422 PERFIL_INCOMPLETO", async ({ request }) => {
    await esvaziarPerfilContratante();
    await loginAs(request, SEED_CONTRATANTE_EMAIL);

    const res = await request.post("/api/obras", { data: payloadObra("g1") });
    expect(
      res.status(),
      `perfil sem endereço deve barrar com 422; corpo: ${await res.text()}`,
    ).toBe(422);

    await logout(request);
    await restaurarPerfis();
  });

  test("G5 · o 422 traz code e a lista de campos pendentes", async ({ request }) => {
    await esvaziarPerfilContratante();
    await loginAs(request, SEED_CONTRATANTE_EMAIL);

    const res = await request.post("/api/obras", { data: payloadObra("g5") });
    expect(res.status()).toBe(422);

    const body = (await res.json()) as {
      code?: string;
      faltando?: Array<{ campo: string; rotulo: string }>;
      message?: string;
    };
    expect(body.code, "o front decide o que fazer a partir do code").toBe("PERFIL_INCOMPLETO");
    expect(Array.isArray(body.faltando), "faltando deve ser uma lista").toBeTruthy();

    const campos = (body.faltando ?? []).map((f) => f.campo);
    for (const esperado of ["cep", "endereco", "cidade", "estado"]) {
      expect(campos, `campo "${esperado}" deve constar em faltando`).toContain(esperado);
    }
    // Rótulo em português, para a UI exibir direto.
    expect((body.faltando ?? [])[0]?.rotulo, "cada item deve ter rótulo legível").toBeTruthy();
    expect(body.message, "mensagem deve citar os campos").toContain("Complete seu perfil");

    await logout(request);
    await restaurarPerfis();
  });

  test("G2 · contratante com perfil completo → cria a obra", async ({ request }) => {
    await restaurarPerfis();
    // `liberarCotaObras` faz login como admin e termina com logout — por isso o
    // login do contratante vem DEPOIS dele, senão o POST sai sem sessão (401).
    await liberarCotaObras(request);
    await loginAs(request, SEED_CONTRATANTE_EMAIL);

    const res = await request.post("/api/obras", { data: payloadObra("g2") });
    expect(
      [200, 201].includes(res.status()),
      `perfil completo deve permitir criar obra; status ${res.status()}, corpo: ${await res.text()}`,
    ).toBeTruthy();

    // Limpa a obra criada para não consumir cota dos specs seguintes.
    const criada = (await res.json()) as { id?: string };
    if (criada?.id) await db.delete(obras).where(eq(obras.id, criada.id)).catch(() => {});

    await logout(request);
  });

  // ── Ordem dos guards ────────────────────────────────────────────────────

  test("G3 · anônimo → 401, nunca 422 (autenticação precede o gate)", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/obras", { data: payloadObra("g3") });
    expect(res.status(), "sem sessão o servidor não deve falar de perfil").toBe(401);
  });

  test("G4 · role errada → 403, nunca 422 (autorização precede o gate)", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const res = await request.post("/api/obras", { data: payloadObra("g4") });
    expect(res.status(), "empreiteiro em rota de contratante é 403").toBe(403);
    await logout(request);
  });

  // ── Empreiteiro ─────────────────────────────────────────────────────────

  test("G6 · empreiteiro com perfil incompleto → 422 PERFIL_INCOMPLETO", async ({ request }) => {
    await esvaziarPerfilEmpreiteiro();
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);

    // obraId inexistente de propósito: o gate roda ANTES do parse e da busca da
    // obra, então a resposta tem de ser 422 — não 400 nem 404.
    const res = await request.post("/api/empreiteiro/candidaturas", {
      data: { obraId: "00000000-0000-0000-0000-000000000000", mensagem: "E2E J61" },
    });
    expect(
      res.status(),
      `perfil incompleto deve barrar antes de validar o corpo; recebido ${res.status()}`,
    ).toBe(422);

    const body = (await res.json()) as { code?: string; faltando?: Array<{ campo: string }> };
    expect(body.code).toBe("PERFIL_INCOMPLETO");
    const campos = (body.faltando ?? []).map((f) => f.campo);
    expect(campos, "especialidades vazias devem aparecer como pendência").toContain("especialidades");
    expect(campos, "raio de atuação ausente deve aparecer como pendência").toContain("raioKm");

    await logout(request);
    await restaurarPerfis();
  });

  test("G7 · empreiteiro com perfil completo passa do gate", async ({ request }) => {
    await restaurarPerfis();
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);

    const res = await request.post("/api/empreiteiro/candidaturas", {
      data: { obraId: "00000000-0000-0000-0000-000000000000", mensagem: "E2E J61" },
    });
    // Com o perfil completo o gate sai do caminho; a rota segue e reprova pelo
    // obraId inexistente (404) ou pelo corpo (400). O que importa: não é 422.
    expect(
      res.status(),
      `perfil completo não pode mais receber 422; recebido ${res.status()}`,
    ).not.toBe(422);

    await logout(request);
  });

  test("G8 · o gate não usa 402 (que a suíte trata como cota de plano)", async ({ request }) => {
    await esvaziarPerfilEmpreiteiro();
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);

    const res = await request.post("/api/empreiteiro/candidaturas", {
      data: { obraId: "00000000-0000-0000-0000-000000000000", mensagem: "E2E J61" },
    });
    expect(
      res.status(),
      "402 faria os specs existentes darem test.skip — falso verde",
    ).not.toBe(402);

    await logout(request);
    await restaurarPerfis();
  });

  // ── Documento: o PATCH de perfil virou a porta de entrada ────────────────
  //
  // Com o CPF/CNPJ fora do cadastro, é por aqui que o dado chega. Antes o
  // schema aceitava qualquer string: um PATCH direto (fora das telas, que
  // validam no client) gravava documento malformado, e o Asaas só recusava
  // depois, no checkout, longe da causa.

  test("G9 · PATCH de contratante recusa documento com DV inválido", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);

    const res = await request.patch("/api/perfil/contratante", {
      data: { cnpjCpf: "12345678900" }, // 11 dígitos, dígito verificador errado
    });
    expect(
      res.status(),
      `documento inválido deve ser recusado no servidor; corpo: ${await res.text()}`,
    ).toBe(400);

    await logout(request);
    await restaurarPerfis();
  });

  test("G10 · PATCH de contratante grava o documento e sincroniza users.cpf_cnpj", async ({
    request,
  }) => {
    const userId = await userIdByEmail(SEED_CONTRATANTE_EMAIL);
    await loginAs(request, SEED_CONTRATANTE_EMAIL);

    // Aceita máscara: a tela envia formatado e o servidor normaliza.
    const res = await request.patch("/api/perfil/contratante", {
      data: { cnpjCpf: "529.982.247-25" },
    });
    expect(res.ok(), `PATCH deveria passar; corpo: ${await res.text()}`).toBeTruthy();

    const [row] = await db
      .select({ cpfCnpj: users.cpfCnpj })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    expect(
      row?.cpfCnpj,
      "users.cpf_cnpj é a fonte de verdade lida por subconta/assinatura — deve receber só dígitos",
    ).toBe("52998224725");

    await logout(request);
    await restaurarPerfis();
  });

  test("G11 · PATCH de empreiteiro recusa CPF (cadastro é de pessoa jurídica)", async ({
    request,
  }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);

    // CPF com dígito verificador correto — recusado por ser pessoa física.
    const res = await request.patch("/api/perfil/empreiteiro", {
      data: { cnpj: "52998224725" },
    });
    expect(
      res.status(),
      `empreiteiro só aceita CNPJ; corpo: ${await res.text()}`,
    ).toBe(400);

    await logout(request);
    await restaurarPerfis();
  });
});
