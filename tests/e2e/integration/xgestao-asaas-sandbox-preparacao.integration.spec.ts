import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

// Nunca executa por acidente na suíte manual. A preparação usa o servidor
// isolado/guardado; somente o checkout explícito usa o app público sandbox.
test('AJ-02 prepara conta nova e checkout Asaas sandbox, sem simular pagamento', async ({ request, playwright }) => {
  test.skip(process.env.XGESTAO_ASAAS_SANDBOX_HOMOLOGACAO !== '1',
    'Homologação externa exige opt-in separado da suíte comum');
  expect(process.env.ASAAS_ENVIRONMENT).toBe('sandbox');
  // A configuração do runner força manual também no processo dos specs.
  // Isso não muda o app público, cujo redirect abaixo precisa ser sandbox.
  expect(process.env.PAYMENT_GATEWAY).toBe('manual');
  expect(process.env.REPLIT_DEV_DOMAIN).toBeTruthy();
  const origem = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const { email, userId } = await novoAssinanteHomologacao(request, 'asaas-sandbox');
  const publico = await playwright.request.newContext({
    baseURL: origem,
    // Usa a CA do sistema via NODE_EXTRA_CA_CERTS, sem desativar TLS.
    ignoreHTTPSErrors: false,
  });
  try {
    const login = await publico.post('/api/auth/login', {
      data: { email, password: 'Xconstr@E2E2026!', mountedAt: Date.now() - 5_000, website: '' },
    });
    expect(login.status(), await login.text()).toBe(200);
    const teste = await publico.post('/api/xgestao/teste');
    expect(teste.status(), await teste.text()).toBe(201);
    const resposta = await publico.get('/api/planos?persona=xgestao');
    expect(resposta.status(), await resposta.text()).toBe(200);
    const catalogo = await resposta.json() as Array<{
      id: string; tier: string; nome: string; valorMensal: number | string;
    }>;
    const basic = catalogo.find(plano => plano.tier === 'pro');
    expect(basic, 'Basic comercial precisa existir no catálogo xgestão').toBeTruthy();
    expect(Number(basic!.valorMensal), 'Checkout Asaas exige item de ao menos R$ 5').toBeGreaterThanOrEqual(5);
    const checkout = await publico.post('/api/assinaturas/checkout', {
      data: { planoId: basic!.id, persona: 'xgestao', ciclo: 'mensal' },
    });
    expect(checkout.status(), await checkout.text()).toBe(200);
    const resultado = await checkout.json();
    expect(resultado.kind).toBe('redirect');
    const url = new URL(resultado.url);
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('sandbox.asaas.com');
    expect(url.searchParams.get('id')).toBeTruthy();
    const plano = await publico.get('/api/perfil/plano?persona=xgestao');
    expect(plano.status(), await plano.text()).toBe(200);
    const estado = await plano.json();
    expect(estado.teste.emTeste, 'Checkout não deve ativar uma assinatura antes do pagamento').toBe(true);
    const evidencia = {
      ambiente: 'sandbox', criadoEm: new Date().toISOString(),
      userId, emailDescartavel: email, planoId: basic!.id,
      planoComercial: 'Basic', ciclo: 'mensal', valor: Number(basic!.valorMensal),
      checkoutId: url.searchParams.get('id'), checkoutUrl: url.href,
      origem, pagamentoComprovado: false,
    };
    await mkdir('.local/homologacao', { recursive: true });
    await writeFile('.local/homologacao/xgestao-asaas-sandbox.json',
      JSON.stringify(evidencia, null, 2));
    console.log('Checkout sandbox preparado; pagamento externo ainda NÃO comprovado.');
  } finally {
    await publico.dispose();
  }
});