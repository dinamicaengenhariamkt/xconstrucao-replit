// Interação normal com o checkout sandbox. Não resolve/contorna reCAPTCHA,
// não usa cartão real e não chama diretamente APIs privadas do checkout.
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const arquivo = '.local/homologacao/xgestao-asaas-sandbox.json';
const evidencia = JSON.parse(await readFile(arquivo, 'utf8'));
const url = new URL(evidencia.checkoutUrl);
if (process.env.ASAAS_ENVIRONMENT !== 'sandbox' ||
    evidencia.ambiente !== 'sandbox' || url.hostname !== 'sandbox.asaas.com' ||
    url.protocol !== 'https:' || !evidencia.emailDescartavel.includes('asaas-sandbox')) {
  throw new Error('Somente checkout descartável do Asaas sandbox é permitido');
}
if (!process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
  throw new Error('Chromium fornecido pelo workspace ausente');
}
if (evidencia.tentativaPagamentoEm) {
  throw new Error('Pagamento já enviado; não repetir automaticamente');
}
evidencia.tentativaUIEm = new Date().toISOString();
await writeFile(arquivo, JSON.stringify(evidencia, null, 2));
const server = await chromium.launchServer({
  executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  args: process.argv.includes('--manter-sessao')
    ? ['--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9229']
    : [],
});
const browser = await chromium.connect(server.wsEndpoint());
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(20_000);
  await page.goto(url.href);
  // O Atlas expõe o placeholder no wrapper e no input; selecionar o input
  // evita ambiguidade, sem forçar clique ou interagir com campos ocultos.
  await page.locator('input[placeholder="Informe seu e-mail"]').fill(evidencia.emailDescartavel);
  await page.locator('input[placeholder="Informe seu nome completo"]').fill('Teste Homologacao Asaas');
  await page.locator('input[placeholder="Informe seu CPF ou CNPJ"]').fill('11222333000181');
  await page.locator('input[placeholder="Informe um celular"]').fill('11988880000');
  evidencia.tentativaIdentificacaoEm = new Date().toISOString();
  await writeFile(arquivo, JSON.stringify(evidencia, null, 2));
  await page.getByRole('button', { name: 'Avançar', exact: true }).first().click();
  await page.waitForTimeout(3_000);
  // Registrar a etapa antes de preencher endereço/cartão. Se a identificação
  // exigir verificação humana, a tentativa para aqui, sem novas estratégias.
  const texto = await page.locator('body').innerText();
  evidencia.resultadoIdentificacao = texto.includes('recaptcha') ||
    /verifica.*reCAPTCHA|token.*reCAPTCHA/i.test(texto) ? 'bloqueado_recaptcha' : 'identificacao_enviada';
  await writeFile(arquivo, JSON.stringify(evidencia, null, 2));
  await page.screenshot({ path: '.local/homologacao/asaas-identificacao.png', fullPage: true });
  console.log(texto.slice(0, 4_500));
  console.log('URL_ATUAL', page.url());
  if (process.argv.includes('--manter-sessao')) {
    // Endpoint privado local para continuar a mesma sessão de teste. Nunca
    // imprimir; .local não é relatório, memória ou artefato para publicação.
    await writeFile('.local/homologacao/browser-endpoint', server.wsEndpoint(), { mode: 0o600 });
    console.log('Sessão sandbox pronta para continuar a interação normal.');
    await new Promise(resolve => server.on('close', resolve));
  }
} finally {
  await server.close();
}