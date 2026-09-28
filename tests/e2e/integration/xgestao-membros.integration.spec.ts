import { expect, test, type APIRequestContext } from "@playwright/test";
import { eq, inArray } from "drizzle-orm";
import { db } from "@shared/db/db";
import { atividades, clientes, empreiteiras, financeiro, medicoes, obras, users, xgestaoMembroObras } from "@shared/db/schema";
import {
  CNPJ_VALIDO,
  completarPerfilOperacional,
  fetchCapturedEmails,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from "../helpers";

const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };
const SETUP_PASSWORD = "Xconstr@E2E2026!";

async function setupMemberPassword(request: APIRequestContext, email: string) {
  const captured = await fetchCapturedEmails(request, email);
  // A captura guarda os envios mais recentes primeiro (reenvio invalida o link anterior).
  const inviteEmail = captured.find((item) => item.meta?.kind === "password-setup");
  const setupUrl = inviteEmail?.meta?.setupUrl;
  expect(typeof setupUrl, "convite deve conter URL de setup").toBe("string");
  const token = new URL(setupUrl as string).searchParams.get("token");
  expect(token).toBeTruthy();
  const setup = await request.post("/api/auth/definir-senha-inicial", {
    data: {
      token,
      password: SETUP_PASSWORD,
      confirmPassword: SETUP_PASSWORD,
    },
  });
  expect(setup.status(), await setup.text()).toBe(200);
}

async function createObra(request: APIRequestContext, nome: string): Promise<string> {
  const response = await request.post("/api/xgestao/obras", {
    data: { nome, endereco: "Rua XG31, 100" },
  });
  expect(response.status(), await response.text()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

test("XG31 escopa obras por grants, aplica revogação imediata e dá acesso total ao gestor", async ({ request, playwright }, testInfo) => {
  const ownerEmail = uniqueEmail("xgestao-membros-owner");
  const ownerRegistration = await request.post("/api/auth/register", {
    data: {
      name: "Dono XG31 teste",
      email: ownerEmail,
      username: uniqueUsername("xg31owner"),
      password: "Xconstr@E2E2026!",
      role: "empreiteiro",
      phone: "11988880000",
      cpfCnpj: CNPJ_VALIDO,
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect([200, 201]).toContain(ownerRegistration.status());

  await loginAs(request, ownerEmail);
  await completarPerfilOperacional(request, "empreiteiro");
  await logout(request);

  await loginAs(request, SEED_ADMIN_EMAIL);
  const ownerRows = await request.get(`/api/admin/usuarios?q=${encodeURIComponent(ownerEmail)}`);
  expect(ownerRows.status()).toBe(200);
  const ownerId = ((await ownerRows.json()) as { rows: Array<{ id: string }> }).rows[0]?.id;
  expect(ownerId).toBeTruthy();
  const enable = await request.patch(`/api/admin/usuarios/${ownerId}`, { data: { xgestao: true } });
  expect(enable.status(), await enable.text()).toBe(200);
  await logout(request);
  await loginAs(request, ownerEmail);

  const obraA = await createObra(request, "XG31 Obra A");
  const obraB = await createObra(request, "XG31 Obra B");
  const obraC = await createObra(request, "XG31 Obra C");

  const initial = await request.get("/api/xgestao/membros");
  expect(initial.status(), await initial.text()).toBe(200);
  const initialBody = (await initial.json()) as {
    rows: unknown[];
    obras: Array<{ obraId: string; nome: string }>;
  };
  expect(Array.isArray(initialBody.rows)).toBe(true);
  expect(Array.isArray(initialBody.obras)).toBe(true);

  const selfInvite = await request.post("/api/xgestao/membros", {
    data: {
      nome: "Dono existente",
      email: ownerEmail,
      papel: "gestor",
      obras: [],
    },
  });
  expect(selfInvite.status()).toBe(409);

  const inviteEmail = uniqueEmail("xgestao-membros-invite");
  const invite = await request.post("/api/xgestao/membros", {
    data: {
      nome: "Colaborador XG31",
      email: inviteEmail,
      papel: "colaborador",
      obras: [
        { obraId: obraA, permissao: "visualizar" },
        { obraId: obraB, permissao: "editar" },
      ],
    },
  });
  expect(invite.status(), await invite.text()).toBe(201);
  const invited = (await invite.json()) as { row: { id: string; status: string } };
  expect(invited.row.status).toBe("convidado");

  const duplicate = await request.post("/api/xgestao/membros", {
    data: {
      nome: "Colaborador duplicado",
      email: inviteEmail,
      papel: "colaborador",
      obras: [],
    },
  });
  expect(duplicate.status()).toBe(409);

  const resend = await request.post(`/api/xgestao/membros/${invited.row.id}/reenviar`, { data: {} });
  expect(resend.status(), await resend.text()).toBe(200);

  // A member may verify email before password setup. That must not provision
  // an independent company row that would take precedence over membership.
  const resendVerification = await request.post("/api/auth/resend-verification", {
    data: { email: inviteEmail },
  });
  expect(resendVerification.status(), await resendVerification.text()).toBe(200);
  const verificationEmail = (await fetchCapturedEmails(request, inviteEmail))
    .find((item) => item.meta?.kind === "verification");
  const verificationUrl = verificationEmail?.meta?.verificationUrl;
  expect(typeof verificationUrl, "verificação deve conter URL").toBe("string");
  const verified = await request.get(verificationUrl as string, { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(verified.status());
  const [invitee] = await db
    .select({ id: users.id, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, inviteEmail));
  expect(invitee?.emailVerified).toBeTruthy();
  const inviteeCompany = await db
    .select({ id: empreiteiras.id })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, invitee!.id));
  expect(inviteeCompany).toHaveLength(0);

  await setupMemberPassword(request, inviteEmail);

  const afterSetup = await request.get("/api/xgestao/membros");
  expect(afterSetup.status(), await afterSetup.text()).toBe(200);
  const rows = (await afterSetup.json() as {
    rows: Array<{ id: string; status: string; obras: Array<{ obraId: string; permissao: string }> }>;
  }).rows;
  const activeCollaborator = rows.find((row) => row.id === invited.row.id);
  expect(activeCollaborator?.status).toBe("ativo");
  expect(activeCollaborator?.obras).toHaveLength(2);
  expect(activeCollaborator?.obras).toContainEqual({ obraId: obraA, permissao: "visualizar" });
  expect(activeCollaborator?.obras).toContainEqual({ obraId: obraB, permissao: "editar" });
  const obraNova = await createObra(request, "XG31 Obra criada após convite");

  const resendActive = await request.post(`/api/xgestao/membros/${invited.row.id}/reenviar`, { data: {} });
  expect(resendActive.status()).toBe(409);

  const baseURL = testInfo.project.use.baseURL;
  expect(typeof baseURL).toBe("string");
  const collaboratorRequest = await playwright.request.newContext({ baseURL: baseURL as string });
  await loginAs(collaboratorRequest, inviteEmail);
  const [sharedEvent] = await db.insert(atividades).values({
    tipo: "diario_postado", actorUserId: ownerId, obraId: obraA,
    payload: { descricao: "Evento feito pelo responsável" },
  }).returning({ id: atividades.id });
  const sharedTimeline = await collaboratorRequest.get(`/api/atividades?obraId=${obraA}`);
  expect(sharedTimeline.status(), await sharedTimeline.text()).toBe(200);
  expect((await sharedTimeline.json() as { items: Array<{ id: string }> }).items)
    .toContainEqual(expect.objectContaining({ id: sharedEvent.id }));
  for (const id of [obraA, obraB]) {
    const detail = await collaboratorRequest.get(`/api/obras/${id}`);
    expect(detail.status(), await detail.text()).toBe(200);
  }
  const obraCSemGrant = await collaboratorRequest.get(`/api/obras/${obraC}`);
  expect(obraCSemGrant.status()).toBe(404);
  expect((await collaboratorRequest.get(`/api/obras/${obraNova}`)).status()).toBe(404);

  const visualizacaoNaoEdita = await collaboratorRequest.patch(`/api/obras/${obraA}`, {
    data: { nome: "XG31 A sem edição" },
  });
  expect(visualizacaoNaoEdita.status()).toBe(403);
  const etapasDaObraA = await collaboratorRequest.get(`/api/obras/${obraA}/etapas`);
  expect(etapasDaObraA.status(), await etapasDaObraA.text()).toBe(200);
  const visualizacaoNaoCriaConteudo = await collaboratorRequest.post(`/api/obras/${obraA}/etapas`, {
    data: { nome: "Etapa bloqueada para leitura" },
  });
  expect(visualizacaoNaoCriaConteudo.status()).toBe(403);
  const edicaoPermitida = await collaboratorRequest.patch(`/api/obras/${obraB}`, {
    data: { nome: "XG31 B editada pelo colaborador" },
  });
  expect(edicaoPermitida.status(), await edicaoPermitida.text()).toBe(200);
  const conteudoEditavel = await collaboratorRequest.post(`/api/obras/${obraB}/etapas`, {
    data: { nome: "Etapa criada pelo colaborador" },
  });
  expect(conteudoEditavel.status(), await conteudoEditavel.text()).toBe(201);
  // Cria user_file canônico via fixture de teste para cobrir vínculo/leitura
  // sem depender do R2; o presign/commit real fica no spec dedicado de uploads.
  const photoFileSetup = await request.post("/api/test/file-setup", {
    data: {
      email: inviteEmail,
      kind: "obra_foto",
      mime: "image/png",
      originalName: "xg31-colaborador-foto.png",
    },
  });
  expect(photoFileSetup.status(), await photoFileSetup.text()).toBe(200);
  const photoFileId = ((await photoFileSetup.json()) as { fileId: string }).fileId;
  const photoAttached = await collaboratorRequest.post(`/api/obras/${obraB}/fotos`, {
    data: { fileId: photoFileId, fase: "durante", tag: "Acesso editável" },
  });
  expect(photoAttached.status(), await photoAttached.text()).toBe(201);
  const photosReadable = await collaboratorRequest.get(`/api/obras/${obraB}/fotos`);
  expect(photosReadable.status(), await photosReadable.text()).toBe(200);
  expect(await photosReadable.json()).toMatchObject({
    rows: expect.arrayContaining([expect.objectContaining({ fileId: photoFileId })]),
  });
  const semGrantNoConteudo = await collaboratorRequest.get(`/api/obras/${obraC}/etapas`);
  expect(semGrantNoConteudo.status()).toBe(404);
  const cTimeline = await collaboratorRequest.get(`/api/atividades?obraId=${obraC}`);
  expect(cTimeline.status()).toBe(200);
  expect((await cTimeline.json() as { items: unknown[] }).items).toEqual([]);

  const minhasObras = await collaboratorRequest.get("/api/empreiteiro/minhas-obras");
  expect(minhasObras.status(), await minhasObras.text()).toBe(200);
  const idsListados = ((await minhasObras.json()) as Array<{ id: string }>).map((obra) => obra.id);
  expect(idsListados).toEqual(expect.arrayContaining([obraA, obraB]));
  expect(idsListados).not.toContain(obraC);
  expect(idsListados).not.toContain(obraNova);

  const colaboradorSemGestaoEquipe = await collaboratorRequest.get("/api/xgestao/membros");
  expect(colaboradorSemGestaoEquipe.status()).toBe(403);
  const nonOwnerResend = await collaboratorRequest.post(`/api/xgestao/membros/${invited.row.id}/reenviar`, { data: {} });
  expect(nonOwnerResend.status()).toBe(403);
  const collaboratorCannotCreateObra = await collaboratorRequest.post("/api/xgestao/obras", {
    data: { nome: "XG31 obra bloqueada para colaborador", endereco: "Rua XG31, 101" },
  });
  expect(collaboratorCannotCreateObra.status()).toBe(403);

  // Alteração dos grants deve valer já no próximo request, sem aguardar expiração
  // da sessão/JWT: A vira editável, C entra, e B perde o acesso.
  const grantsUpdated = await request.patch(`/api/xgestao/membros/${invited.row.id}`, {
    data: {
      papel: "colaborador",
      obras: [
        { obraId: obraA, permissao: "editar" },
        { obraId: obraC, permissao: "visualizar" },
      ],
    },
  });
  expect(grantsUpdated.status(), await grantsUpdated.text()).toBe(200);

  const aAfterGrant = await collaboratorRequest.patch(`/api/obras/${obraA}`, { data: { nome: "XG31 A editada após grant" } });
  expect(aAfterGrant.status(), await aAfterGrant.text()).toBe(200);
  const bAfterGrant = await collaboratorRequest.get(`/api/obras/${obraB}`);
  expect(bAfterGrant.status()).toBe(404);
  const bPhotosAfterGrantRemoval = await collaboratorRequest.get(`/api/obras/${obraB}/fotos`);
  expect(bPhotosAfterGrantRemoval.status()).toBe(404);
  const cAfterGrant = await collaboratorRequest.get(`/api/obras/${obraC}`);
  expect(cAfterGrant.status(), await cAfterGrant.text()).toBe(200);
  const aContentAfterGrant = await collaboratorRequest.post(`/api/obras/${obraA}/etapas`, {
    data: { nome: "Etapa criada após grant de edição" },
  });
  expect(aContentAfterGrant.status(), await aContentAfterGrant.text()).toBe(201);
  const cContentReadAfterGrant = await collaboratorRequest.get(`/api/obras/${obraC}/etapas`);
  expect(cContentReadAfterGrant.status(), await cContentReadAfterGrant.text()).toBe(200);
  const cContentWriteAfterGrant = await collaboratorRequest.post(`/api/obras/${obraC}/etapas`, {
    data: { nome: "Etapa bloqueada após grant de leitura" },
  });
  expect(cContentWriteAfterGrant.status()).toBe(403);

  const grantedList = await collaboratorRequest.get("/api/empreiteiro/minhas-obras");
  expect(grantedList.status(), await grantedList.text()).toBe(200);
  const grantedIds = ((await grantedList.json()) as Array<{ id: string }>).map((obra) => obra.id);
  expect(grantedIds).toEqual(expect.arrayContaining([obraA, obraC]));
  expect(grantedIds).not.toContain(obraB);

  // IDs de grant contaminados com obra de marketplace não podem expor dados
  // financeiros/medições. O dono, por outro lado, mantém os dois escopos.
  const [empresa] = await db
    .select({ id: empreiteiras.id })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, ownerId));
  const [clienteTeste] = await db
    .insert(clientes)
    .values({ nome: "Cliente XG31 escopo", email: uniqueEmail("xg31-marketplace-client") })
    .returning({ id: clientes.id });
  const [obraMarketplace] = await db
    .insert(obras)
    .values({
      nome: "Marketplace XG31 — escopo",
      endereco: "Rua de teste, 1",
      clienteId: clienteTeste!.id,
      empreiteiraId: empresa!.id,
    })
    .returning({ id: obras.id });
  const [otherActor] = await db.select({ id: users.id }).from(users).where(eq(users.email, SEED_ADMIN_EMAIL));
  const [marketplaceEvent] = await db.insert(atividades).values({
    tipo: "diario_postado", actorUserId: otherActor.id, obraId: obraMarketplace!.id,
    payload: { descricao: "Evento feito por terceiro" },
  }).returning({ id: atividades.id });
  const xgMedicaoId = `xg31-xg-${Date.now()}`;
  const marketplaceMedicaoId = `xg31-market-${Date.now()}`;
  const xgFinanceiroId = `xg31-xg-fin-${Date.now()}`;
  const marketplaceFinanceiroId = `xg31-market-fin-${Date.now()}`;
  try {
    const ownerMarketplaceTimeline = await request.get(`/api/atividades?obraId=${obraMarketplace!.id}`);
    expect(ownerMarketplaceTimeline.status(), await ownerMarketplaceTimeline.text()).toBe(200);
    expect((await ownerMarketplaceTimeline.json() as { items: Array<{ id: string }> }).items)
      .toContainEqual(expect.objectContaining({ id: marketplaceEvent.id }));
    const memberMarketplaceTimeline = await collaboratorRequest.get(`/api/atividades?obraId=${obraMarketplace!.id}`);
    expect(memberMarketplaceTimeline.status()).toBe(200);
    expect((await memberMarketplaceTimeline.json() as { items: unknown[] }).items).toEqual([]);
    // Simula estado legado/corrompido: a obra entrou na tabela de grants, mas é
    // marketplace (`clienteId != null`). A consulta das rotas deve revalidar isso.
    await db.insert(xgestaoMembroObras).values({
      membroId: invited.row.id,
      empreiteiraId: empresa!.id,
      obraId: obraMarketplace!.id,
      permissao: "visualizar",
    });
    const forgedGrant = await request.patch(`/api/xgestao/membros/${invited.row.id}`, {
      data: {
        papel: "colaborador",
        obras: [{ obraId: obraMarketplace!.id, permissao: "visualizar" }],
      },
    });
    expect(forgedGrant.status(), await forgedGrant.text()).toBe(400);
    const teamList = await request.get("/api/xgestao/membros");
    expect(teamList.status(), await teamList.text()).toBe(200);
    const teamBody = await teamList.json() as {
      rows: Array<{ id: string; obras: Array<{ obraId: string; permissao: string }> }>;
      obras: Array<{ obraId: string }>;
    };
    const listedCollaborator = teamBody.rows.find((row) => row.id === invited.row.id);
    expect(listedCollaborator?.obras.map((grant) => grant.obraId)).not.toContain(obraMarketplace!.id);
    expect(teamBody.obras.map((obra) => obra.obraId)).not.toContain(obraMarketplace!.id);
    const memberWorks = await collaboratorRequest.get("/api/empreiteiro/minhas-obras");
    expect(memberWorks.status(), await memberWorks.text()).toBe(200);
    const memberWorkIds = ((await memberWorks.json()) as Array<{ id: string }>).map((obra) => obra.id);
    expect(memberWorkIds).not.toContain(obraMarketplace!.id);

    await db.insert(medicoes).values([
      {
        obraId: obraA,
        empreiteiroId: ownerId,
        numero: 901,
        etapa: xgMedicaoId,
        percentual: "10",
        valor: "23.00",
        status: "pendente",
      },
      {
        obraId: obraMarketplace!.id,
        empreiteiroId: ownerId,
        numero: 902,
        etapa: marketplaceMedicaoId,
        percentual: "10",
        valor: "97.00",
        status: "pendente",
      },
    ]);
    await db.insert(financeiro).values([
      {
        tipo: "entrada",
        descricao: xgFinanceiroId,
        valor: "23.00",
        data: "2026-01-01",
        status: "pendente",
        obraId: obraA,
        recebedorUserId: ownerId,
      },
      {
        tipo: "entrada",
        descricao: marketplaceFinanceiroId,
        valor: "97.00",
        data: "2026-01-02",
        status: "pendente",
        obraId: obraMarketplace!.id,
        recebedorUserId: ownerId,
      },
    ]);

    const ownerMedicoes = await request.get("/api/empreiteiro/medicoes");
    expect(ownerMedicoes.status(), await ownerMedicoes.text()).toBe(200);
    const ownerMedicaoIds = ((await ownerMedicoes.json()) as Array<{ etapa: string }>).map((row) => row.etapa);
    expect(ownerMedicaoIds).toEqual(expect.arrayContaining([xgMedicaoId, marketplaceMedicaoId]));

    const memberMedicoes = await collaboratorRequest.get("/api/empreiteiro/medicoes");
    expect(memberMedicoes.status(), await memberMedicoes.text()).toBe(200);
    const memberMedicaoIds = ((await memberMedicoes.json()) as Array<{ etapa: string }>).map((row) => row.etapa);
    expect(memberMedicaoIds).toContain(xgMedicaoId);
    expect(memberMedicaoIds).not.toContain(marketplaceMedicaoId);

    const ownerPayments = await request.get("/api/empreiteiro/pagamentos");
    expect(ownerPayments.status(), await ownerPayments.text()).toBe(200);
    const ownerPaymentDescriptions = ((await ownerPayments.json()) as Array<{ descricao: string }>).map((row) => row.descricao);
    expect(ownerPaymentDescriptions).toEqual(expect.arrayContaining([xgFinanceiroId, marketplaceFinanceiroId]));

    const memberPayments = await collaboratorRequest.get("/api/empreiteiro/pagamentos");
    expect(memberPayments.status(), await memberPayments.text()).toBe(200);
    const memberPaymentDescriptions = ((await memberPayments.json()) as Array<{ descricao: string }>).map((row) => row.descricao);
    expect(memberPaymentDescriptions).toContain(xgFinanceiroId);
    expect(memberPaymentDescriptions).not.toContain(marketplaceFinanceiroId);

    const [ownerKpi, memberKpi] = await Promise.all([
      request.get("/api/empreiteiro/pagamentos/kpi"),
      collaboratorRequest.get("/api/empreiteiro/pagamentos/kpi"),
    ]);
    expect(ownerKpi.status(), await ownerKpi.text()).toBe(200);
    expect(memberKpi.status(), await memberKpi.text()).toBe(200);
    const ownerKpiBody = await ownerKpi.json() as { totalContratado: number; aguardandoAprovacao: number };
    const memberKpiBody = await memberKpi.json() as { totalContratado: number; aguardandoAprovacao: number };
    expect(ownerKpiBody.totalContratado - memberKpiBody.totalContratado).toBeGreaterThanOrEqual(97);
    expect(ownerKpiBody.aguardandoAprovacao - memberKpiBody.aguardandoAprovacao).toBeGreaterThanOrEqual(97);
  } finally {
    await db.delete(atividades).where(eq(atividades.id, marketplaceEvent.id));
    await db.delete(financeiro).where(inArray(financeiro.obraId, [obraA, obraMarketplace!.id]));
    await db.delete(medicoes).where(inArray(medicoes.obraId, [obraA, obraMarketplace!.id]));
    await db.delete(xgestaoMembroObras).where(eq(xgestaoMembroObras.obraId, obraMarketplace!.id));
    await db.delete(obras).where(eq(obras.id, obraMarketplace!.id));
    await db.delete(clientes).where(eq(clientes.id, clienteTeste!.id));
  }

  // Gestor tem acesso integral às três obras, sem grants individuais, mas não
  // recebe a capacidade administrativa de gerenciar a equipe.
  const managerEmail = uniqueEmail("xgestao-membros-manager");
  const managerInvite = await request.post("/api/xgestao/membros", {
    data: {
      nome: "Gestor XG31",
      email: managerEmail,
      papel: "gestor",
      obras: [],
    },
  });
  expect(managerInvite.status(), await managerInvite.text()).toBe(201);
  const managerId = ((await managerInvite.json()) as { row: { id: string } }).row.id;
  await setupMemberPassword(request, managerEmail);

  const rowsAfterManagerSetup = await request.get("/api/xgestao/membros");
  expect(rowsAfterManagerSetup.status()).toBe(200);
  expect((await rowsAfterManagerSetup.json() as { rows: Array<{ id: string; status: string }> }).rows)
    .toContainEqual(expect.objectContaining({ id: managerId, status: "ativo" }));

  const managerRequest = await playwright.request.newContext({ baseURL: baseURL as string });
  await loginAs(managerRequest, managerEmail);
  const [managerUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, managerEmail));
  const [managerEvent] = await db.insert(atividades).values({
    tipo: "diario_postado", actorUserId: managerUser.id, obraId: obraA,
    payload: { descricao: "Evento feito pelo gestor" },
  }).returning({ id: atividades.id });
  const teammateTimeline = await collaboratorRequest.get(`/api/atividades?obraId=${obraA}`);
  expect(teammateTimeline.status()).toBe(200);
  expect((await teammateTimeline.json() as { items: Array<{ id: string }> }).items)
    .toContainEqual(expect.objectContaining({ id: managerEvent.id }));
  for (const id of [obraA, obraB, obraC]) {
    const detail = await managerRequest.get(`/api/obras/${id}`);
    expect(detail.status(), await detail.text()).toBe(200);
  }
  const managerList = await managerRequest.get("/api/empreiteiro/minhas-obras");
  expect(managerList.status(), await managerList.text()).toBe(200);
  const managerIds = ((await managerList.json()) as Array<{ id: string }>).map((obra) => obra.id);
  expect(managerIds).toEqual(expect.arrayContaining([obraA, obraB, obraC]));
  const managerCanEdit = await managerRequest.patch(`/api/obras/${obraC}`, {
    data: { nome: "XG31 C editada pelo gestor" },
  });
  expect(managerCanEdit.status(), await managerCanEdit.text()).toBe(200);
  const managerCannotManageMembers = await managerRequest.get("/api/xgestao/membros");
  expect(managerCannotManageMembers.status()).toBe(403);

  const managerCreatedObra = await managerRequest.post("/api/xgestao/obras", {
    data: { nome: "XG31 obra criada pelo gestor", endereco: "Rua XG31, 102" },
  });
  expect(managerCreatedObra.status(), await managerCreatedObra.text()).toBe(201);
  const managerCreatedObraId = ((await managerCreatedObra.json()) as { id: string }).id;
  const managerCannotDeleteObra = await managerRequest.delete(`/api/obras/${managerCreatedObraId}`);
  expect(managerCannotDeleteObra.status()).toBe(403);
  const preservedAfterManagerDelete = await managerRequest.get(`/api/obras/${managerCreatedObraId}`);
  expect(preservedAfterManagerDelete.status(), await preservedAfterManagerDelete.text()).toBe(200);
  const ownerCanDeleteObra = await request.delete(`/api/obras/${managerCreatedObraId}`);
  expect(ownerCanDeleteObra.status(), await ownerCanDeleteObra.text()).toBe(200);

  const ownerPlan = await request.get("/api/perfil/plano?persona=xgestao");
  expect(ownerPlan.status(), await ownerPlan.text()).toBe(200);
  expect(await ownerPlan.json()).toMatchObject({ persona: "xgestao", plano: "free" });

  // Revogar a membership corta o acesso na próxima consulta autenticada.
  const revoke = await request.delete(`/api/xgestao/membros/${invited.row.id}`);
  expect(revoke.status(), await revoke.text()).toBe(200);
  const revokedAccess = await collaboratorRequest.get(`/api/obras/${obraA}`);
  expect(revokedAccess.status()).toBe(404);
  const revokedList = await collaboratorRequest.get("/api/empreiteiro/minhas-obras");
  expect(revokedList.status(), await revokedList.text()).toBe(200);
  expect(await revokedList.json()).toEqual([]);
  const revokedTimeline = await collaboratorRequest.get(`/api/atividades?obraId=${obraA}`);
  expect(revokedTimeline.status()).toBe(200);
  expect((await revokedTimeline.json() as { items: unknown[] }).items).toEqual([]);

  // A área de inspeção administrativa pode ler obras XGestão, sem expor uma
  // rota administrativa de escrita.
  await logout(request);
  await loginAs(request, SEED_ADMIN_EMAIL);
  const adminWorkRead = await request.get(`/api/admin/xgestao/obras/${obraC}`);
  expect(adminWorkRead.status(), await adminWorkRead.text()).toBe(200);
  const adminWorkWrite = await request.patch(`/api/admin/xgestao/obras/${obraC}`, {
    data: { nome: "XG31 tentativa de edição administrativa" },
  });
  expect(adminWorkWrite.status()).toBe(405);

  await collaboratorRequest.dispose();
  await managerRequest.dispose();
});