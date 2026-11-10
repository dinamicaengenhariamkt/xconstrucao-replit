import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, auditLogs, userRoles, users, xgestaoEmailsEnviados } from '@shared/db/schema';
import { criarTokenDescadastro } from '@features/xgestao/marketing/lib/token-descadastro';
import { fetchCapturedEmails, loginAs, logout, SEED_ADMIN_EMAIL, uniqueEmail, uniqueUsername } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/**
 * XG52 (doc 52) — consentimento de marketing, descadastro, rotina diária de
 * e-mails e CSV do admin. Contas descartáveis; e-mails no modo de teste
 * (EMAIL_TEST_MODE=1) e Brevo no modo de teste (nada sai para a rede).
 */
const DIA_MS = 24 * 60 * 60_000;
const CRON_SECRET = process.env.E2E_CRON_SECRET ?? 'e2e-cron-secret-local';
const CRON = '/api/cron/xgestao-diario';

async function usuario(email: string) {
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  expect(u, email).toBeTruthy();
  return u;
}

async function cadastrar(request: APIRequestContext, dados: Record<string, unknown>) {
  const email = uniqueEmail('xg52-cadastro');
  const r = await request.post('/api/auth/register', {
    data: {
      name: 'E2E Marketing Cadastro',
      email,
      username: uniqueUsername('xg52'),
      password: 'Xconstr@E2E2026!',
      role: 'empreiteiro',
      acceptTerms: true,
      website: '',
      mountedAt: Date.now() - 5_000,
      ...dados,
    },
  });
  return { r, email };
}

async function rodarRotina(request: APIRequestContext, somenteUsuarios: string[]) {
  const r = await request.post(CRON, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
    data: { somenteUsuarios },
  });
  expect(r.status(), await r.text()).toBe(200);
  return r.json();
}

test.describe('XG52 — cadastro com e sem opt-in e telefone', () => {
  test('cadastro do xgestão grava o opt-in só quando marcado; telefone é opcional e validado', async ({ request }) => {
    const com = await cadastrar(request, { xgestao: true, marketingOptIn: true, phone: '(11) 98888-0000' });
    expect(com.r.status(), await com.r.text()).toBe(201);
    const uCom = await usuario(com.email);
    expect(uCom.marketingConsentimentoEm).toBeInstanceOf(Date);
    expect(uCom.marketingRevogadoEm).toBeNull();
    expect(uCom.marketingOrigem).toBe('cadastro');
    expect(uCom.phone).toBe('11988880000');
    const audit = await db.select().from(auditLogs)
      .where(and(eq(auditLogs.targetUserId, uCom.id), eq(auditLogs.action, 'xgestao.marketing.consentiu')));
    expect(audit).toHaveLength(1);

    const sem = await cadastrar(request, { xgestao: true });
    expect(sem.r.status(), await sem.r.text()).toBe(201);
    const uSem = await usuario(sem.email);
    expect(uSem.marketingConsentimentoEm).toBeNull();
    expect(uSem.marketingOrigem).toBeNull();
    expect(uSem.phone).toBeNull();

    // Fora do xgestão o opt-in não é gravado (o texto é do xgestão).
    const empreiteiro = await cadastrar(request, { marketingOptIn: true });
    expect(empreiteiro.r.status()).toBe(201);
    expect((await usuario(empreiteiro.email)).marketingConsentimentoEm).toBeNull();

    const telefoneRuim = await cadastrar(request, { xgestao: true, phone: '1234' });
    expect(telefoneRuim.r.status()).toBe(400);
    const corpo = await telefoneRuim.r.json();
    expect(corpo.errors.fieldErrors.phone?.[0]).toMatch(/DDD/);
    expect(await db.select({ id: users.id }).from(users).where(eq(users.email, telefoneRuim.email))).toHaveLength(0);
  });
});

test.describe('XG52 — configurações e descadastro', () => {
  test('liga e desliga nas configurações; descadastro por token sem login; token inválido 400', async ({ request }) => {
    const { email, userId } = await novoAssinanteHomologacao(request, 'xg52-config');
    const inicial = await request.get('/api/xgestao/marketing');
    expect(inicial.status()).toBe(200);
    expect(await inicial.json()).toMatchObject({ ativo: false, consentimentoEm: null });

    const ligar = await request.patch('/api/xgestao/marketing', { data: { aceitar: true } });
    expect(ligar.status(), await ligar.text()).toBe(200);
    expect(await ligar.json()).toMatchObject({ ativo: true, origem: 'configuracoes' });
    expect((await usuario(email)).marketingConsentimentoEm).toBeInstanceOf(Date);
    expect((await request.patch('/api/xgestao/marketing', { data: { aceitar: 'sim' } })).status()).toBe(400);

    await logout(request);
    expect((await request.get('/api/xgestao/marketing')).status()).toBe(401);

    // Sem login: só o POST com token válido tira da lista.
    expect((await request.post('/api/xgestao/descadastro?t=v1.invalido')).status()).toBe(400);
    expect((await request.post('/api/xgestao/descadastro')).status()).toBe(400);
    const token = criarTokenDescadastro(userId)!;
    expect(token).toBeTruthy();
    expect((await request.get(`/api/xgestao/descadastro?t=${encodeURIComponent(token)}`)).status()).toBe(405);
    expect((await usuario(email)).marketingRevogadoEm).toBeNull();

    const sair = await request.post(`/api/xgestao/descadastro?t=${encodeURIComponent(token)}`, {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: 'List-Unsubscribe=One-Click',
    });
    expect(sair.status(), await sair.text()).toBe(200);
    const depois = await usuario(email);
    expect(depois.marketingRevogadoEm).toBeInstanceOf(Date);
    expect(depois.marketingOrigem).toBe('descadastro');
    // Repetir não muda nada.
    expect((await request.post('/api/xgestao/descadastro', { data: { token } })).status()).toBe(200);
    expect((await usuario(email)).marketingRevogadoEm?.getTime()).toBe(depois.marketingRevogadoEm?.getTime());

    await loginAs(request, email);
    expect(await (await request.get('/api/xgestao/marketing')).json()).toMatchObject({ ativo: false, origem: 'descadastro' });
  });
});

test.describe('XG52 — rotina diária', () => {
  test('sem Bearer ou com segredo errado responde 401', async ({ request }) => {
    expect((await request.post(CRON)).status()).toBe(401);
    expect((await request.post(CRON, { headers: { Authorization: 'Bearer errado' } })).status()).toBe(401);
    expect((await request.post(CRON, { headers: { Authorization: CRON_SECRET } })).status()).toBe(401);
    expect((await request.get(CRON)).status()).toBe(405);
  });

  test('manda cada e-mail uma vez, respeita opt-in, deixa conta interna de fora e sincroniza o Brevo', async ({ request }) => {
    // A: teste acabando em ~2,5 dias (transacional, sem opt-in).
    const a = await novoAssinanteHomologacao(request, 'xg52-a');
    // B: aceitou marketing, entrou há 4 dias e não tem obra.
    const b = await novoAssinanteHomologacao(request, 'xg52-b');
    // C: igual a B, mas conta interna.
    const c = await novoAssinanteHomologacao(request, 'xg52-c');
    // D: igual a B, sem opt-in.
    const d = await novoAssinanteHomologacao(request, 'xg52-d');
    const ids = [a.userId, b.userId, c.userId, d.userId];

    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() + 2.5 * DIA_MS) })
      .where(and(eq(assinaturas.userId, a.userId), eq(assinaturas.persona, 'xgestao'), eq(assinaturas.status, 'ativa')));
    await db.update(users).set({ marketingConsentimentoEm: new Date(Date.now() - DIA_MS), marketingOrigem: 'configuracoes' })
      .where(inArray(users.id, [b.userId, c.userId]));
    await db.update(users).set({ contaInterna: true }).where(eq(users.id, c.userId));
    await db.update(userRoles).set({ criadoEm: new Date(Date.now() - 4 * DIA_MS) })
      .where(and(inArray(userRoles.userId, [b.userId, c.userId, d.userId]), eq(userRoles.role, 'xgestao')));

    const r1 = await rodarRotina(request, ids);
    expect(r1.ok, JSON.stringify(r1.jobs)).toBe(true);
    expect(r1.emails.contasAvaliadas).toBe(3); // C (interna) fica fora
    expect(r1.emails.porTipo).toEqual({ teste_acaba_3d: 1, sem_obra_3d: 1 });
    expect(r1.emails.enviados).toBe(2);
    expect(r1.emails.falhas).toBe(0);
    expect(r1.brevo).toMatchObject({ ok: true, modo: 'teste', enviados: 1, removidos: 0 });
    for (const job of ['mark-overdue', 'aviso-expiracao', 'testes-vencidos', 'trocas-vencidas', 'ajustes-troca']) {
      expect(r1.jobs[job]?.ok, job).toBe(true);
    }

    const emailsA = (await fetchCapturedEmails(request, a.email)).filter((e) => String(e.meta?.kind).startsWith('xgestao-'));
    expect(emailsA.map((e) => e.meta?.kind)).toEqual(['xgestao-teste_acaba_3d']);
    expect(emailsA[0].meta?.headers).toEqual({});
    expect(emailsA[0].html).not.toContain('descadastro');

    const emailsB = (await fetchCapturedEmails(request, b.email)).filter((e) => String(e.meta?.kind).startsWith('xgestao-'));
    expect(emailsB.map((e) => e.meta?.kind)).toEqual(['xgestao-sem_obra_3d']);
    const headers = emailsB[0].meta?.headers as Record<string, string>;
    expect(headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(headers['List-Unsubscribe']).toMatch(/\/api\/xgestao\/descadastro\?t=v1\./);
    const descadastroUrl = String(emailsB[0].meta?.descadastroUrl);
    expect(descadastroUrl).toMatch(/\/descadastro\?t=v1\./);
    expect(descadastroUrl).not.toContain(b.userId);
    expect(emailsB[0].html).toContain('Não quero mais receber');

    expect((await fetchCapturedEmails(request, c.email)).filter((e) => String(e.meta?.kind).startsWith('xgestao-'))).toHaveLength(0);
    expect((await fetchCapturedEmails(request, d.email)).filter((e) => String(e.meta?.kind).startsWith('xgestao-'))).toHaveLength(0);

    const linhas = await db.select().from(xgestaoEmailsEnviados).where(inArray(xgestaoEmailsEnviados.userId, ids));
    expect(linhas.map((l) => `${l.userId === a.userId ? 'A' : l.userId === b.userId ? 'B' : '?'}:${l.tipo}`).sort())
      .toEqual(['A:teste_acaba_3d', 'B:sem_obra_3d']);

    // Idempotência: a 2ª rodada no mesmo dia não manda nada de novo.
    const r2 = await rodarRotina(request, ids);
    expect(r2.emails.enviados).toBe(0);
    expect(r2.emails.jaEnviados).toBe(2);
    expect(await db.select().from(xgestaoEmailsEnviados).where(inArray(xgestaoEmailsEnviados.userId, ids))).toHaveLength(2);
    expect((await fetchCapturedEmails(request, b.email)).filter((e) => String(e.meta?.kind).startsWith('xgestao-'))).toHaveLength(1);

    // B sai pelo link do e-mail: a próxima rodada tira do Brevo e não manda marketing.
    const token = new URL(descadastroUrl).searchParams.get('t')!;
    expect((await request.post(`/api/xgestao/descadastro?t=${encodeURIComponent(token)}`)).status()).toBe(200);
    expect((await usuario(b.email)).marketingOrigem).toBe('descadastro');
    await db.delete(xgestaoEmailsEnviados).where(eq(xgestaoEmailsEnviados.userId, b.userId));
    const r3 = await rodarRotina(request, ids);
    expect(r3.emails.porTipo).toEqual({});
    expect(r3.brevo).toMatchObject({ ok: true, modo: 'teste', enviados: 0, removidos: 1 });
  });
});

test.describe('XG52 — CSV do admin com opt-in', () => {
  test('coluna de opt-in no CSV e filtro marketing=aceitou só com quem aceitou', async ({ request, playwright }) => {
    const sim = await novoAssinanteHomologacao(request, 'xg52-csv-sim');
    const nao = await novoAssinanteHomologacao(request, 'xg52-csv-nao');
    await db.update(users).set({ marketingConsentimentoEm: new Date(), marketingOrigem: 'cadastro' }).where(eq(users.id, sim.userId));

    const adminCtx = await playwright.request.newContext();
    await loginAs(adminCtx, SEED_ADMIN_EMAIL);
    const exportar = async (query: string) => {
      const r = await adminCtx.get(`/api/admin/xgestao/export?tipo=assinantes&${query}`);
      expect(r.status(), await r.text()).toBe(200);
      return r.text();
    };
    const todos = await exportar(`q=${encodeURIComponent('xg52-csv')}`);
    const cabecalho = todos.split('\r\n')[0];
    expect(cabecalho).toContain('Aceita e-mail de marketing;Consentimento em;Revogado em;Origem do consentimento');
    const linhaSim = todos.split('\r\n').find((l) => l.includes(sim.email))!;
    const linhaNao = todos.split('\r\n').find((l) => l.includes(nao.email))!;
    expect(linhaSim).toMatch(/;Sim;\d{2}\/\d{2}\/\d{4};;cadastro$/);
    expect(linhaNao).toMatch(/;Não;;;$/);

    const soQuemAceitou = await exportar(`marketing=aceitou&q=${encodeURIComponent('xg52-csv')}`);
    expect(soQuemAceitou).toContain(sim.email);
    expect(soQuemAceitou).not.toContain(nao.email);

    const lista = await adminCtx.get('/api/admin/xgestao/assinantes');
    expect(lista.status()).toBe(200);
    const { rows } = await lista.json() as { rows: Array<{ userId: string; marketing: { aceito: boolean } }> };
    expect(rows.find((x) => x.userId === sim.userId)?.marketing.aceito).toBe(true);
    expect(rows.find((x) => x.userId === nao.userId)?.marketing.aceito).toBe(false);
    await adminCtx.dispose();
  });
});

test.describe('XG52 — confirmação de cancelamento na hora', () => {
  test('cancelar manda a confirmação na hora, uma vez só; a rotina diária não reenvia', async ({ request }) => {
    test.setTimeout(150_000);
    const { userId, email } = await novoAssinanteHomologacao(request, 'xg52-cancel', { assinar: 'basic_plus' });
    const cancelar = await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao', motivo: 'preco_alto' } });
    expect(cancelar.status(), await cancelar.text()).toBe(200);

    const confirmacoes = async () => (await fetchCapturedEmails(request, email))
      .filter((e) => e.meta?.kind === 'xgestao-cancelamento_confirmado');
    await expect.poll(async () => (await confirmacoes()).length, { timeout: 20_000 }).toBe(1);
    const [msg] = await confirmacoes();
    expect(msg.html).not.toContain('descadastro');

    const linhas = await db.select().from(xgestaoEmailsEnviados).where(eq(xgestaoEmailsEnviados.userId, userId));
    expect(linhas.map((l) => l.tipo)).toEqual(['cancelamento_confirmado']);

    const r = await rodarRotina(request, [userId]);
    expect(r.emails.porTipo.cancelamento_confirmado ?? 0).toBe(0);
    expect(await confirmacoes()).toHaveLength(1);
  });
});
