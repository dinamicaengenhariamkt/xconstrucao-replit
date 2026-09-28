import { expect, test, type APIRequestContext } from "@playwright/test";
import { eq, inArray } from "drizzle-orm";
import { db } from "@shared/db/db";
import { atividades, chatThreads, clientes, empreiteiras, financeiro, medicoes, obras, users, xgestaoMembroObras } from "@shared/db/schema";
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
  // O e-mail pode conter a URL pública de desenvolvimento; consumir o token no
  // mesmo servidor E2E que criou o convite e os usuários deste teste.
  const verificationPath = new URL(verificationUrl as string);
  const verified = await request.get(`${verificationPath.pathname}${verificationPath.search}`, { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(verified.status());
  expect(verified.headers().location).toContain("success=verified");
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
  const memberStats = await collaboratorRequest.get("/api/empreiteiro/dashboard/stats");
  expect(memberStats.status(), await memberStats.text()).toBe(200);
  expect(await memberStats.json()).toMatchObject({ obrasAtivas: 2 });
  const memberHealth = await collaboratorRequest.get("/api/empreiteiro/obras-health");
  expect(memberHealth.status(), await memberHealth.text()).toBe(200);
  const healthIds = Object.keys(await memberHealth.json());
  expect(healthIds).toEqual(expect.arrayContaining([obraA, obraB]));
  expect(healthIds).not.toContain(obraC);
  const memberFinancial = await collaboratorRequest.get("/api/empreiteiro/dashboard/financial");
  expect(memberFinancial.status(), await memberFinancial.text()).toBe(200);
  const memberOwnWorkChat = await collaboratorRequest.post("/api/empreiteiro/chat/garantir-thread", {
    data: { obraId: obraA },
  });
  expect(memberOwnWorkChat.status()).toBe(422);
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
  const grantedStats = await collaboratorRequest.get("/api/empreiteiro/dashboard/stats");
  expect(grantedStats.status(), await grantedStats.text()).toBe(200);
  expect(await grantedStats.json()).toMatchObject({ obrasAtivas: 2 });
  const grantedHealth = await collaboratorRequest.get("/api/empreiteiro/obras-health");
  expect(grantedHealth.status(), await grantedHealth.text()).toBe(200);
  expect(Object.keys(await grantedHealth.json())).toEqual(expect.arrayContaining([obraA, obraC]));

  // Phase B — restringe a área do membro ao financeiro e, dentro dela, apenas
  // à categoria mão de obra. As permissões devem valer imediatamente.
  const invalidArea = await request.patch(`/api/xgestao/membros/${invited.row.id}`, {
    data: {
      papel: "colaborador",
      obras: [
        { obraId: obraA, permissao: "editar" },
        { obraId: obraC, permissao: "visualizar" },
      ],
      areasPermitidas: ["financeiro", "area_invalida"],
      categoriasFinanceiroPermitidas: ["mao_de_obra"],
    },
  });
  expect(invalidArea.status(), await invalidArea.text()).toBe(400);

  const restrictedPermissions = await request.patch(`/api/xgestao/membros/${invited.row.id}`, {
    data: {
      papel: "colaborador",
      obras: [
        { obraId: obraA, permissao: "editar" },
        { obraId: obraC, permissao: "visualizar" },
      ],
      areasPermitidas: ["financeiro"],
      categoriasFinanceiroPermitidas: ["mao_de_obra"],
    },
  });
  expect(restrictedPermissions.status(), await restrictedPermissions.text()).toBe(200);
  expect(await restrictedPermissions.json()).toMatchObject({
    row: {
      areasPermitidas: ["financeiro"],
      categoriasFinanceiroPermitidas: ["mao_de_obra"],
    },
  });

  const nonOwnerCannotPatch = await collaboratorRequest.patch(`/api/xgestao/membros/${invited.row.id}`, {
    data: {
      papel: "colaborador",
      obras: [],
      areasPermitidas: null,
      categoriasFinanceiroPermitidas: null,
    },
  });
  expect(nonOwnerCannotPatch.status()).toBe(403);

  for (const areaPath of ["etapas", "diario", "ocorrencias", "equipe"]) {
    const blockedArea = await collaboratorRequest.get(`/api/obras/${obraA}/${areaPath}`);
    expect(blockedArea.status(), `${areaPath} deve ser bloqueada ao membro`).toBe(403);
  }

  const laborDescription = `XG31 mão de obra membro ${Date.now()}`;
  const materialDescription = `XG31 material dono ${Date.now()}`;
  const memberLabor = await collaboratorRequest.post(`/api/obras/${obraA}/financeiro`, {
    data: {
      tipo: "saida",
      categoria: "mao_de_obra",
      descricao: laborDescription,
      valor: 125,
      data: "2026-01-03",
    },
  });
  expect(memberLabor.status(), await memberLabor.text()).toBe(201);

  const memberMaterial = await collaboratorRequest.post(`/api/obras/${obraA}/financeiro`, {
    data: {
      tipo: "saida",
      categoria: "material",
      descricao: `XG31 material bloqueado ${Date.now()}`,
      valor: 50,
      data: "2026-01-04",
    },
  });
  expect(memberMaterial.status()).toBe(403);
  const memberEntrada = await collaboratorRequest.post(`/api/obras/${obraA}/financeiro`, {
    data: {
      tipo: "entrada",
      descricao: `XG31 entrada bloqueada ${Date.now()}`,
      valor: 500,
      data: "2026-01-05",
    },
  });
  expect(memberEntrada.status()).toBe(403);

  const ownerMaterial = await request.post(`/api/obras/${obraA}/financeiro`, {
    data: {
      tipo: "saida",
      categoria: "material",
      descricao: materialDescription,
      valor: 250,
      data: "2026-01-06",
    },
  });
  expect(ownerMaterial.status(), await ownerMaterial.text()).toBe(201);

  const ownerFinance = await request.get(`/api/obras/${obraA}/financeiro`);
  expect(ownerFinance.status(), await ownerFinance.text()).toBe(200);
  const ownerFinanceDescriptions = (await ownerFinance.json() as {
    rows: Array<{ descricao: string }>;
  }).rows.map((row) => row.descricao);
  expect(ownerFinanceDescriptions).toEqual(expect.arrayContaining([laborDescription, materialDescription]));

  const memberFinance = await collaboratorRequest.get(`/api/obras/${obraA}/financeiro`);
  expect(memberFinance.status(), await memberFinance.text()).toBe(200);
  const memberFinanceDescriptions = (await memberFinance.json() as {
    rows: Array<{ descricao: string }>;
  }).rows.map((row) => row.descricao);
  expect(memberFinanceDescriptions).toContain(laborDescription);
  expect(memberFinanceDescriptions).not.toContain(materialDescription);
  const laborCannotChangeTotal = await collaboratorRequest.patch(`/api/obras/${obraA}`, {
    data: { valorTotal: "8000" },
  });
  expect(laborCannotChangeTotal.status()).toBe(403);
  const laborGeneralPatch = await collaboratorRequest.patch(`/api/obras/${obraA}`, {
    data: { nome: "XG31 A sem vazamento financeiro" },
  });
  expect(laborGeneralPatch.status(), await laborGeneralPatch.text()).toBe(200);
  const laborGeneralBody = await laborGeneralPatch.json() as Record<string, unknown>;
  expect(laborGeneralBody).not.toHaveProperty("valorTotal");
  expect(laborGeneralBody).not.toHaveProperty("valorPago");
  expect(laborGeneralBody).not.toHaveProperty("financeiro");
  expect(laborGeneralBody).not.toHaveProperty("progresso");
  expect(laborGeneralBody).not.toHaveProperty("fotoCapaFileId");

  // Cronograma não concede acesso implícito a valores das medições.
  const onlySchedule = await request.patch(`/api/xgestao/membros/${invited.row.id}`, {
    data: {
      papel: "colaborador",
      obras: [
        { obraId: obraA, permissao: "editar" },
        { obraId: obraC, permissao: "visualizar" },
      ],
      areasPermitidas: ["cronograma"],
      categoriasFinanceiroPermitidas: null,
    },
  });
  expect(onlySchedule.status(), await onlySchedule.text()).toBe(200);
  expect((await collaboratorRequest.get(`/api/obras/${obraA}/etapas`)).status()).toBe(200);
  const schedulePatch = await collaboratorRequest.patch(`/api/obras/${obraA}`, {
    data: { nome: "XG31 A só cronograma" },
  });
  expect(schedulePatch.status(), await schedulePatch.text()).toBe(200);
  expect(await schedulePatch.json()).not.toHaveProperty("valorTotal");
  const hiddenMeasurements = await collaboratorRequest.get("/api/empreiteiro/medicoes");
  expect(hiddenMeasurements.status(), await hiddenMeasurements.text()).toBe(200);
  expect((await hiddenMeasurements.json() as Array<{ obraId: string }>).some((row) => row.obraId === obraA)).toBe(false);
  expect((await collaboratorRequest.get(`/api/obras/${obraA}/medicoes`)).status()).toBe(403);
  const cannotCreateMeasurement = await collaboratorRequest.post("/api/empreiteiro/medicoes", {
    data: { obraId: obraA, etapa: "Medição restrita", percentual: 5, valor: 500 },
  });
  expect(cannotCreateMeasurement.status(), await cannotCreateMeasurement.text()).toBe(403);
  const noFinancialTimeline = await collaboratorRequest.get(`/api/atividades?obraId=${obraA}`);
  expect(noFinancialTimeline.status()).toBe(200);
  expect((await noFinancialTimeline.json() as { items: Array<{ tipo: string }> }).items
    .some((item) => item.tipo === "lancamento_criado")).toBe(false);

  // Limpa as restrições para que o restante deste teste continue cobrindo o
  // comportamento legado de membership sem áreas/categorias limitadas.
  const resetRestrictions = await request.patch(`/api/xgestao/membros/${invited.row.id}`, {
    data: {
      papel: "colaborador",
      obras: [
        { obraId: obraA, permissao: "editar" },
        { obraId: obraC, permissao: "visualizar" },
      ],
      areasPermitidas: null,
      categoriasFinanceiroPermitidas: null,
    },
  });
  expect(resetRestrictions.status(), await resetRestrictions.text()).toBe(200);

  // IDs de grant contaminados com obra de marketplace não podem expor dados
  // financeiros/medições. O dono, por outro lado, mantém os dois escopos.
  const [empresa] = await db
    .select({ id: empreiteiras.id })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, ownerId));
  const [otherActor] = await db.select({ id: users.id }).from(users).where(eq(users.email, SEED_ADMIN_EMAIL));
  const [clienteTeste] = await db
    .insert(clientes)
    .values({ nome: "Cliente XG31 escopo", email: uniqueEmail("xg31-marketplace-client"), userId: otherActor.id })
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
    const memberMarketplaceChat = await collaboratorRequest.post("/api/empreiteiro/chat/garantir-thread", {
      data: { obraId: obraMarketplace!.id },
    });
    expect(memberMarketplaceChat.status()).toBe(422);
    const ownerMarketplaceChat = await request.post("/api/empreiteiro/chat/garantir-thread", {
      data: { obraId: obraMarketplace!.id },
    });
    expect(ownerMarketplaceChat.status(), await ownerMarketplaceChat.text()).toBe(200);
    expect(await ownerMarketplaceChat.json()).toMatchObject({ threadId: expect.any(String) });
    const memberHealthWithMarketplace = await collaboratorRequest.get("/api/empreiteiro/obras-health");
    expect(memberHealthWithMarketplace.status(), await memberHealthWithMarketplace.text()).toBe(200);
    expect(Object.keys(await memberHealthWithMarketplace.json())).not.toContain(obraMarketplace!.id);
    const ownerHealthWithMarketplace = await request.get("/api/empreiteiro/obras-health");
    expect(ownerHealthWithMarketplace.status(), await ownerHealthWithMarketplace.text()).toBe(200);
    expect(Object.keys(await ownerHealthWithMarketplace.json())).toContain(obraMarketplace!.id);
    const memberStatsWithMarketplace = await collaboratorRequest.get("/api/empreiteiro/dashboard/stats");
    expect(memberStatsWithMarketplace.status()).toBe(200);
    expect(await memberStatsWithMarketplace.json()).toMatchObject({ obrasAtivas: 2 });
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
    await db.delete(chatThreads).where(eq(chatThreads.obraId, obraMarketplace!.id));
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
  const managerStats = await managerRequest.get("/api/empreiteiro/dashboard/stats");
  expect(managerStats.status(), await managerStats.text()).toBe(200);
  expect(await managerStats.json()).toMatchObject({ obrasAtivas: 4 });
  const managerCanEdit = await managerRequest.patch(`/api/obras/${obraC}`, {
    data: { nome: "XG31 C editada pelo gestor" },
  });
  expect(managerCanEdit.status(), await managerCanEdit.text()).toBe(200);
  const managerCannotManageMembers = await managerRequest.get("/api/xgestao/membros");
  expect(managerCannotManageMembers.status()).toBe(403);

  const managerRestricted = await request.patch(`/api/xgestao/membros/${managerId}`, {
    data: {
      papel: "gestor",
      obras: [],
      areasPermitidas: ["cronograma"],
      categoriasFinanceiroPermitidas: null,
    },
  });
  expect(managerRestricted.status(), await managerRestricted.text()).toBe(200);
  const managerRestrictedTimeline = await managerRequest.get(`/api/atividades?obraId=${obraA}`);
  expect(managerRestrictedTimeline.status(), await managerRestrictedTimeline.text()).toBe(200);
  const managerEventIds = (await managerRestrictedTimeline.json() as {
    items: Array<{ id: string }>;
  }).items.map((item) => item.id);
  expect(managerEventIds).not.toContain(managerEvent.id);
  const managerRestrictedMeasurements = await managerRequest.get("/api/empreiteiro/medicoes");
  expect(managerRestrictedMeasurements.status(), await managerRestrictedMeasurements.text()).toBe(200);
  expect((await managerRestrictedMeasurements.json() as Array<{ obraId: string }>)
    .some((row) => row.obraId === obraA)).toBe(false);

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
  const revokedStats = await collaboratorRequest.get("/api/empreiteiro/dashboard/stats");
  expect(revokedStats.status(), await revokedStats.text()).toBe(200);
  expect(await revokedStats.json()).toMatchObject({ obrasAtivas: 0, obrasConcluidas: 0, valorRecebido: 0 });
  const revokedHealth = await collaboratorRequest.get("/api/empreiteiro/obras-health");
  expect(revokedHealth.status(), await revokedHealth.text()).toBe(200);
  expect(await revokedHealth.json()).toEqual({});
  const revokedFinancial = await collaboratorRequest.get("/api/empreiteiro/dashboard/financial");
  expect(revokedFinancial.status(), await revokedFinancial.text()).toBe(200);
  expect(await revokedFinancial.json()).toMatchObject({ ticketMedio: 0, fluxoCaixa: [] });
  const revokedChat = await collaboratorRequest.post("/api/empreiteiro/chat/garantir-thread", {
    data: { obraId: obraA },
  });
  expect(revokedChat.status()).toBe(403);
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
