import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturaEventos, assinaturas, users } from '@shared/db/schema';
import { documentoDoUsuario } from '@features/xgestao/server/documento-antiabuso';
import { CNPJ_VALIDO, CPF_VALIDO, DOC_VALIDO_POR_ROLE, loginAs, logout, uniqueEmail, uniqueUsername } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/**
 * 10/11/2026 — CPF ou CNPJ obrigatório no 1º passo do wizard para a conta do
 * xgestão (docs/jornadas-xgestao/50-fluxo-pagamento-validacao.md).
 *
 * Servidor com gateway manual. Cada caso cria contas E2E novas.
 */
const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
const SENHA = 'Xconstr@E2E2026!';

/** CPF válido e único por execução (o de exemplo está em centenas de contas do dev). */
function cpfUnico(): string {
  const base = `8${Date.now().toString().slice(-8)}`;
  const digito = (d: string) => {
    const soma = [...d].reduce((t, n, i) => t + Number(n) * (d.length + 1 - i), 0);
    const r = (soma * 10) % 11;
    return String(r === 10 ? 0 : r);
  };
  const p = digito(base);
  return `${base}${p}${digito(base + p)}`;
}

/** CNPJ válido e único por execução. */
function cnpjUnico(): string {
  const base = `22${Date.now().toString().slice(-10)}`;
  const digito = (digits: string, pesos: number[]) => {
    const soma = [...digits].reduce((total, d, i) => total + Number(d) * pesos[i], 0);
    return String(soma % 11 < 2 ? 0 : 11 - (soma % 11));
  };
  const p = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${p}${digito(`${base}${p}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])}`;
}

async function registrar(
  request: APIRequestContext,
  role: 'contratante' | 'empreiteiro' | 'anunciante',
  opcoes: { xgestao?: boolean; cpfCnpj?: string } = {},
): Promise<{ email: string; userId: string }> {
  const email = uniqueEmail(`onbdoc-${role}${opcoes.xgestao ? '-xg' : ''}`);
  const r = await request.post('/api/auth/register', {
    data: {
      name: `E2E Onboarding Doc ${role}`,
      email,
      username: uniqueUsername('onbdoc'),
      password: SENHA,
      role,
      phone: '11966660000',
      ...(opcoes.cpfCnpj ? { cpfCnpj: opcoes.cpfCnpj } : {}),
      ...(opcoes.xgestao ? { xgestao: true } : {}),
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(r.status(), await r.text()).toBeLessThan(300);
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, u.id));
  await logout(request);
  await loginAs(request, email);
  return { email, userId: u.id };
}

async function flag(userId: string) {
  const [u] = await db.select({ v: users.onboardingConcluido }).from(users).where(eq(users.id, userId)).limit(1);
  return u?.v;
}

async function concluir(request: APIRequestContext) {
  return request.post('/api/onboarding/concluir');
}

async function salvarDocumento(request: APIRequestContext, documento: string) {
  return request.patch('/api/perfil/empreiteiro', { data: { cnpj: documento } });
}

/** Status do 1º acesso ao `/xgestao` sem seguir redirect. */
async function abrirXgestao(request: APIRequestContext) {
  const r = await request.get('/xgestao/dashboard', { maxRedirects: 0 });
  return { status: r.status(), location: r.headers()['location'] ?? '' };
}

async function limpar(...ids: string[]) {
  for (const id of ids) await db.delete(users).where(eq(users.id, id)).catch(() => {});
}

test.describe('Onboarding: CPF/CNPJ obrigatório para o xgestão', () => {
  test('xgestão sem documento: concluir dá 422 e o /xgestao manda para o wizard; CPF válido libera', async ({ request }) => {
    const { userId } = await registrar(request, 'empreiteiro', { xgestao: true });
    try {
      const me = await (await request.get('/api/auth/me')).json();
      expect(me.roles).toContain('xgestao');
      expect(me.onboardingConcluido).toBe(false);

      const semDoc = await concluir(request);
      expect(semDoc.status()).toBe(422);
      const corpo = await semDoc.json();
      expect(corpo.code).toBe('DOCUMENTO_OBRIGATORIO');
      expect(corpo.message).toContain('CPF ou CNPJ');
      expect(corpo.message).not.toContain('—');
      expect(await flag(userId)).toBe(false);

      // Abrir o /xgestao direto não começa o teste sem documento.
      const acesso = await abrirXgestao(request);
      expect([307, 308]).toContain(acesso.status);
      expect(acesso.location).toContain('/onboarding');
      expect(await db.select().from(assinaturas).where(eq(assinaturas.userId, userId))).toHaveLength(0);

      // Inválido é recusado e não grava.
      expect((await salvarDocumento(request, '52998224724')).status()).toBe(400);
      expect((await salvarDocumento(request, '123')).status()).toBe(400);
      expect(await documentoDoUsuario(userId)).toBeUndefined();
      expect((await concluir(request)).status()).toBe(422);

      // CPF válido: conta do xgestão aceita pessoa física.
      const cpf = cpfUnico();
      const salvo = await salvarDocumento(request, cpf);
      expect(salvo.status(), await salvo.text()).toBe(200);
      expect(await documentoDoUsuario(userId)).toBe(cpf);
      const ok = await concluir(request);
      expect(ok.status(), await ok.text()).toBe(200);
      expect(await flag(userId)).toBe(true);

      // 1º acesso: o teste começa com o documento gravado.
      const depois = await abrirXgestao(request);
      expect(depois.status).toBe(200);
      const [teste] = await db.select().from(assinaturas).where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')));
      expect(teste?.gatewayProvider).toBe('trial');
      expect(teste?.documentoFiscal).toBe(cpf);
    } finally {
      await limpar(userId);
    }
  });

  test('xgestão com CNPJ: aceito e conclui', async ({ request }) => {
    const { userId } = await registrar(request, 'empreiteiro', { xgestao: true });
    try {
      const cnpj = cnpjUnico();
      expect((await salvarDocumento(request, cnpj)).status()).toBe(200);
      expect(await documentoDoUsuario(userId)).toBe(cnpj);
      expect((await concluir(request)).status()).toBe(200);
    } finally {
      await limpar(userId);
    }
  });

  test('xgestão com documento vindo do cadastro conclui direto (pode pular)', async ({ request }) => {
    const { userId } = await registrar(request, 'empreiteiro', { xgestao: true, cpfCnpj: cnpjUnico() });
    try {
      expect((await concluir(request)).status()).toBe(200);
    } finally {
      await limpar(userId);
    }
  });

  test('contratante, anunciante e empreiteiro do marketplace concluem sem documento; empreiteiro segue só CNPJ', async ({ request }) => {
    const ids: string[] = [];
    try {
      for (const role of ['contratante', 'anunciante', 'empreiteiro'] as const) {
        const { userId } = await registrar(request, role);
        ids.push(userId);
        const r = await concluir(request);
        expect(r.status(), `${role}: ${await r.text()}`).toBe(200);
        expect(await flag(userId)).toBe(true);
      }
      // O último logado é o empreiteiro do marketplace: CPF continua recusado.
      expect((await salvarDocumento(request, CPF_VALIDO)).status()).toBe(400);
      expect((await salvarDocumento(request, CNPJ_VALIDO)).status()).toBe(200);
      expect(DOC_VALIDO_POR_ROLE.empreiteiro).toBe(CNPJ_VALIDO);
    } finally {
      await limpar(...ids);
    }
  });

  test('base antiga: xgestão que já concluiu o wizard sem documento não fica preso', async ({ request }) => {
    const { userId } = await registrar(request, 'empreiteiro', { xgestao: true });
    try {
      await db.update(users).set({ onboardingConcluido: true }).where(eq(users.id, userId));
      expect((await concluir(request)).status()).toBe(200);
      expect((await abrirXgestao(request)).status).toBe(200);
    } finally {
      await limpar(userId);
    }
  });

  test('Google: conta xgestão criada pelo OAuth também precisa do documento', async ({ request }) => {
    const email = `oauth-onbdoc-${Date.now()}-${Math.random().toString(36).slice(2)}@example.invalid`;
    try {
      const simulated = await request.post('/api/test/oauth-simulate', { data: { email, name: 'E2E OAuth xgestão' } });
      expect(simulated.ok()).toBeTruthy();
      const { user } = await simulated.json();
      await db.update(users).set({ role: 'empreiteiro' }).where(eq(users.id, user.id));
      const sessionCookie = simulated.headers()['set-cookie']?.split(';')[0];
      const converted = await request.post('/api/auth/oauth-convert', {
        headers: { cookie: `${sessionCookie}; x_signup_persona=xgestao` },
      });
      expect(converted.status(), await converted.text()).toBe(200);
      const cookie = converted.headersArray()
        .filter((h) => h.name.toLowerCase() === 'set-cookie')
        .map((h) => h.value.split(';')[0])
        .join('; ');
      const me = await (await request.get('/api/auth/me', { headers: { cookie } })).json();
      expect(me.roles).toContain('xgestao');
      expect(me.onboardingConcluido).toBe(false);
      const r = await request.post('/api/onboarding/concluir', { headers: { cookie } });
      expect(r.status()).toBe(422);
      const salvo = await request.patch('/api/perfil/empreiteiro', { headers: { cookie }, data: { cnpj: cpfUnico() } });
      expect(salvo.status(), await salvo.text()).toBe(200);
      expect((await request.post('/api/onboarding/concluir', { headers: { cookie } })).status()).toBe(200);
    } finally {
      await request.delete(`/api/test/oauth-simulate?email=${encodeURIComponent(email)}`);
    }
  });

  test('documento que já usou o teste em outra conta: a conta nova começa sem teste, com aviso amigável', async ({ request }) => {
    const a = await novoAssinanteHomologacao(request, 'onbdoc-docA');
    const docA = (await documentoDoUsuario(a.userId))!;
    expect(docA).toMatch(/^\d{11,14}$/);
    await logout(request);

    const { userId } = await registrar(request, 'empreiteiro', { xgestao: true });
    try {
      // Mesmo documento já cadastrado em outra conta: o sistema aceita como hoje.
      expect((await salvarDocumento(request, docA)).status()).toBe(200);
      expect((await concluir(request)).status()).toBe(200);
      for (let i = 0; i < 2; i++) expect((await abrirXgestao(request)).status).toBe(200);
      expect(await db.select().from(assinaturas).where(eq(assinaturas.userId, userId))).toHaveLength(0);
      const negados = await db.select().from(assinaturaEventos)
        .where(and(eq(assinaturaEventos.userId, userId), eq(assinaturaEventos.tipo, 'teste_negado')));
      expect(negados).toHaveLength(1);
      // Sem dado pessoal no histórico.
      expect(JSON.stringify(negados[0].payloadJson)).not.toContain(docA);

      const perfil = await request.get('/api/perfil/plano?persona=xgestao');
      expect(perfil.status()).toBe(200);
      const corpo = await perfil.json();
      expect(corpo.teste).toMatchObject({ elegivel: false, emTeste: false, testeNegadoPorDocumento: true });
      // Nada da outra conta vaza na resposta.
      const texto = JSON.stringify(corpo);
      expect(texto).not.toContain(a.email);
      expect(texto).not.toContain(a.userId);
    } finally {
      await limpar(userId);
    }
  });
});
