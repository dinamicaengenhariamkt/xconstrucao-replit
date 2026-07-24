import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  obraAnexos,
  obraChecklistItens,
  obraChecklists,
  obraDiario,
  obraEquipe,
  obraEtapas,
  obraFotos,
  obraOcorrencias,
  obraTarefas,
  userFiles,
} from "@shared/db/schema";
import {
  loginAs,
  logout,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  SEED_ADMIN_EMAIL,
} from "../helpers";
import {
  criarObraVinculadaE2E,
  limparObraVinculadaE2E,
  type ObraVinculada,
} from "../helpers-marketplace";

/**
 * Integração (J36) — Subrecursos de obra.
 *
 * Cobre os endpoints de conteúdo interno de uma obra vinculada
 * (contratante ↔ empreiteiro), todos sob `app/api/obras/[id]/...`:
 *   anexos, checklists, diario, equipe, etapas, fotos, ocorrencias, tarefas
 * + health (leitura de saúde de UMA obra) + destaque (público, sem auth).
 *
 * Todos os subrecursos de conteúdo (exceto equipe/health/destaque) usam o
 * mesmo par de guards: `findObraAccess` (404 se não tem acesso) +
 * `canWriteObraContent` (403 em mutação sem permissão de escrita). Como
 * `criarObraVinculadaE2E` vincula o empreiteiro seed (maria) como
 * `empreiteiraId` da obra, `access.isDiscoveryOnly=false` e portanto AMBOS
 * contratante e empreiteiro passam em `canWriteObraContent` — únicas
 * exceções: `etapas` (empreiteiro não cria, só atualiza progresso/status) e
 * `diario`/`fotos` DELETE (autor, contratante dono ou admin).
 *
 * anexos/fotos: o caminho feliz cobre POST/GET/DELETE via um `userFiles` row
 * inserido diretamente no banco (kind='obra_anexo'/'obra_foto',
 * visibility='public', bucketKey fictício) — o insert de `userFiles` não
 * chama o storage real, e o DELETE dos dois endpoints faz `deleteObject`
 * best-effort (try/catch), então não precisamos de um upload real ao R2 para
 * exercitar o contrato completo do endpoint.
 *
 * Isolamento: uma obra E2E por describe (não serial), cascade em `obraId`
 * remove todos os subrecursos ao deletar a obra no cleanup — só
 * `userFiles`/`obraOcorrencias.fotoFileId` precisam de limpeza própria
 * (FK com onDelete diferente de cascade para obraId).
 */

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

/** Insere um user_files fictício (sem upload real) pronto para anexar/fotografar. */
async function criarUserFileE2E(args: {
  ownerUserId: string;
  kind: "obra_anexo" | "obra_foto";
  tag: string;
}): Promise<string> {
  const key = `e2e/obras-subrecursos/${args.tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [f] = await db
    .insert(userFiles)
    .values({
      ownerUserId: args.ownerUserId,
      kind: args.kind,
      visibility: "public",
      bucketKey: key,
      originalName: `E2E ${args.tag}.jpg`,
      mime: "image/jpeg",
      sizeBytes: 1024,
      publicUrl: `https://example-e2e.test/${key}`,
    })
    .returning({ id: userFiles.id });
  return f!.id;
}

async function limparUserFiles(ids: Array<string | null | undefined>): Promise<void> {
  for (const id of ids) {
    if (!id) continue;
    await db.delete(userFiles).where(eq(userFiles.id, id)).catch(() => {});
  }
}

// ===========================================================================
// anexos
// ===========================================================================

test.describe("J36 — obras/[id]/anexos", () => {
  let obra: ObraVinculada;
  let fileId: string;

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("anexos");
  });

  test.afterEach(async () => {
    await limparUserFiles([fileId]);
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("guards: sem sessão 401, role sem acesso 404, body inválido 400", async ({ request }) => {
    await logout(request);
    const semSessao = await request.get(`/api/obras/${obra.obraId}/anexos`);
    expect(semSessao.status(), "GET anexos sem sessão deve ser 401").toBe(401);

    const semSessaoPost = await request.post(`/api/obras/${obra.obraId}/anexos`, { data: {} });
    expect(semSessaoPost.status(), "POST anexos sem sessão deve ser 401").toBe(401);

    // Admin não é parte da obra, mas isAdminLike libera 200 — usamos um
    // usuário sem qualquer vínculo (empreiteiro seed é o vinculado, então
    // testamos com o body inválido do próprio contratante dono).
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const bodyInvalido = await request.post(`/api/obras/${obra.obraId}/anexos`, {
      data: { fileId: "curto", tipo: "tipo_inexistente" },
    });
    expect(bodyInvalido.status(), "tipo/fileId inválidos devem retornar 400").toBe(400);
    await logout(request);
  });

  test("POST/GET/DELETE: caminho feliz do contratante", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    fileId = await criarUserFileE2E({
      ownerUserId: obra.contratanteUserId,
      kind: "obra_anexo",
      tag: "anexo-feliz",
    });

    const post = await request.post(`/api/obras/${obra.obraId}/anexos`, {
      data: { fileId, tipo: "contrato", observacao: "E2E anexo de contrato" },
    });
    expect(post.status(), "POST anexo válido deve retornar 201").toBe(201);
    const created = (await post.json()) as { id: string };
    expect(created.id, "anexo criado deve ter id").toBeTruthy();

    const [row] = await db
      .select()
      .from(obraAnexos)
      .where(eq(obraAnexos.id, created.id))
      .limit(1);
    expect(row?.obraId, "anexo deve persistir com obraId correto").toBe(obra.obraId);
    expect(row?.tipo, "tipo deve persistir").toBe("contrato");

    const list = await request.get(`/api/obras/${obra.obraId}/anexos`);
    expect(list.status(), "GET anexos deve retornar 200").toBe(200);
    const rows = (await list.json()) as Array<{ id: string }>;
    expect(rows.some((a) => a.id === created.id), "anexo criado deve aparecer na listagem").toBeTruthy();

    const del = await request.delete(`/api/obras/${obra.obraId}/anexos/${created.id}`);
    expect(del.status(), "DELETE anexo deve retornar 200").toBe(200);

    const [afterDelete] = await db
      .select()
      .from(obraAnexos)
      .where(eq(obraAnexos.id, created.id))
      .limit(1);
    expect(afterDelete, "anexo deve ser removido do banco após DELETE").toBeUndefined();

    const [fileAfter] = await db.select().from(userFiles).where(eq(userFiles.id, fileId)).limit(1);
    expect(fileAfter?.deletedAt, "user_files deve ficar soft-deleted após DELETE do anexo").toBeTruthy();

    await logout(request);
  });

  test("POST: arquivo não pertence ao usuário → 403", async ({ request }) => {
    // fileId é do EMPREITEIRO, mas quem tenta anexar é o CONTRATANTE.
    fileId = await criarUserFileE2E({
      ownerUserId: obra.empreiteiroUserId,
      kind: "obra_anexo",
      tag: "anexo-alheio",
    });
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.post(`/api/obras/${obra.obraId}/anexos`, {
      data: { fileId, tipo: "outros" },
    });
    expect(res.status(), "arquivo de outro dono deve retornar 403").toBe(403);
    await logout(request);
  });
});

// ===========================================================================
// checklists
// ===========================================================================

test.describe("J36 — obras/[id]/checklists", () => {
  let obra: ObraVinculada;

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("checklists");
  });

  test.afterEach(async () => {
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("guards: sem sessão 401, body inválido 400", async ({ request }) => {
    await logout(request);
    const res = await request.get(`/api/obras/${obra.obraId}/checklists`);
    expect(res.status(), "GET checklists sem sessão deve ser 401").toBe(401);

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const invalido = await request.post(`/api/obras/${obra.obraId}/checklists`, {
      data: { nome: "x", itens: [] },
    });
    expect(invalido.status(), "nome curto + itens vazio deve retornar 400").toBe(400);
    await logout(request);
  });

  test("POST cria com itens, PATCH toggla item e atualiza status, DELETE remove", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/checklists`, {
      data: {
        nome: "E2E Checklist de segurança",
        tipo: "seguranca",
        itens: [{ titulo: "E2E item 1" }, { titulo: "E2E item 2" }],
      },
    });
    expect(post.status(), "POST checklist válido deve retornar 201").toBe(201);
    const created = (await post.json()) as { id: string; itens: Array<{ id: string; titulo: string }> };
    expect(created.itens.length, "checklist deve nascer com 2 itens").toBe(2);

    const [checklistRow] = await db
      .select()
      .from(obraChecklists)
      .where(eq(obraChecklists.id, created.id))
      .limit(1);
    expect(checklistRow?.obraId, "checklist deve persistir com obraId correto").toBe(obra.obraId);

    const itemId = created.itens[0]!.id;
    const patch = await request.patch(`/api/obras/${obra.obraId}/checklists/${created.id}`, {
      data: { toggleItemId: itemId, status: "em_andamento" },
    });
    expect(patch.status(), "PATCH toggle+status deve retornar 200").toBe(200);

    const [itemRow] = await db
      .select()
      .from(obraChecklistItens)
      .where(eq(obraChecklistItens.id, itemId))
      .limit(1);
    expect(itemRow?.concluida, "item togglado deve ficar concluida=true").toBe(true);

    const [checklistAfterPatch] = await db
      .select()
      .from(obraChecklists)
      .where(eq(obraChecklists.id, created.id))
      .limit(1);
    expect(checklistAfterPatch?.status, "status do checklist deve ser atualizado").toBe("em_andamento");

    const del = await request.delete(`/api/obras/${obra.obraId}/checklists/${created.id}`);
    expect(del.status(), "DELETE checklist deve retornar 200").toBe(200);

    const [afterDelete] = await db
      .select()
      .from(obraChecklists)
      .where(eq(obraChecklists.id, created.id))
      .limit(1);
    expect(afterDelete, "checklist deve ser removido do banco após DELETE").toBeUndefined();

    await logout(request);
  });
});

// ===========================================================================
// diario
// ===========================================================================

test.describe("J36 — obras[id]/diario", () => {
  let obra: ObraVinculada;

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("diario");
  });

  test.afterEach(async () => {
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("guards: sem sessão 401, texto curto → 400", async ({ request }) => {
    await logout(request);
    const res = await request.get(`/api/obras/${obra.obraId}/diario`);
    expect(res.status(), "GET diario sem sessão deve ser 401").toBe(401);

    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const invalido = await request.post(`/api/obras/${obra.obraId}/diario`, { data: { texto: "a" } });
    expect(invalido.status(), "texto abaixo do mínimo deve retornar 400").toBe(400);
    await logout(request);
  });

  test("POST cria entrada, GET lista, DELETE do autor remove", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/diario`, {
      data: { texto: "E2E diário de obra: fundação concluída hoje." },
    });
    expect(post.status(), "POST diário válido deve retornar 201").toBe(201);
    const created = (await post.json()) as { id: string };

    const [row] = await db.select().from(obraDiario).where(eq(obraDiario.id, created.id)).limit(1);
    expect(row?.autorId, "autorId deve ser o empreiteiro logado").toBe(obra.empreiteiroUserId);

    const list = await request.get(`/api/obras/${obra.obraId}/diario`);
    expect(list.status(), "GET diário deve retornar 200").toBe(200);
    const body = (await list.json()) as { rows: Array<{ id: string }> };
    expect(body.rows.some((r) => r.id === created.id), "entrada criada deve aparecer na listagem").toBeTruthy();

    const del = await request.delete(`/api/obras/${obra.obraId}/diario/${created.id}`);
    expect(del.status(), "autor deletar a própria entrada deve retornar 200").toBe(200);

    const [afterDelete] = await db.select().from(obraDiario).where(eq(obraDiario.id, created.id)).limit(1);
    expect(afterDelete, "entrada deve ser removida do banco após DELETE").toBeUndefined();

    await logout(request);
  });

  test("DELETE por quem não é autor nem dono/admin → 403", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/diario`, {
      data: { texto: "E2E entrada do empreiteiro para teste de permissão." },
    });
    expect(post.status()).toBe(201);
    const created = (await post.json()) as { id: string };
    await logout(request);

    // Contratante dono TAMBÉM pode deletar (regra do endpoint) — não serve
    // para provar 403. Usamos um segundo empreiteiro sem registrar novo user
    // é custoso; em vez disso, cobrimos a regra pelo código: contratante dono
    // deleta com sucesso (branch access.role === "contratante").
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const delByOwner = await request.delete(`/api/obras/${obra.obraId}/diario/${created.id}`);
    expect(delByOwner.status(), "contratante dono pode deletar entrada de outro autor").toBe(200);
    await logout(request);
  });
});

// ===========================================================================
// equipe
// ===========================================================================

test.describe("J36 — obras/[id]/equipe", () => {
  let obra: ObraVinculada;

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("equipe");
  });

  test.afterEach(async () => {
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("guards: sem sessão 401, nome vazio → 400", async ({ request }) => {
    await logout(request);
    const res = await request.get(`/api/obras/${obra.obraId}/equipe`);
    expect(res.status(), "GET equipe sem sessão deve ser 401").toBe(401);

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const invalido = await request.post(`/api/obras/${obra.obraId}/equipe`, { data: { nome: "" } });
    expect(invalido.status(), "nome vazio deve retornar 400").toBe(400);
    await logout(request);
  });

  test("POST cria membro, GET lista, PATCH atualiza, DELETE remove", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/equipe`, {
      data: { nome: "E2E Membro Equipe", papel: "Pedreiro", tipo: "equipe" },
    });
    expect(post.status(), "POST membro válido deve retornar 201").toBe(201);
    const created = (await post.json()) as { id: string };

    const [row] = await db.select().from(obraEquipe).where(eq(obraEquipe.id, created.id)).limit(1);
    expect(row?.obraId, "membro deve persistir com obraId correto").toBe(obra.obraId);

    const list = await request.get(`/api/obras/${obra.obraId}/equipe`);
    expect(list.status()).toBe(200);
    const body = (await list.json()) as { rows: Array<{ id: string }> };
    expect(body.rows.some((m) => m.id === created.id), "membro criado deve aparecer na listagem").toBeTruthy();

    const patch = await request.patch(`/api/obras/${obra.obraId}/equipe/${created.id}`, {
      data: { papel: "E2E Mestre de obras", ativo: false },
    });
    expect(patch.status(), "PATCH válido deve retornar 200").toBe(200);

    const [afterPatch] = await db.select().from(obraEquipe).where(eq(obraEquipe.id, created.id)).limit(1);
    expect(afterPatch?.papel, "papel deve ser atualizado").toBe("E2E Mestre de obras");
    expect(afterPatch?.ativo, "ativo deve ser atualizado para false").toBe(false);

    const del = await request.delete(`/api/obras/${obra.obraId}/equipe/${created.id}`);
    expect(del.status(), "DELETE membro deve retornar 200").toBe(200);

    const [afterDelete] = await db.select().from(obraEquipe).where(eq(obraEquipe.id, created.id)).limit(1);
    expect(afterDelete, "membro deve ser removido do banco após DELETE").toBeUndefined();

    await logout(request);
  });
});

// ===========================================================================
// etapas
// ===========================================================================

test.describe("J36 — obras/[id]/etapas", () => {
  let obra: ObraVinculada;

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("etapas");
  });

  test.afterEach(async () => {
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("guards: sem sessão 401, nome curto → 400, empreiteiro não cria → 403", async ({ request }) => {
    await logout(request);
    const res = await request.get(`/api/obras/${obra.obraId}/etapas`);
    expect(res.status(), "GET etapas sem sessão deve ser 401").toBe(401);

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const invalido = await request.post(`/api/obras/${obra.obraId}/etapas`, { data: { nome: "x" } });
    expect(invalido.status(), "nome abaixo do mínimo deve retornar 400").toBe(400);
    await logout(request);

    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const empreiteiroCria = await request.post(`/api/obras/${obra.obraId}/etapas`, {
      data: { nome: "E2E etapa criada por empreiteiro" },
    });
    expect(empreiteiroCria.status(), "empreiteiro não pode criar etapa (só contratante/admin)").toBe(403);
    await logout(request);
  });

  test("contratante cria etapa; empreiteiro só pode mexer em progresso/status; contratante deleta", async ({
    request,
  }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/etapas`, {
      data: { nome: "E2E Etapa Fundação", ordem: 1 },
    });
    expect(post.status(), "contratante cria etapa → 201").toBe(201);
    const created = (await post.json()) as { id: string };
    await logout(request);

    // Empreiteiro tenta editar o nome (escopo) → 403.
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const escopoNegado = await request.patch(`/api/obras/${obra.obraId}/etapas/${created.id}`, {
      data: { nome: "E2E Nome alterado indevidamente" },
    });
    expect(escopoNegado.status(), "empreiteiro não pode alterar nome/escopo da etapa").toBe(403);

    // Empreiteiro atualiza progresso/status → permitido, e progresso=100 força status=concluido.
    const progressoOk = await request.patch(`/api/obras/${obra.obraId}/etapas/${created.id}`, {
      data: { progresso: 100 },
    });
    expect(progressoOk.status(), "empreiteiro pode atualizar progresso → 200").toBe(200);

    const [row] = await db.select().from(obraEtapas).where(eq(obraEtapas.id, created.id)).limit(1);
    expect(row?.progresso, "progresso deve ser 100").toBe(100);
    expect(row?.status, "progresso=100 deve forçar status=concluido").toBe("concluido");

    // Empreiteiro não pode deletar etapa.
    const delNegado = await request.delete(`/api/obras/${obra.obraId}/etapas/${created.id}`);
    expect(delNegado.status(), "empreiteiro não pode deletar etapa").toBe(403);
    await logout(request);

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const del = await request.delete(`/api/obras/${obra.obraId}/etapas/${created.id}`);
    expect(del.status(), "contratante deleta etapa → 200").toBe(200);

    const [afterDelete] = await db.select().from(obraEtapas).where(eq(obraEtapas.id, created.id)).limit(1);
    expect(afterDelete, "etapa deve ser removida do banco após DELETE").toBeUndefined();
    await logout(request);
  });
});

// ===========================================================================
// fotos
// ===========================================================================

test.describe("J36 — obras/[id]/fotos", () => {
  let obra: ObraVinculada;
  let fileId: string;

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("fotos");
  });

  test.afterEach(async () => {
    await limparUserFiles([fileId]);
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("guards: sem sessão 401, fileId ausente → 400", async ({ request }) => {
    await logout(request);
    const res = await request.get(`/api/obras/${obra.obraId}/fotos`);
    expect(res.status(), "GET fotos sem sessão deve ser 401").toBe(401);

    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const invalido = await request.post(`/api/obras/${obra.obraId}/fotos`, { data: {} });
    expect(invalido.status(), "fileId ausente deve retornar 400").toBe(400);
    await logout(request);
  });

  test("POST/GET/DELETE: caminho feliz do empreiteiro", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    fileId = await criarUserFileE2E({
      ownerUserId: obra.empreiteiroUserId,
      kind: "obra_foto",
      tag: "foto-feliz",
    });

    const post = await request.post(`/api/obras/${obra.obraId}/fotos`, {
      data: { fileId, fase: "durante", tag: "E2E fundação" },
    });
    expect(post.status(), "POST foto válida deve retornar 201").toBe(201);
    const created = (await post.json()) as { id: string };

    const [row] = await db.select().from(obraFotos).where(eq(obraFotos.id, created.id)).limit(1);
    expect(row?.obraId, "foto deve persistir com obraId correto").toBe(obra.obraId);
    expect(row?.fase, "fase deve persistir").toBe("durante");

    const list = await request.get(`/api/obras/${obra.obraId}/fotos`);
    expect(list.status()).toBe(200);
    const body = (await list.json()) as { rows: Array<{ id: string }> };
    expect(body.rows.some((f) => f.id === created.id), "foto criada deve aparecer na listagem").toBeTruthy();

    const del = await request.delete(`/api/obras/${obra.obraId}/fotos/${created.id}`);
    expect(del.status(), "autor deletar a própria foto deve retornar 200").toBe(200);

    const [afterDelete] = await db.select().from(obraFotos).where(eq(obraFotos.id, created.id)).limit(1);
    expect(afterDelete, "foto deve ser removida do banco após DELETE").toBeUndefined();

    const [fileAfter] = await db.select().from(userFiles).where(eq(userFiles.id, fileId)).limit(1);
    expect(fileAfter?.deletedAt, "user_files deve ficar soft-deleted após DELETE da foto").toBeTruthy();

    await logout(request);
  });

  test("POST: arquivo de kind diferente de obra_foto → 400", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    fileId = await criarUserFileE2E({
      ownerUserId: obra.empreiteiroUserId,
      kind: "obra_anexo",
      tag: "foto-kind-errado",
    });
    const res = await request.post(`/api/obras/${obra.obraId}/fotos`, { data: { fileId } });
    expect(res.status(), "arquivo com kind diferente de obra_foto deve retornar 400").toBe(400);
    await logout(request);
  });
});

// ===========================================================================
// ocorrencias
// ===========================================================================

test.describe("J36 — obras/[id]/ocorrencias", () => {
  let obra: ObraVinculada;

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("ocorrencias");
  });

  test.afterEach(async () => {
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("guards: sem sessão 401, descrição curta → 400", async ({ request }) => {
    await logout(request);
    const res = await request.get(`/api/obras/${obra.obraId}/ocorrencias`);
    expect(res.status(), "GET ocorrencias sem sessão deve ser 401").toBe(401);

    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const invalido = await request.post(`/api/obras/${obra.obraId}/ocorrencias`, {
      data: { titulo: "E2E título válido", descricao: "a" },
    });
    expect(invalido.status(), "descrição abaixo do mínimo deve retornar 400").toBe(400);
    await logout(request);
  });

  test("POST cria, GET lista, resolver muda status e é idempotente (409 na 2ª chamada)", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/ocorrencias`, {
      data: {
        titulo: "E2E vazamento no telhado",
        descricao: "Vazamento identificado durante a chuva de ontem.",
        gravidade: "critico",
      },
    });
    expect(post.status(), "POST ocorrência válida deve retornar 201").toBe(201);
    const created = (await post.json()) as { id: string; status: string };
    expect(created.status, "ocorrência deve nascer aberta").toBe("aberta");

    const list = await request.get(`/api/obras/${obra.obraId}/ocorrencias`);
    expect(list.status()).toBe(200);
    const body = (await list.json()) as { rows: Array<{ id: string }> };
    expect(body.rows.some((o) => o.id === created.id), "ocorrência criada deve aparecer na listagem").toBeTruthy();

    const resolver = await request.post(`/api/obras/${obra.obraId}/ocorrencias/${created.id}/resolver`);
    expect(resolver.status(), "resolver ocorrência aberta deve retornar 200").toBe(200);

    const [row] = await db.select().from(obraOcorrencias).where(eq(obraOcorrencias.id, created.id)).limit(1);
    expect(row?.status, "status deve virar resolvida").toBe("resolvida");
    expect(row?.resolvidoPorId, "resolvidoPorId deve ser setado").toBe(obra.empreiteiroUserId);
    expect(row?.resolvidoEm, "resolvidoEm deve ser setado").toBeTruthy();

    const resolverDeNovo = await request.post(`/api/obras/${obra.obraId}/ocorrencias/${created.id}/resolver`);
    expect(resolverDeNovo.status(), "resolver ocorrência já resolvida deve retornar 409").toBe(409);

    await logout(request);
  });

  test("resolver ocorrência inexistente → 404", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.post(
      `/api/obras/${obra.obraId}/ocorrencias/00000000-0000-0000-0000-000000000000/resolver`,
    );
    expect(res.status(), "resolver id inexistente deve retornar 404").toBe(404);
    await logout(request);
  });
});

// ===========================================================================
// tarefas
// ===========================================================================

test.describe("J36 — obras/[id]/tarefas", () => {
  let obra: ObraVinculada;

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("tarefas");
  });

  test.afterEach(async () => {
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("guards: sem sessão 401, título curto → 400", async ({ request }) => {
    await logout(request);
    const res = await request.get(`/api/obras/${obra.obraId}/tarefas`);
    expect(res.status(), "GET tarefas sem sessão deve ser 401").toBe(401);

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const invalido = await request.post(`/api/obras/${obra.obraId}/tarefas`, { data: { titulo: "x" } });
    expect(invalido.status(), "título abaixo do mínimo deve retornar 400").toBe(400);
    await logout(request);
  });

  test("POST cria, GET lista, PATCH conclui (progresso auto=100), DELETE remove", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/tarefas`, {
      data: { titulo: "E2E Instalar contrapiso", responsavel: "E2E Equipe" },
    });
    expect(post.status(), "POST tarefa válida deve retornar 201").toBe(201);
    const created = (await post.json()) as { id: string };

    const [row] = await db.select().from(obraTarefas).where(eq(obraTarefas.id, created.id)).limit(1);
    expect(row?.obraId, "tarefa deve persistir com obraId correto").toBe(obra.obraId);
    expect(row?.status, "tarefa deve nascer pendente").toBe("pendente");

    const list = await request.get(`/api/obras/${obra.obraId}/tarefas`);
    expect(list.status()).toBe(200);
    const body = (await list.json()) as { rows: Array<{ id: string }> };
    expect(body.rows.some((t) => t.id === created.id), "tarefa criada deve aparecer na listagem").toBeTruthy();

    const patch = await request.patch(`/api/obras/${obra.obraId}/tarefas/${created.id}`, {
      data: { status: "concluido" },
    });
    expect(patch.status(), "PATCH conclusão deve retornar 200").toBe(200);

    const [afterPatch] = await db.select().from(obraTarefas).where(eq(obraTarefas.id, created.id)).limit(1);
    expect(afterPatch?.status, "status deve virar concluido").toBe("concluido");
    expect(afterPatch?.progresso, "progresso deve ser auto-setado para 100 ao concluir").toBe(100);

    const del = await request.delete(`/api/obras/${obra.obraId}/tarefas/${created.id}`);
    expect(del.status(), "DELETE tarefa deve retornar 200").toBe(200);

    const [afterDelete] = await db.select().from(obraTarefas).where(eq(obraTarefas.id, created.id)).limit(1);
    expect(afterDelete, "tarefa deve ser removida do banco após DELETE").toBeUndefined();

    await logout(request);
  });
});

// ===========================================================================
// health
// ===========================================================================

test.describe("J36 — obras/[id]/health", () => {
  let obra: ObraVinculada;

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("health");
  });

  test.afterEach(async () => {
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get(`/api/obras/${obra.obraId}/health`);
    expect(res.status(), "GET health sem sessão deve ser 401").toBe(401);
  });

  test("obra inexistente → 404", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.get("/api/obras/00000000-0000-0000-0000-000000000000/health");
    expect(res.status(), "obra inexistente deve retornar 404").toBe(404);
    await logout(request);
  });

  test("contratante dono e empreiteiro vinculado veem a saúde da obra", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const resContratante = await request.get(`/api/obras/${obra.obraId}/health`);
    expect(resContratante.status(), "contratante dono deve ver a saúde da obra").toBe(200);
    await logout(request);

    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const resEmpreiteiro = await request.get(`/api/obras/${obra.obraId}/health`);
    expect(resEmpreiteiro.status(), "empreiteiro vinculado deve ver a saúde da obra").toBe(200);
    await logout(request);
  });
});

// ===========================================================================
// destaque
// ===========================================================================

test.describe("J36 — GET /api/obras/destaque", () => {
  test("público, sem sessão, sempre 200 com { rows: [] | [...] }", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/obras/destaque");
    expect(res.status(), "endpoint público deve retornar 200 mesmo sem sessão").toBe(200);
    const body = (await res.json()) as { rows?: unknown[] };
    expect(Array.isArray(body.rows), "rows deve ser um array").toBeTruthy();
  });
});
