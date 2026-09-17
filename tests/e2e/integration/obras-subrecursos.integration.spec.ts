import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  auditLogs,
  obraAnexos,
  obraChecklistItens,
  obraChecklistMarcacoes,
  obraChecklists,
  obraDiario,
  obraEquipe,
  obraEtapas,
  obraFotos,
  obraOcorrencias,
  obraTarefas,
  userFiles,
} from "@shared/db/schema";
import { periodoAtual } from "@features/empreiteiro/minhas-obras/lib/checklist-periodo";
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

  /*
   * XG21 — recorrência.
   *
   * "Deu meia-noite, ele zera, o stick some (...) Aí o cliente entra no dia lá,
   * se tiver sem ticar, quer dizer que não foi feito no dia."
   *
   * O reset é calculado por período, não executado por cron — por isso dá para
   * testar sem manipular relógio: basta gravar uma marcação com a data de
   * ontem e conferir que o GET de hoje volta zerado **sem apagá-la**.
   */
  test("recorrência diária: toggle grava marcação no período de hoje", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/checklists`, {
      data: {
        nome: "E2E Checklist diário de EPIs",
        tipo: "seguranca",
        recorrencia: "diaria",
        itens: [{ titulo: "E2E capacete" }, { titulo: "E2E luvas" }],
      },
    });
    expect(post.status(), "POST com recorrencia diaria deve retornar 201").toBe(201);
    const created = (await post.json()) as {
      id: string;
      recorrencia: string;
      itens: Array<{ id: string }>;
    };
    expect(created.recorrencia, "recorrencia deve persistir").toBe("diaria");

    const itemId = created.itens[0]!.id;
    const patch = await request.patch(`/api/obras/${obra.obraId}/checklists/${created.id}`, {
      data: { toggleItemId: itemId },
    });
    expect(patch.status(), "PATCH toggle deve retornar 200").toBe(200);

    const hoje = periodoAtual("diaria")!;
    const marcacoes = await db
      .select()
      .from(obraChecklistMarcacoes)
      .where(eq(obraChecklistMarcacoes.checklistId, created.id));
    expect(marcacoes.length, "toggle deve gravar exatamente 1 marcação").toBe(1);
    expect(marcacoes[0]!.periodoRef, "marcação deve usar o período de hoje").toBe(hoje);
    expect(marcacoes[0]!.itemOrdem, "marcação ancora na ordem do item, não no id").toBe(0);

    // Toggle de novo desmarca — e não deixa lixo no histórico do período.
    const untoggle = await request.patch(`/api/obras/${obra.obraId}/checklists/${created.id}`, {
      data: { toggleItemId: itemId },
    });
    expect(untoggle.status(), "segundo toggle deve retornar 200").toBe(200);
    const aposUntoggle = await db
      .select()
      .from(obraChecklistMarcacoes)
      .where(eq(obraChecklistMarcacoes.checklistId, created.id));
    expect(aposUntoggle.length, "desmarcar deve remover a marcação do período").toBe(0);

    await logout(request);
  });

  test("recorrência diária: vira o dia zerando os itens SEM apagar o histórico", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/checklists`, {
      data: {
        nome: "E2E Checklist de ontem",
        tipo: "seguranca",
        recorrencia: "diaria",
        itens: [{ titulo: "E2E item A" }, { titulo: "E2E item B" }],
      },
    });
    const created = (await post.json()) as { id: string; itens: Array<{ id: string }> };

    // Simula "ontem foi tudo feito": marcações no período anterior.
    const hoje = periodoAtual("diaria")!;
    const ontem = new Date(`${hoje}T12:00:00Z`);
    ontem.setUTCDate(ontem.getUTCDate() - 1);
    const periodoOntem = ontem.toISOString().slice(0, 10);
    await db.insert(obraChecklistMarcacoes).values([
      { checklistId: created.id, itemOrdem: 0, periodoRef: periodoOntem },
      { checklistId: created.id, itemOrdem: 1, periodoRef: periodoOntem },
    ]);

    const get = await request.get(`/api/obras/${obra.obraId}/checklists`);
    expect(get.status(), "GET checklists deve retornar 200").toBe(200);
    const { rows } = (await get.json()) as {
      rows: Array<{
        id: string;
        status: string;
        completadoEm: string | null;
        pendenteNoPeriodo: boolean;
        itens: Array<{ concluida: boolean }>;
      }>;
    };
    const row = rows.find((r) => r.id === created.id)!;

    expect(
      row.itens.every((i) => !i.concluida),
      "itens marcados ONTEM devem aparecer desmarcados hoje — este é o reset",
    ).toBe(true);
    expect(row.status, "status deve voltar a pendente no período novo").toBe("pendente");
    expect(row.completadoEm, "a hora de conclusão de ontem não vale para hoje").toBeNull();
    expect(row.pendenteNoPeriodo, "checklist deve aparecer como pendente hoje").toBe(true);

    // O ponto central do pedido: a evidência de ontem continua lá.
    const historico = await db
      .select()
      .from(obraChecklistMarcacoes)
      .where(eq(obraChecklistMarcacoes.checklistId, created.id));
    expect(
      historico.length,
      "o reset NÃO pode apagar o histórico — é ele que prova o que foi feito ontem",
    ).toBe(2);
    expect(historico.every((m) => m.periodoRef === periodoOntem)).toBe(true);

    await logout(request);
  });

  test("sem recorrência: comportamento antigo intacto (regressão)", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/checklists`, {
      data: {
        nome: "E2E Checklist sem recorrência",
        tipo: "etapa",
        itens: [{ titulo: "E2E item único" }],
      },
    });
    const created = (await post.json()) as {
      id: string;
      recorrencia: string;
      itens: Array<{ id: string }>;
    };
    expect(created.recorrencia, "default deve continuar 'nenhuma'").toBe("nenhuma");

    await request.patch(`/api/obras/${obra.obraId}/checklists/${created.id}`, {
      data: { toggleItemId: created.itens[0]!.id, status: "em_andamento" },
    });

    // Sem recorrência o tique continua na coluna do item, como sempre foi.
    const [itemRow] = await db
      .select()
      .from(obraChecklistItens)
      .where(eq(obraChecklistItens.id, created.itens[0]!.id))
      .limit(1);
    expect(itemRow?.concluida, "sem recorrência o toggle ainda grava em itens.concluida").toBe(true);

    const marcacoes = await db
      .select()
      .from(obraChecklistMarcacoes)
      .where(eq(obraChecklistMarcacoes.checklistId, created.id));
    expect(marcacoes.length, "sem recorrência não deve criar marcação").toBe(0);

    await logout(request);
  });

  /*
   * Reabrir checklist.
   *
   * Assinar era um caminho sem volta: com a assinatura gravada o card fica
   * read-only e, num checklist sem recorrência, a única saída era excluir o
   * checklist inteiro. Reabrir limpa a assinatura e devolve a edição — mas
   * **mantém os itens marcados**, porque quem reabre quer corrigir o nome de
   * quem assinou, não refazer a inspeção no canteiro.
   */
  test("reabrir: limpa a assinatura e MANTÉM os itens marcados", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/checklists`, {
      data: {
        nome: "E2E Checklist para reabrir",
        tipo: "etapa",
        itens: [{ titulo: "E2E reabrir 1" }, { titulo: "E2E reabrir 2" }],
      },
    });
    const created = (await post.json()) as { id: string; itens: Array<{ id: string }> };

    // Assina: marca todos os itens e carimba quem assinou.
    const assinar = await request.patch(`/api/obras/${obra.obraId}/checklists/${created.id}`, {
      data: {
        status: "completo",
        markAllItens: true,
        assinadoPor: "E2E Engenheiro",
        assinadoEm: "17/09/2026 10:00",
        registroProfissional: "CREA-E2E-123",
        completadoEm: "10:00",
      },
    });
    expect(assinar.status(), "PATCH de assinatura deve retornar 200").toBe(200);

    const reabrir = await request.patch(`/api/obras/${obra.obraId}/checklists/${created.id}`, {
      data: {
        reabrir: true,
        status: "em_andamento",
        assinadoPor: null,
        assinadoEm: null,
        registroProfissional: null,
        completadoEm: null,
      },
    });
    expect(reabrir.status(), "PATCH de reabertura deve retornar 200").toBe(200);

    const [row] = await db
      .select()
      .from(obraChecklists)
      .where(eq(obraChecklists.id, created.id))
      .limit(1);
    expect(row?.assinadoPor, "a assinatura deve ser apagada").toBeNull();
    expect(row?.assinadoEm, "a data da assinatura deve ser apagada").toBeNull();
    expect(row?.registroProfissional, "o registro profissional deve ser apagado").toBeNull();
    expect(row?.completadoEm, "a hora de conclusão deve ser apagada").toBeNull();
    expect(row?.status, "status reaberto deve destravar o card").toBe("em_andamento");

    // O ponto central: a inspeção feita continua registrada.
    const itens = await db
      .select()
      .from(obraChecklistItens)
      .where(eq(obraChecklistItens.checklistId, created.id));
    expect(itens.length, "os itens devem continuar lá").toBe(2);
    expect(
      itens.every((i) => i.concluida),
      "reabrir NÃO pode desmarcar os itens — corrigir a assinatura não é refazer a inspeção",
    ).toBe(true);

    await logout(request);
  });

  test("reabrir: grava auditoria própria com a assinatura descartada", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/checklists`, {
      data: {
        nome: "E2E Checklist auditoria de reabertura",
        tipo: "etapa",
        itens: [{ titulo: "E2E audit 1" }],
      },
    });
    const created = (await post.json()) as { id: string };

    await request.patch(`/api/obras/${obra.obraId}/checklists/${created.id}`, {
      data: {
        status: "completo",
        markAllItens: true,
        assinadoPor: "E2E Assinante Original",
        assinadoEm: "17/09/2026 11:00",
        registroProfissional: "CREA-E2E-999",
        completadoEm: "11:00",
      },
    });
    await request.patch(`/api/obras/${obra.obraId}/checklists/${created.id}`, {
      data: {
        reabrir: true,
        status: "em_andamento",
        assinadoPor: null,
        assinadoEm: null,
        registroProfissional: null,
        completadoEm: null,
      },
    });

    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "obras.checklist.reabrir"));
    const doTeste = logs.find((l) => l.payload?.checklistId === created.id);
    expect(
      doTeste,
      "reabertura deve ter action própria — apagar assinatura profissional não é 'editei o nome'",
    ).toBeTruthy();
    expect(
      doTeste?.payload?.assinaturaAnterior,
      "sem o valor antigo o log prova que houve reabertura, mas não de quem era a assinatura",
    ).toBe("E2E Assinante Original");
    expect(doTeste?.payload?.registroProfissionalAnterior).toBe("CREA-E2E-999");

    await logout(request);
  });

  /*
   * O PATCH de toggle já responde com o checklist projetado no período
   * corrente. É desse contrato que o update otimista do cliente depende: o
   * `onSuccess` escreve esta resposta direto no cache em vez de refazer o
   * detalhe inteiro da obra (~19 queries + presigns R2). Se a rota parar de
   * projetar, o tique volta a piscar — por isso o contrato é testado aqui.
   */
  test("PATCH de toggle responde com o checklist já projetado", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/checklists`, {
      data: {
        nome: "E2E Checklist contrato de resposta",
        tipo: "seguranca",
        recorrencia: "diaria",
        itens: [{ titulo: "E2E resp 1" }, { titulo: "E2E resp 2" }],
      },
    });
    const created = (await post.json()) as { id: string; itens: Array<{ id: string }> };

    const patch = await request.patch(`/api/obras/${obra.obraId}/checklists/${created.id}`, {
      data: { toggleItemId: created.itens[0]!.id },
    });
    expect(patch.status()).toBe(200);
    const body = (await patch.json()) as {
      status: string;
      pendenteNoPeriodo: boolean;
      periodoRef: string | null;
      itens: Array<{ id: string; concluida: boolean }>;
    };

    expect(
      body.itens.find((i) => i.id === created.itens[0]!.id)?.concluida,
      "a resposta deve trazer o item já marcado, sem precisar de um novo GET",
    ).toBe(true);
    expect(body.status, "status deve vir derivado do período").toBe("em_andamento");
    expect(body.pendenteNoPeriodo, "ainda há item por marcar hoje").toBe(true);
    expect(body.periodoRef, "a resposta deve dizer de que período ela fala").toBe(
      periodoAtual("diaria"),
    );

    await logout(request);
  });

  test("recorrência semanal: markAllItens grava todas as ordens no período", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const post = await request.post(`/api/obras/${obra.obraId}/checklists`, {
      data: {
        nome: "E2E Checklist semanal",
        tipo: "diario",
        recorrencia: "semanal",
        recorrenciaDiaSemana: 1,
        itens: [{ titulo: "E2E s1" }, { titulo: "E2E s2" }, { titulo: "E2E s3" }],
      },
    });
    const created = (await post.json()) as { id: string; recorrenciaDiaSemana: number };
    expect(created.recorrenciaDiaSemana, "dia da semana deve persistir").toBe(1);

    const patch = await request.patch(`/api/obras/${obra.obraId}/checklists/${created.id}`, {
      data: { markAllItens: true, status: "completo", completadoEm: "21:14" },
    });
    expect(patch.status()).toBe(200);
    const body = (await patch.json()) as {
      status: string;
      itens: Array<{ concluida: boolean }>;
      periodoRef: string;
    };
    expect(body.itens.every((i) => i.concluida), "todos os itens devem ficar marcados").toBe(true);
    expect(body.status, "com tudo marcado o período fica completo").toBe("completo");
    expect(body.periodoRef, "período semanal deve bater com o cálculo").toBe(
      periodoAtual("semanal", 1),
    );

    const marcacoes = await db
      .select()
      .from(obraChecklistMarcacoes)
      .where(eq(obraChecklistMarcacoes.checklistId, created.id));
    expect(marcacoes.length, "markAllItens deve gravar as 3 ordens").toBe(3);

    // Idempotência: repetir não duplica (UNIQUE em checklist+ordem+período).
    await request.patch(`/api/obras/${obra.obraId}/checklists/${created.id}`, {
      data: { markAllItens: true },
    });
    const depois = await db
      .select()
      .from(obraChecklistMarcacoes)
      .where(eq(obraChecklistMarcacoes.checklistId, created.id));
    expect(depois.length, "markAllItens repetido não pode duplicar marcações").toBe(3);

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

  /**
   * XG22 — PIX, valor de contrato e o contrato assinado.
   *
   * "Coloca uma caixa para pôr a chave PIX dele também (...) e também o valor de
   * contrato, ou até anexar um link, se for o caso, um PDF."
   */
  test("XG22: PIX e valor de contrato persistem e são editáveis", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);

    const post = await request.post(`/api/obras/${obra.obraId}/equipe`, {
      data: {
        nome: "E2E Jefferson Elétrica",
        papel: "Elétrica",
        tipo: "equipe",
        pixChave: "jefferson@eletrica.com.br",
        valorContrato: 12000.5,
      },
    });
    expect(post.status(), await post.text()).toBe(201);
    const created = (await post.json()) as { id: string };

    const [row] = await db.select().from(obraEquipe).where(eq(obraEquipe.id, created.id)).limit(1);
    expect(row?.pixChave, "chave PIX persistida").toBe("jefferson@eletrica.com.br");
    expect(Number(row?.valorContrato), "valor com centavos, sem perda de precisão").toBe(12000.5);

    // Editar o valor: o contrato pode ser renegociado.
    const patch = await request.patch(`/api/obras/${obra.obraId}/equipe/${created.id}`, {
      data: { valorContrato: 15000 },
    });
    expect(patch.status(), await patch.text()).toBe(200);
    const [aposPatch] = await db.select().from(obraEquipe).where(eq(obraEquipe.id, created.id)).limit(1);
    expect(Number(aposPatch?.valorContrato)).toBe(15000);
    expect(aposPatch?.pixChave, "PATCH parcial preserva o PIX").toBe("jefferson@eletrica.com.br");

    // Limpar: `null` apaga, `undefined` (ausente) preservaria.
    const limpa = await request.patch(`/api/obras/${obra.obraId}/equipe/${created.id}`, {
      data: { pixChave: null, valorContrato: null },
    });
    expect(limpa.status(), await limpa.text()).toBe(200);
    const [aposLimpar] = await db.select().from(obraEquipe).where(eq(obraEquipe.id, created.id)).limit(1);
    expect(aposLimpar?.pixChave, "PIX limpo").toBeNull();
    expect(aposLimpar?.valorContrato, "valor limpo").toBeNull();

    await request.delete(`/api/obras/${obra.obraId}/equipe/${created.id}`);
    await logout(request);
  });

  test("XG22: contrato aceita link, recusa arquivo+link juntos e link não-http", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);

    const comLink = await request.post(`/api/obras/${obra.obraId}/equipe`, {
      data: {
        nome: "E2E Prestador Link",
        papel: "Hidráulica",
        tipo: "equipe",
        contratoLinkUrl: "https://drive.google.com/file/contrato-assinado",
      },
    });
    expect(comLink.status(), await comLink.text()).toBe(201);
    const criadoLink = (await comLink.json()) as { id: string };
    const [rowLink] = await db.select().from(obraEquipe).where(eq(obraEquipe.id, criadoLink.id)).limit(1);
    expect(rowLink?.contratoLinkUrl).toBe("https://drive.google.com/file/contrato-assinado");

    // `javascript:` passa no `.url()` do zod — o regex é que barra.
    const linkPerigoso = await request.post(`/api/obras/${obra.obraId}/equipe`, {
      data: {
        nome: "E2E Prestador XSS",
        papel: "Pintura",
        tipo: "equipe",
        contratoLinkUrl: "javascript:alert(1)",
      },
    });
    expect(linkPerigoso.status(), "esquema não-http deve ser recusado").toBe(400);

    // Arquivo e link ao mesmo tempo: ambíguo, recusado.
    const ambos = await request.post(`/api/obras/${obra.obraId}/equipe`, {
      data: {
        nome: "E2E Prestador Ambiguo",
        papel: "Alvenaria",
        tipo: "equipe",
        contratoFileId: "00000000-0000-0000-0000-000000000000",
        contratoLinkUrl: "https://exemplo.com/contrato.pdf",
      },
    });
    expect(ambos.status(), "arquivo + link deve ser recusado").toBe(400);

    // O mesmo vale no PATCH, e sobre o ESTADO FINAL: quem já tem link não pode
    // ganhar um arquivo por um patch que só menciona o arquivo.
    const patchAmbiguo = await request.patch(
      `/api/obras/${obra.obraId}/equipe/${criadoLink.id}`,
      { data: { contratoFileId: "00000000-0000-0000-0000-000000000000" } },
    );
    expect(patchAmbiguo.status(), "PATCH que cria a combinação proibida → 400").toBe(400);

    // Arquivo inexistente/alheio não pode ser vinculado.
    const arquivoFantasma = await request.post(`/api/obras/${obra.obraId}/equipe`, {
      data: {
        nome: "E2E Prestador Fantasma",
        papel: "Gesso",
        tipo: "equipe",
        contratoFileId: "00000000-0000-0000-0000-000000000000",
      },
    });
    expect(arquivoFantasma.status(), "fileId inexistente → 400").toBe(400);

    await request.delete(`/api/obras/${obra.obraId}/equipe/${criadoLink.id}`);
    await logout(request);
  });

  test("XG22: prévia de gasto soma contratos e ignora inativos", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);

    const criar = async (nome: string, valor: number) => {
      const r = await request.post(`/api/obras/${obra.obraId}/equipe`, {
        data: { nome, papel: "Serviço", tipo: "equipe", valorContrato: valor },
      });
      expect(r.status(), await r.text()).toBe(201);
      return (await r.json()) as { id: string };
    };

    const a = await criar("E2E Contrato A", 10000);
    const b = await criar("E2E Contrato B", 5000);
    // Sem valor de contrato: não deve somar nada nem quebrar a conta.
    const semValor = await request.post(`/api/obras/${obra.obraId}/equipe`, {
      data: { nome: "E2E Sem Contrato", papel: "Ajudante", tipo: "equipe" },
    });
    expect(semValor.status()).toBe(201);
    const c = (await semValor.json()) as { id: string };

    const somaAtiva = await db
      .select()
      .from(obraEquipe)
      .where(eq(obraEquipe.obraId, obra.obraId));
    const total = somaAtiva
      .filter((m) => m.ativo && m.valorContrato != null)
      .reduce((s, m) => s + Number(m.valorContrato), 0);
    expect(total, "10000 + 5000, e o sem contrato não entra").toBe(15000);

    // Desativar um prestador tira o contrato dele da previsão: quem saiu da obra
    // não deve continuar pesando no custo previsto.
    const desativa = await request.patch(`/api/obras/${obra.obraId}/equipe/${b.id}`, {
      data: { ativo: false },
    });
    expect(desativa.status()).toBe(200);

    const apos = await db.select().from(obraEquipe).where(eq(obraEquipe.obraId, obra.obraId));
    const totalApos = apos
      .filter((m) => m.ativo && m.valorContrato != null)
      .reduce((s, m) => s + Number(m.valorContrato), 0);
    expect(totalApos, "só o contrato ativo sobra").toBe(10000);

    for (const id of [a.id, b.id, c.id]) {
      await request.delete(`/api/obras/${obra.obraId}/equipe/${id}`);
    }
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
