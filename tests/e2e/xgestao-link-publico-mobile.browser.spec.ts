import { expect, test, type APIRequestContext } from '@playwright/test';
import { deflateSync } from 'node:zlib';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, obras, obraShareLinks } from '@shared/db/schema';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

/**
 * E2E-04 — o link público no celular (390x844), do jeito que o cliente abre.
 *
 * Foto enviada ao cliente carrega pela URL assinada, a página não rola na
 * horizontal, o endereço sai sem número nem complemento (E2E-01) e, com a conta
 * vencida, o mesmo link mostra o aviso neutro. Não há login pela tela: a
 * página é pública, então o teste não gasta o limite de login por IP.
 */
const origemUI = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';

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
    for (let x = 0; x < largura; x++) pixels.set([22, 163, 74], y * (largura * 3 + 1) + 1 + x * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Sobe uma foto de verdade ao bucket (presign → PUT → commit) e a envia ao cliente. */
async function fotoEnviadaAoCliente(request: APIRequestContext, obraId: string) {
  const png = pngDeTeste();
  const nome = 'E2E-foto-link-mobile.png';
  const presign = await request.post('/api/uploads/presign', {
    data: { kind: 'obra_foto', filename: nome, mime: 'image/png', size: png.length, obraId },
  });
  expect(presign.status(), await presign.text()).toBe(200);
  const { uploadUrl, key, headers } = (await presign.json()) as {
    uploadUrl: string; key: string; headers: Record<string, string>;
  };
  const put = await request.put(uploadUrl, { data: png, headers });
  expect(put.status(), await put.text()).toBeLessThan(300);
  const commit = await request.post('/api/uploads/commit', {
    data: { kind: 'obra_foto', key, mime: 'image/png', size: png.length, originalName: nome, obraId },
  });
  expect(commit.status(), await commit.text()).toBe(200);
  const { id: fileId } = (await commit.json()) as { id: string };
  const foto = await request.post(`/api/obras/${obraId}/fotos`, { data: { fileId, enviadaAoContratante: true } });
  expect(foto.status(), await foto.text()).toBe(201);
}

test.describe('E2E-04 — link público no celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('foto assinada carrega, sem rolagem lateral, endereço sem número; conta vencida vê o aviso', async ({ page, request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'link-mobile');
    const criada = await request.post('/api/xgestao/obras', {
      data: { nome: 'E2E link no celular', endereco: 'Rua Augusta 1500 Bloco B', cidade: 'São Paulo', uf: 'SP' },
    });
    expect(criada.status(), await criada.text()).toBe(201);
    const { id: obraId } = (await criada.json()) as { id: string };
    try {
      await fotoEnviadaAoCliente(request, obraId);
      const emitido = await request.post(`/api/xgestao/obras/${obraId}/share`, {
        data: {
          nome: 'Cliente',
          secoes: {
            etapas: true, cronograma: true, fotos: true, pagamentos: false,
            diario: false, ocorrencias: false, tarefas: false, localizacao: true,
          },
        },
      });
      expect(emitido.status(), await emitido.text()).toBe(201);
      const { share } = (await emitido.json()) as { share: { path: string } };

      await page.goto(`${origemUI}${share.path}`);
      const shell = page.getByTestId('obra-publica-shell');
      await expect(shell).toBeVisible();
      await expect(shell).toContainText('Rua Augusta');
      await expect(shell).not.toContainText('1500');
      await expect(shell).not.toContainText(/Bloco/i);

      await page.getByRole('button', { name: 'Fotos', exact: true }).click();
      const imagem = page.getByTestId('card-fotos-j06').locator('img').first();
      await expect(imagem).toBeVisible();
      await expect.poll(
        () => imagem.evaluate((el) => (el as HTMLImageElement).naturalWidth),
        { timeout: 20_000 },
      ).toBeGreaterThan(0);

      const larguras = await page.evaluate(() => ({
        rolagem: document.documentElement.scrollWidth,
        janela: document.documentElement.clientWidth,
      }));
      expect(larguras.rolagem, 'sem rolagem horizontal').toBeLessThanOrEqual(larguras.janela);

      // Conta vencida: 24h + 1 min depois do fim do teste (XG43) vira somente leitura.
      await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 24 * 60 * 60_000 - 60_000) })
        .where(eq(assinaturas.userId, userId));
      await page.goto(`${origemUI}${share.path}`);
      await expect(page.getByTestId('obra-publica-indisponivel')).toBeVisible();
      await expect(page.getByText('Esta obra não está disponível no momento')).toBeVisible();
      await expect(page.getByTestId('obra-publica-shell')).toHaveCount(0);
      const vencida = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(vencida, 'aviso sem rolagem horizontal').toBe(true);
    } finally {
      await db.delete(obraShareLinks).where(eq(obraShareLinks.obraId, obraId));
      await db.delete(obras).where(eq(obras.id, obraId));
    }
  });
});
