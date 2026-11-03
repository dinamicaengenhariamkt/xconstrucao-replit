import { expect, test } from '@playwright/test';
import { deflateSync } from 'node:zlib';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  financeiro, obraAnexos, obraDiario, obraEquipe, obraEtapas,
  obraFotos, obras, obraShareLinks, obraTarefas,
} from '@shared/db/schema';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

// O upload direto ao R2 deve partir da origem pública usada pelo usuário, não
// de um loopback que pode não estar permitido no CORS do bucket.
const origemUI = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';

for (const tamanho of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test.describe(`XG41 — financeiro ${tamanho.width}`, () => {
    test.use({ viewport: tamanho });
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