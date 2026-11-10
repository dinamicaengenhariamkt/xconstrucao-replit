import { expect, test, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  assinaturas, financeiro, obraAnexos, obraDiario, obraEquipe, obraEtapas,
  obraFotos, obras, obraShareLinks, obraTarefas,
} from '@shared/db/schema';
import { fetchCapturedEmails, uniqueEmail } from './helpers';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

// O upload direto ao R2 deve partir da origem pública usada pelo usuário, não
// de um loopback que pode não estar permitido no CORS do bucket.
const origemUI = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';

async function entrarNaObra(page: Page, email: string, senha: string, obraId: string) {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (chave: string) {
      return chave.startsWith('xgestao-tour-') ? '1' : original.call(this, chave);
    };
  });
  await page.goto(`${origemUI}/login?perfil=xgestao&next=%2Fxgestao%2Fobras%2F${obraId}`);
  await page.getByTestId('input-email').fill(email);
  await page.getByTestId('input-password').fill(senha);
  await page.waitForTimeout(3500);
  const login = page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
  await page.getByTestId('button-login').click();
  expect((await login).status()).toBe(200);
  await expect(page.getByTestId('detalhes-obra-card')).toBeVisible();
  const legal = page.getByRole('dialog', { name: 'Atualizamos nossos documentos' });
  await legal.waitFor({ state: 'visible', timeout: 3000 }).catch(() => undefined);
  if (await legal.isVisible()) await legal.getByRole('button', { name: 'Agora não' }).click();
  const oferta = page.getByTestId('button-oferta-agora-nao');
  if (await oferta.isVisible().catch(() => false)) await oferta.click();
}

for (const tamanho of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test.describe(`XG41 — financeiro ${tamanho.width}`, () => {
    test.use({ viewport: tamanho });
    test('XG42 mostra a oferta nova e preserva leitura quando o teste vence', async ({ page, request }) => {
      const { email, userId } = await novoAssinanteHomologacao(request, `oferta-ui-${tamanho.width}`);
      const criada = await request.post('/api/xgestao/obras', {
        data: { nome: 'E2E obra preservada XG42', endereco: 'Rua de Teste, 42' },
      });
      expect(criada.status(), await criada.text()).toBe(201);
      const { id } = await criada.json();
      try {
        await page.goto(`${origemUI}/login?perfil=xgestao&next=%2Fxgestao%2Fconfiguracoes%3Ftab%3Dplano`);
        await page.getByTestId('input-email').fill(email);
        await page.getByTestId('input-password').fill('Xconstr@E2E2026!');
        await page.waitForTimeout(3500);
        const login = page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
        await page.getByTestId('button-login').click();
        expect((await login).status()).toBe(200);
        await page.waitForURL('**/xgestao/**');
        await page.goto(`${origemUI}/xgestao/planos`);
        await expect(page).toHaveURL(/\/xgestao\/configuracoes\?tab=plano$/);
        for (const [tier, valor] of [['basic', '99'], ['basic_plus', '179'], ['premium', '299']]) {
          await expect(page.getByTestId(`xgestao-plano-${tier}`)).toContainText(valor);
        }
        await expect(page.getByTestId('xgestao-planos-section')).not.toContainText('SINAPI');
        // XG43 — somente leitura só 24h após o fim do teste: venceu há 24h + 1 min.
        await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 24 * 60 * 60_000 - 60_000) })
          .where(eq(assinaturas.userId, userId));
        await page.goto(`${origemUI}/xgestao/obras`);
        const confirmar = page.getByTestId('button-continuar-free');
        await expect(confirmar).toBeVisible();
        await confirmar.click();
        await expect(confirmar).not.toBeVisible();
        await expect(page.getByText('E2E obra preservada XG42', { exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Nova obra', exact: true })).toBeDisabled();
        await page.goto(`${origemUI}/xgestao/configuracoes?tab=plano`);
        await expect(page.getByTestId('xgestao-planos-section')).toContainText('Somente leitura');
      } finally {
        await db.delete(obras).where(eq(obras.id, id));
      }
    });
    test('mostra reservas da equipe por empresa e libera convite revogado', async ({ page, request }) => {
      const { email } = await novoAssinanteHomologacao(request, `vagas-${tamanho.width}`);
      const convite = await request.post('/api/xgestao/membros', {
        data: {
          nome: 'Membro pendente XG41',
          email: `vaga-${tamanho.width}-${Date.now()}@teste.xconstrucao.com`,
          papel: 'colaborador',
          obras: [],
        },
      });
      expect(convite.status(), await convite.text()).toBe(201);
      const { row } = await convite.json();
      try {
        await page.goto(`${origemUI}/login?perfil=xgestao&next=%2Fxgestao%2Fequipe`);
        await page.getByTestId('input-email').fill(email);
        await page.getByTestId('input-password').fill('Xconstr@E2E2026!');
        await page.waitForTimeout(3500);
        const login = page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
        await page.getByTestId('button-login').click();
        expect((await login).status()).toBe(200);
        await page.waitForURL('**/xgestao/**');
        await page.goto(`${origemUI}/xgestao/equipe`);
        const uso = page.getByTestId('xgestao-equipe-vagas');
        await expect(uso).toBeVisible();
        await expect(uso).toContainText('2 vagas ocupadas');
        await expect(uso).toContainText('1 convites pendentes');
        await expect(uso).toContainText('Prestadores sem acesso ao sistema não ocupam vagas');
        expect((await request.delete(`/api/xgestao/membros/${row.id}`)).status()).toBe(200);
        await page.reload();
        await expect(uso).toContainText('1 vaga ocupada');
        await expect(uso).toContainText('0 convites pendentes');
      } finally {
        await request.delete(`/api/xgestao/membros/${row.id}`);
      }
    });
    test('XG42 área e orçamento digitados no formato brasileiro são os valores gravados', async ({ page, request }) => {
      const { email } = await novoAssinanteHomologacao(request, `informacoes-${tamanho.width}`);
      const criada = await request.post('/api/xgestao/obras', {
        data: { nome: `E2E XG42 informações ${tamanho.width}`, endereco: 'Rua de Teste, 42' },
      });
      expect(criada.status(), await criada.text()).toBe(201);
      const { id } = await criada.json();
      try {
        await entrarNaObra(page, email, 'Xconstr@E2E2026!', id);
        await page.getByTestId('detalhes-editar-informacoes').click();
        const dialog = page.getByRole('dialog', { name: 'Informações da obra' });
        await dialog.locator('#modal-obra-area').fill('abc');
        await dialog.getByRole('button', { name: 'Salvar', exact: true }).click();
        await expect(dialog).toBeVisible();
        await expect(page.getByText(/Informe a área/).first()).toBeVisible();
        expect((await (await request.get(`/api/obras/${id}`)).json()).areaM2).toBeNull();

        await dialog.locator('#modal-obra-area').fill('1.200,50');
        await dialog.locator('#modal-obra-valor').fill('2.345.678,90');
        const patch = page.waitForResponse(r => r.url().endsWith(`/api/obras/${id}`) && r.request().method() === 'PATCH');
        await dialog.getByRole('button', { name: 'Salvar', exact: true }).click();
        expect((await patch).status()).toBe(200);
        await expect(dialog).not.toBeVisible();
        expect(await (await request.get(`/api/obras/${id}`)).json()).toMatchObject({ areaM2: '1200.50', valorTotal: '2345678.90' });

        await page.reload();
        await expect(page.getByTestId('detalhes-obra-card')).toBeVisible();
        await page.getByRole('button', { name: 'Financeiro', exact: true }).click();
        await expect(page.getByTestId('valores-do-contrato')).toContainText('2.345.678,90');
      } finally {
        await db.delete(obras).where(eq(obras.id, id));
      }
    });
    test('XG42 Diário editável e sem SINAPI nem Tarefas nas telas do xgestão', async ({ page, request }) => {
      const { email } = await novoAssinanteHomologacao(request, `diario-${tamanho.width}`);
      const criada = await request.post('/api/xgestao/obras', {
        data: { nome: `E2E XG42 diário ${tamanho.width}`, endereco: 'Rua de Teste, 42' },
      });
      expect(criada.status(), await criada.text()).toBe(201);
      const { id } = await criada.json();
      const registro = await request.post(`/api/obras/${id}/diario`, { data: { texto: 'Concretagem da laje' } });
      expect(registro.status(), await registro.text()).toBe(201);
      const entrada = (await registro.json()).id;
      const link = await request.post(`/api/xgestao/obras/${id}/share`, { data: { nome: 'Cliente' } });
      expect(link.status(), await link.text()).toBe(201);
      try {
        await page.goto(`${origemUI}/xgestao-inteligente`);
        await expect(page.getByText('Link Público para o Cliente')).toBeVisible();
        await expect(page.locator('body')).not.toContainText('SINAPI');

        await entrarNaObra(page, email, 'Xconstr@E2E2026!', id);
        await page.getByRole('button', { name: /^Diário/ }).click();
        await page.getByTestId(`button-edit-diario-${entrada}`).click();
        const campo = page.getByTestId(`input-edit-diario-${entrada}`);
        await expect(campo).toHaveValue('Concretagem da laje');
        await campo.fill('x');
        await expect(page.getByTestId(`button-salvar-diario-${entrada}`)).toBeDisabled();
        await campo.fill('Concretagem da laje do térreo');
        const patch = page.waitForResponse(r => r.url().endsWith(`/diario/${entrada}`) && r.request().method() === 'PATCH');
        await page.getByTestId(`button-salvar-diario-${entrada}`).click();
        expect((await patch).status()).toBe(200);
        await expect(campo).toHaveCount(0);
        await page.reload();
        await expect(page.getByTestId('detalhes-obra-card')).toBeVisible();
        await page.getByRole('button', { name: /^Diário/ }).click();
        await expect(page.getByTestId(`diario-${entrada}`)).toContainText('Concretagem da laje do térreo');

        await page.getByRole('button', { name: /^Timeline/ }).click();
        await expect(page.getByRole('button', { name: /^Todos/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /^Tarefas/ })).toHaveCount(0);

        await page.getByRole('button', { name: /Gerenciar links/i }).first().click();
        await expect(page.locator('#secao-etapas')).toBeVisible();
        await expect(page.locator('#secao-tarefas')).toHaveCount(0);
        await page.keyboard.press('Escape');

        await page.goto(`${origemUI}/xgestao/configuracoes?tab=plano`);
        const planos = page.getByTestId('xgestao-planos-section');
        await expect(page.getByTestId('xgestao-plano-basic')).toContainText('Equipe: você + 1 convidado');
        await expect(page.getByTestId('xgestao-plano-basic_plus')).toContainText('Até 3 obras ativas');
        await expect(page.getByTestId('xgestao-plano-premium')).toContainText('Links públicos ilimitados por obra');
        await expect(planos).not.toContainText('SINAPI');
        await expect(planos).not.toContainText(/tarefa/i);
      } finally {
        await db.delete(obras).where(eq(obras.id, id));
      }
    });
    test('XG42 membro limitado salva as informações sem ver o valor nem apagar o contrato', async ({ page, request }) => {
      await novoAssinanteHomologacao(request, `restrito-${tamanho.width}`);
      const criada = await request.post('/api/xgestao/obras', {
        data: { nome: `E2E XG42 restrito ${tamanho.width}`, endereco: 'Rua de Teste, 42' },
      });
      expect(criada.status(), await criada.text()).toBe(201);
      const { id } = await criada.json();
      expect((await request.patch(`/api/obras/${id}`, { data: { valorTotal: '9000.00' } })).status()).toBe(200);
      const email = uniqueEmail(`xg42-restrito-${tamanho.width}`);
      const senha = 'Xconstr@E2E2026!';
      const convite = await request.post('/api/xgestao/membros', {
        data: {
          nome: 'Mão de obra', email, papel: 'colaborador',
          obras: [{ obraId: id, permissao: 'editar' }],
          categoriasFinanceiroPermitidas: ['mao_de_obra'],
        },
      });
      expect(convite.status(), await convite.text()).toBe(201);
      const capturados = await fetchCapturedEmails(request, email);
      const setupUrl = capturados.find((item) => item.meta?.kind === 'password-setup')?.meta?.setupUrl as string;
      const definir = await page.request.post('/api/auth/definir-senha-inicial', {
        data: { token: new URL(setupUrl).searchParams.get('token'), password: senha, confirmPassword: senha },
      });
      expect(definir.status(), await definir.text()).toBe(200);
      await page.context().clearCookies();
      try {
        await entrarNaObra(page, email, senha, id);
        await page.getByTestId('detalhes-editar-informacoes').click();
        const dialog = page.getByRole('dialog', { name: 'Informações da obra' });
        await expect(dialog.locator('#modal-obra-nome')).toBeVisible();
        await expect(dialog.locator('#modal-obra-valor')).toHaveCount(0);
        await dialog.locator('#modal-obra-tipo').fill('Reforma');
        const patch = page.waitForResponse(r => r.url().endsWith(`/api/obras/${id}`) && r.request().method() === 'PATCH');
        await dialog.getByRole('button', { name: 'Salvar', exact: true }).click();
        const resposta = await patch;
        expect(resposta.status(), await resposta.text()).toBe(200);
        expect(resposta.request().postDataJSON()).not.toHaveProperty('valorTotal');
        await expect(dialog).not.toBeVisible();
        await page.getByRole('button', { name: 'Financeiro', exact: true }).click();
        await expect(page.getByTestId('valores-do-contrato')).toHaveCount(0);
        expect(await (await request.get(`/api/obras/${id}`)).json()).toMatchObject({ tipo: 'Reforma', valorTotal: '9000.00' });
      } finally {
        await db.delete(obras).where(eq(obras.id, id));
      }
    });
    test('edita valor grande e conserva centavos no detalhe, dashboard e lista', async ({ page, request }) => {
      const { email } = await novoAssinanteHomologacao(request, `financeiro-${tamanho.width}`);
      const criada = await request.post('/api/xgestao/obras', {
        data: { nome: `E2E XG41 financeiro ${tamanho.width}`, endereco: 'Rua de Teste, 41' },
      });
      expect(criada.status(), await criada.text()).toBe(201);
      const { id } = await criada.json();
      const dispensar = async () => {
        const legal = page.getByRole('dialog', { name: 'Atualizamos nossos documentos' });
        if (await legal.isVisible().catch(() => false)) await legal.getByRole('button', { name: 'Agora não' }).click();
        const oferta = page.getByTestId('button-oferta-agora-nao');
        if (await oferta.isVisible().catch(() => false)) await oferta.click();
        if (await page.getByTestId('guided-tour').isVisible().catch(() => false)) {
          await page.getByRole('button', { name: 'Pular', exact: true }).click();
        }
      };
      try {
        await page.goto(`${origemUI}/login?perfil=xgestao&next=%2Fxgestao%2Fobras`);
        await page.getByTestId('input-email').fill(email);
        await page.getByTestId('input-password').fill('Xconstr@E2E2026!');
        await page.waitForTimeout(3500);
        const login = page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
        await page.getByTestId('button-login').click();
        expect((await login).status()).toBe(200);
        await page.waitForURL(/\/xgestao\//);
        // Carregar a lista ANTES da alteração é essencial para detectar cache velho.
        await page.goto(`${origemUI}/xgestao/dashboard`);
        const dashboard = page.getByTestId('xgestao-dashboard-page');
        await expect(dashboard).toBeVisible();
        await dispensar();
        // Link real do Next: mantém o mesmo QueryClient durante a navegação.
        await page.locator(`a[href="/xgestao/obras/${id}"]`).first().click();
        await expect(page.getByTestId('detalhes-obra-card')).toBeVisible();
        await dispensar();
        await page.getByRole('button', { name: 'Financeiro', exact: true }).click();
        const card = page.getByTestId('valores-do-contrato');
        await card.getByRole('button', { name: 'Editar informações', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: 'Editar valores do contrato' });
        await dialog.getByLabel('Valor contratado (R$)').fill('1.000.000,99');
        const patch = page.waitForResponse(r => r.url().endsWith(`/api/obras/${id}`) && r.request().method() === 'PATCH');
        await dialog.getByRole('button', { name: 'Salvar', exact: true }).click();
        expect((await patch).status()).toBe(200);
        await expect(dialog).not.toBeVisible();
        await expect(card).toContainText('1.000.000,99');
        await page.goBack();
        await expect(dashboard).toBeVisible();
        await dispensar();
        await expect(dashboard).toContainText('1.000.000,99');
        // O cache está atualizado novamente: esta segunda edição deve invalidá-lo
        // por meio do hook de LANÇAMENTOS, não pelo editor do contrato.
        await page.locator(`a[href="/xgestao/obras/${id}"]`).first().click();
        await expect(page.getByTestId('detalhes-obra-card')).toBeVisible();
        await dispensar();
        await page.getByRole('button', { name: 'Financeiro', exact: true }).click();
        await page.getByTestId('button-nova-saida').click();
        await page.getByTestId('select-categoria-lancamento').click();
        await page.getByRole('option', { name: /material/i }).click();
        await page.getByTestId('input-descricao-lancamento').fill('Material de teste XG41');
        await page.getByTestId('input-valor-lancamento').fill('47,89');
        const saida = page.waitForResponse(r => r.url().endsWith(`/api/obras/${id}/financeiro`) && r.request().method() === 'POST');
        await page.getByTestId('button-salvar-lancamento').click();
        expect((await saida).status()).toBe(201);
        await expect(page.getByTestId('input-valor-lancamento')).not.toBeVisible();
        await page.goBack();
        await expect(dashboard).toBeVisible();
        await dispensar();
        await expect(dashboard).toContainText('47,89');
        await page.getByRole('link', { name: 'Ver todas', exact: true }).click();
        await expect(page.getByTestId('xgestao-nova-obra')).toBeVisible();
        await dispensar();
        await expect(page.getByText(/1\.000\.000,99/).first()).toBeVisible();
        await page.locator(`a[href="/xgestao/obras/${id}"]`).first().click();
        await expect(page.getByTestId('detalhes-obra-card')).toBeVisible();
        await dispensar();
        await page.getByRole('button', { name: 'Financeiro', exact: true }).click();
        await expect(card).toContainText('1.000.000,99');
        await page.reload();
        await expect(page.getByTestId('detalhes-obra-card')).toBeVisible();
        await dispensar();
        await page.getByRole('button', { name: 'Financeiro', exact: true }).click();
        await expect(card).toContainText('1.000.000,99');
      } finally {
        // Apenas a obra que esta própria execução acabou de criar.
        await request.delete(`/api/obras/${id}`);
      }
    });
  });
}

// Arquivos pequenos reais, sem dados pessoais e sem simular o serviço de upload.
function pngDeTeste() {
  const chunk = (tipo: string, dados: Buffer) => {
    const payload = Buffer.concat([Buffer.from(tipo), dados]);
    let crc = 0xffffffff;
    for (const byte of payload) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    const cabecalho = Buffer.alloc(4);
    cabecalho.writeUInt32BE(dados.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([cabecalho, payload, checksum]);
  };
  const largura = 160;
  const altura = 100;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(largura);
  header.writeUInt32BE(altura, 4);
  header[8] = 8;
  header[9] = 2;
  const pixels = Buffer.alloc((largura * 3 + 1) * altura);
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const offset = y * (largura * 3 + 1) + 1 + x * 3;
      pixels.set([22, 163, 74], offset);
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0)),
  ]);
}
function pdfDeTeste() {
  const conteudo = 'BT /F1 12 Tf 20 100 Td (E2E Homologacao) Tj ET\n';
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(conteudo)} >>\nstream\n${conteudo}endstream`,
  ];
  let texto = '%PDF-1.4\n';
  const offsets = [0];
  objetos.forEach((objeto, index) => {
    offsets.push(Buffer.byteLength(texto));
    texto += `${index + 1} 0 obj\n${objeto}\nendobj\n`;
  });
  const xref = Buffer.byteLength(texto);
  texto += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}`;
  texto += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(texto);
}

for (const viewport of [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'celular', width: 390, height: 844 },
]) {
  test.describe(`AJ-07 — ${viewport.label}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    test('cria, envia capa/PDF, edita, recarrega e exclui somente a obra descartável', async ({ page, request }, testInfo) => {
      const { email } = await novoAssinanteHomologacao(request, viewport.label);
      let obraId: string | undefined;
      const nome = `E2E HOMOLOG UI ${viewport.label} ${Date.now()}`;
      const descricao = `Escopo E2E editado em ${viewport.label}`;
      const abrir = (path: string) => page.goto(`${origemUI}${path}`);
      const dispensar = async () => {
        const legal = page.getByRole('dialog', { name: 'Atualizamos nossos documentos' });
        if (await legal.isVisible().catch(() => false)) {
          await legal.getByRole('button', { name: 'Agora não' }).click();
        }
        const oferta = page.getByTestId('button-oferta-agora-nao');
        if (await oferta.isVisible().catch(() => false)) await oferta.click();
        if (await page.getByTestId('guided-tour').isVisible().catch(() => false)) {
          await page.getByRole('button', { name: 'Pular', exact: true }).click();
        }
      };
      try {
        // Login pela UI: não injeta cookies nem altera a proteção da aplicação.
        await abrir('/login?perfil=xgestao&next=%2Fxgestao%2Fobras');
        await page.getByTestId('input-email').fill(email);
        await page.getByTestId('input-password').fill('Xconstr@E2E2026!');
        // Respeita a janela anti-bot do formulário, assim como uma pessoa.
        await page.waitForTimeout(3_500);
        const entrar = page.waitForResponse((resposta) =>
          resposta.url().includes('/api/auth/login') && resposta.request().method() === 'POST');
        await page.getByTestId('button-login').click();
        expect((await entrar).status()).toBe(200);
        await page.waitForURL(/\/xgestao\//);
        await abrir('/xgestao/obras');
        await expect(page.getByTestId('xgestao-nova-obra')).toBeVisible();
        await dispensar();
        await page.getByTestId('xgestao-nova-obra').click();
        await page.getByTestId('xgestao-obra-nome').fill(nome);
        await page.getByTestId('xgestao-obra-endereco').fill('Rua da Homologação, 343');
        const criar = page.waitForResponse((resposta) =>
          resposta.url().endsWith('/api/xgestao/obras') && resposta.request().method() === 'POST');
        await page.getByRole('button', { name: 'Criar obra', exact: true }).click();
        const criada = await criar;
        expect(criada.status(), await criada.text()).toBe(201);
        obraId = (await criada.json()).id;
        await abrir(`/xgestao/obras/${obraId}`);
        await expect(page.getByTestId('detalhes-obra-card')).toBeVisible();
        await dispensar();

        await page.getByTestId('xgestao-trocar-capa').click();
        await page.getByTestId('xgestao-upload-capa-input').setInputFiles({
          name: 'E2E-capa-homologacao.png', mimeType: 'image/png', buffer: pngDeTeste(),
        });
        await expect(page.getByRole('button', { name: 'Remover capa', exact: true })).toBeVisible({ timeout: 60_000 });
        await page.keyboard.press('Escape');
        await page.getByTestId('detalhes-editar-informacoes').click();
        await page.locator('#modal-obra-descricao').fill(descricao);
        const editar = page.waitForResponse((resposta) =>
          resposta.url().includes(`/api/obras/${obraId}`) && resposta.request().method() === 'PATCH');
        await page.getByTestId('modal-salvar-informacoes').click();
        expect((await editar).status()).toBe(200);

        await page.getByRole('button', { name: 'Documentos', exact: true }).click();
        await page.getByRole('button', { name: 'Enviar Documento', exact: true }).first().click();
        const anexar = page.waitForResponse((resposta) =>
          resposta.url().includes(`/api/obras/${obraId}/anexos`) && resposta.request().method() === 'POST');
        await page.getByTestId('upload-documento-obra-input').setInputFiles({
          name: 'E2E-documento-homologacao.pdf', mimeType: 'application/pdf', buffer: pdfDeTeste(),
        });
        const anexo = await anexar;
        expect(anexo.status(), await anexo.text()).toBe(201);
        await page.keyboard.press('Escape');
        await page.reload();
        await dispensar();
        await page.getByRole('button', { name: 'Documentos', exact: true }).click();
        await expect(page.getByText('E2E-documento-homologacao.pdf', { exact: true }).first()).toBeVisible();
        await testInfo.attach(`documento-${viewport.label}`, {
          body: await page.screenshot({ fullPage: true }), contentType: 'image/png',
        });
        await abrir(`/xgestao/obras/${obraId}`);
        await dispensar();
        await expect(page.getByText(descricao, { exact: true })).toBeVisible();
        await page.getByTestId('xgestao-trocar-capa').click();
        await expect(page.getByRole('button', { name: 'Remover capa', exact: true })).toBeVisible();
        const imagem = page.getByTestId('xgestao-cover-preview');
        await expect.poll(() => imagem.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        await page.keyboard.press('Escape');
        await testInfo.attach(`obra-${viewport.label}`, {
          body: await page.screenshot({ fullPage: true }), contentType: 'image/png',
        });
        await page.getByTestId('detalhes-excluir-obra').click();
        await page.getByTestId('input-confirmar-exclusao').fill(nome);
        const excluir = page.waitForResponse((resposta) =>
          resposta.url().includes(`/api/obras/${obraId}`) && resposta.request().method() === 'DELETE');
        await page.getByTestId('button-confirmar-exclusao').click();
        expect((await excluir).status()).toBe(200);
        await expect(page).toHaveURL(/\/xgestao\/obras$/);
        await expect(page.getByText(nome, { exact: true })).toHaveCount(0);
        expect((await request.get(`/api/empreiteiro/minhas-obras/${obraId}`)).status()).toBe(404);
        expect(await db.select().from(obras).where(eq(obras.id, obraId!))).toHaveLength(0);
        for (const tabela of [
          obraAnexos, obraDiario, obraEquipe, obraEtapas,
          obraFotos, obraShareLinks, obraTarefas, financeiro,
        ]) {
          expect(await db.select().from(tabela).where(eq(tabela.obraId, obraId!)),
            `sem filhos órfãos em ${String(tabela)}`).toHaveLength(0);
        }
        await testInfo.attach('registro-descartavel', {
          body: JSON.stringify({ obraId, viewport: viewport.label, criadaPelaUI: true, excluidaPelaUI: true }),
          contentType: 'application/json',
        });
      } finally {
        // Limpeza em caso de falha é restrita ao ID criado acima e NÃO transforma
        // uma falha na exclusão interativa em teste aprovado.
        if (obraId) await request.delete(`/api/obras/${obraId}`);
      }
    });
  });
}