import { expect, test, type APIRequestContext } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { obraAnexos, userFiles, users } from '@shared/db/schema';
import {
  completarPerfilOperacional,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from '../helpers';

/**
 * XG10 — documentos da obra do xgestão.
 *
 * Cobre as três camadas que estavam quebradas: o dono não podia anexar
 * (`obra_anexo` só aceitava contratante), a lista não persistia, e o anexo
 * agora pode ser um link externo do Drive em vez de arquivo no bucket.
 */

const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
let cnpjSequence = 900;

function proximoCnpjValido() {
  const base = `11222333${String(cnpjSequence++).padStart(4, '0')}`;
  const digito = (digits: string, pesos: number[]) => {
    const soma = [...digits].reduce((total, digit, index) => total + Number(digit) * pesos[index], 0);
    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  };
  const primeiro = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digito(`${base}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${primeiro}${segundo}`;
}

async function registrar(request: APIRequestContext, label: string) {
  const email = uniqueEmail(label);
  const response = await request.post('/api/auth/register', {
    data: {
      name: 'empreiteiro E2E docs',
      email,
      username: uniqueUsername(label.replace(/[^a-zA-Z0-9_.]/g, '')),
      password: 'Xconstr@E2E2026!',
      role: 'empreiteiro',
      phone: '11988880000',
      cpfCnpj: proximoCnpjValido(),
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(response.status(), await response.text()).toBeLessThan(300);
  return email;
}

async function concederXGestao(request: APIRequestContext, email: string) {
  await loginAs(request, SEED_ADMIN_EMAIL);
  const usuarios = await request.get(`/api/admin/usuarios?q=${encodeURIComponent(email)}`);
  const payload = (await usuarios.json()) as { rows: Array<{ id: string }> };
  expect(payload.rows).toHaveLength(1);
  const response = await request.patch(`/api/admin/usuarios/${payload.rows[0].id}`, {
    data: { xgestao: true },
  });
  expect(response.status(), await response.text()).toBe(200);
  await logout(request);
}

async function criarAssinanteComObra(request: APIRequestContext, label: string) {
  const email = await registrar(request, label);
  await loginAs(request, email);
  await completarPerfilOperacional(request, 'empreiteiro');
  await logout(request);
  await concederXGestao(request, email);
  await loginAs(request, email);

  const criada = await request.post('/api/xgestao/obras', {
    data: { nome: `Obra E2E docs ${label}`, endereco: 'Rua dos Projetos, 70' },
  });
  expect(criada.status(), await criada.text()).toBe(201);
  const obra = (await criada.json()) as { id: string };

  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  return { email, obraId: obra.id, userId: u!.id };
}

/** Insere a linha de `user_files` direto: o teste não sobe nada ao R2. */
async function criarUserFileE2E(
  ownerUserId: string,
  tag: string,
  sizeBytes = 2048,
): Promise<string> {
  const key = `e2e/xg10-docs/${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [f] = await db
    .insert(userFiles)
    .values({
      ownerUserId,
      kind: 'obra_anexo',
      visibility: 'public',
      bucketKey: key,
      originalName: `E2E ${tag}.pdf`,
      mime: 'application/pdf',
      sizeBytes,
      publicUrl: `https://example-e2e.test/${key}`,
    })
    .returning({ id: userFiles.id });
  return f!.id;
}

test.describe('XG10 — documentos da obra', () => {
  test('o dono do xgestão anexa arquivo à própria obra e a lista persiste', async ({ request }) => {
    const { obraId, userId } = await criarAssinanteComObra(request, 'xg10-doc-arquivo');
    const fileId = await criarUserFileE2E(userId, 'projeto');

    // Antes de XG10 isto era 403: `obra_anexo` só aceitava contratante.
    const criado = await request.post(`/api/obras/${obraId}/anexos`, {
      data: { fileId, tipo: 'projeto_arquitetonico', observacao: 'Planta baixa revisada' },
    });
    expect(criado.status(), await criado.text()).toBe(201);
    const anexo = (await criado.json()) as { id: string };

    const linhas = await db.select().from(obraAnexos).where(eq(obraAnexos.obraId, obraId));
    expect(linhas, 'anexo persistido no banco').toHaveLength(1);
    expect(linhas[0].fileId).toBe(fileId);

    // A lista devolve a URL real — era ela que a UI descartava para abrir '#'.
    const lista = await request.get(`/api/obras/${obraId}/anexos`);
    expect(lista.status()).toBe(200);
    const rows = (await lista.json()) as Array<{ id: string; url: string | null; mime: string | null }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].url, 'anexo tem endereço para abrir').toBeTruthy();
    expect(rows[0].mime, 'mime alimenta o preview').toBe('application/pdf');

    // E chega ao detalhe da obra, que é o que a aba Documentos renderiza.
    const detalhe = await request.get(`/api/empreiteiro/minhas-obras/${obraId}`);
    const documentos = (await detalhe.json()).documentos as Array<{ id: string; url?: string }>;
    expect(documentos).toHaveLength(1);
    expect(documentos[0].url).toBeTruthy();

    const excluido = await request.delete(`/api/obras/${obraId}/anexos/${anexo.id}`);
    expect(excluido.status(), await excluido.text()).toBe(200);
    const apos = await db.select().from(obraAnexos).where(eq(obraAnexos.obraId, obraId));
    expect(apos, 'exclusão persiste').toHaveLength(0);

    await logout(request);
  });

  test('anexo pode ser um link externo (projeto no Drive)', async ({ request }) => {
    const { obraId } = await criarAssinanteComObra(request, 'xg10-doc-link');

    const criado = await request.post(`/api/obras/${obraId}/anexos`, {
      data: {
        linkUrl: 'https://drive.google.com/file/d/abc123/view',
        titulo: 'Projeto arquitetônico (Drive)',
        tipo: 'projeto_arquitetonico',
      },
    });
    expect(criado.status(), await criado.text()).toBe(201);
    const anexo = (await criado.json()) as { id: string };

    const [linha] = await db.select().from(obraAnexos).where(eq(obraAnexos.id, anexo.id));
    expect(linha.linkUrl).toBe('https://drive.google.com/file/d/abc123/view');
    expect(linha.fileId, 'link não tem arquivo no bucket').toBeNull();

    const lista = await request.get(`/api/obras/${obraId}/anexos`);
    const rows = (await lista.json()) as Array<{ url: string | null; linkUrl: string | null }>;
    expect(rows[0].url, 'url do link é o próprio endereço').toBe(
      'https://drive.google.com/file/d/abc123/view',
    );

    const detalhe = await request.get(`/api/empreiteiro/minhas-obras/${obraId}`);
    const documentos = (await detalhe.json()).documentos as Array<{
      nome: string;
      isLink?: boolean;
    }>;
    expect(documentos[0].nome, 'usa o título dado ao link').toBe('Projeto arquitetônico (Drive)');
    expect(documentos[0].isLink, 'a UI sabe que é link').toBe(true);

    // Excluir link não deve tentar apagar arquivo nenhum.
    const excluido = await request.delete(`/api/obras/${obraId}/anexos/${anexo.id}`);
    expect(excluido.status(), await excluido.text()).toBe(200);

    await logout(request);
  });

  test('valida a origem do anexo: nem os dois, nem nenhum, nem link perigoso', async ({ request }) => {
    const { obraId, userId } = await criarAssinanteComObra(request, 'xg10-doc-validacao');
    const fileId = await criarUserFileE2E(userId, 'validacao');

    const nenhum = await request.post(`/api/obras/${obraId}/anexos`, {
      data: { tipo: 'outros' },
    });
    expect(nenhum.status(), 'sem arquivo nem link → 400').toBe(400);

    const ambos = await request.post(`/api/obras/${obraId}/anexos`, {
      data: { fileId, linkUrl: 'https://exemplo.com/x', titulo: 'X', tipo: 'outros' },
    });
    expect(ambos.status(), 'arquivo E link → 400').toBe(400);

    const semTitulo = await request.post(`/api/obras/${obraId}/anexos`, {
      data: { linkUrl: 'https://exemplo.com/x', tipo: 'outros' },
    });
    expect(semTitulo.status(), 'link sem nome → 400').toBe(400);

    // `javascript:` viraria XSS ao clicar no link da lista.
    const perigoso = await request.post(`/api/obras/${obraId}/anexos`, {
      data: { linkUrl: 'javascript:alert(1)', titulo: 'Malicioso', tipo: 'outros' },
    });
    expect(perigoso.status(), 'esquema não-http → 400').toBe(400);

    const naoGravou = await db.select().from(obraAnexos).where(eq(obraAnexos.obraId, obraId));
    expect(naoGravou, 'nenhum payload inválido entrou').toHaveLength(0);

    await logout(request);
  });

  test('authz: sem sessão → 401; obra de outro assinante → 404', async ({ request }) => {
    const dono = await criarAssinanteComObra(request, 'xg10-doc-dono');
    await logout(request);

    const semSessao = await request.post(`/api/obras/${dono.obraId}/anexos`, {
      data: { linkUrl: 'https://exemplo.com/a', titulo: 'A', tipo: 'outros' },
    });
    expect(semSessao.status(), 'sem sessão → 401').toBe(401);

    await criarAssinanteComObra(request, 'xg10-doc-intruso');
    const idor = await request.post(`/api/obras/${dono.obraId}/anexos`, {
      data: { linkUrl: 'https://exemplo.com/idor', titulo: 'IDOR', tipo: 'outros' },
    });
    expect(idor.status(), 'obra alheia → 404').toBe(404);

    const leitura = await request.get(`/api/obras/${dono.obraId}/anexos`);
    expect(leitura.status(), 'leitura de obra alheia → 404').toBe(404);

    await logout(request);
  });
});

test.describe('XG10 — armazenamento da obra', () => {
  test('consumo reflete os arquivos anexados', async ({ request }) => {
    const { obraId, userId } = await criarAssinanteComObra(request, 'xg10-storage-uso');

    const vazio = await request.get(`/api/obras/${obraId}/storage`);
    expect(vazio.status(), await vazio.text()).toBe(200);
    const inicial = (await vazio.json()) as {
      usadoBytes: number;
      limiteBytes: number;
      arquivos: number;
      percentual: number;
    };
    expect(inicial.usadoBytes, 'obra nova não usa nada').toBe(0);
    expect(inicial.limiteBytes, '200 MB por obra').toBe(200_000_000);
    expect(inicial.percentual).toBe(0);

    // 20 MB anexados: a barra passa a marcar 10%.
    const fileId = await criarUserFileE2E(userId, 'pesado', 20_000_000);
    const vinculado = await request.post(`/api/obras/${obraId}/anexos`, {
      data: { fileId, tipo: 'projeto_arquitetonico' },
    });
    expect(vinculado.status(), await vinculado.text()).toBe(201);
    const anexo = (await vinculado.json()) as { id: string };

    const usado = await request.get(`/api/obras/${obraId}/storage`);
    const depois = (await usado.json()) as {
      usadoBytes: number;
      arquivos: number;
      percentual: number;
      disponivelBytes: number;
    };
    expect(depois.usadoBytes).toBe(20_000_000);
    expect(depois.arquivos).toBe(1);
    expect(depois.percentual, '20 de 200 MB = 10%').toBe(10);
    expect(depois.disponivelBytes).toBe(180_000_000);

    // Excluir devolve o espaço (soft delete tira o arquivo da conta).
    await request.delete(`/api/obras/${obraId}/anexos/${anexo.id}`);
    const apos = await request.get(`/api/obras/${obraId}/storage`);
    expect((await apos.json()).usadoBytes, 'espaço liberado').toBe(0);

    await logout(request);
  });

  test('upload que estoura a quota da obra → 413', async ({ request }) => {
    const { obraId, userId } = await criarAssinanteComObra(request, 'xg10-storage-quota');

    // Enche a obra até 190 MB.
    const fileId = await criarUserFileE2E(userId, 'quase-cheio', 190_000_000);
    await request.post(`/api/obras/${obraId}/anexos`, {
      data: { fileId, tipo: 'outros' },
    });

    // Um vídeo de 50 MB não cabe nos 10 MB restantes — barrado ANTES do
    // upload, para o usuário não gastar banda à toa.
    const presign = await request.post('/api/uploads/presign', {
      data: {
        kind: 'obra_anexo',
        mime: 'video/mp4',
        size: 50_000_000,
        filename: 'timelapse.mp4',
        obraId,
      },
    });
    expect(presign.status(), 'quota estourada → 413').toBe(413);
    const corpo = (await presign.json()) as { error: string; uso: { usadoBytes: number } };
    expect(corpo.error).toBe('QUOTA_EXCEDIDA');
    expect(corpo.uso.usadoBytes, 'a resposta informa o consumo atual').toBe(190_000_000);

    // O que cabe, passa.
    const cabe = await request.post('/api/uploads/presign', {
      data: {
        kind: 'obra_anexo',
        mime: 'application/pdf',
        size: 5_000_000,
        filename: 'memorial.pdf',
        obraId,
      },
    });
    expect(cabe.status(), '5 MB cabem nos 10 MB livres').toBe(200);

    await logout(request);
  });

  test('presign recusa tipo acima do teto da família e obra alheia', async ({ request }) => {
    const dono = await criarAssinanteComObra(request, 'xg10-storage-tipos');

    // Imagem de 12 MB: o kind aceita até 50 (por causa do vídeo), mas imagem
    // tem teto de 10.
    const imagemGrande = await request.post('/api/uploads/presign', {
      data: {
        kind: 'obra_anexo',
        mime: 'image/png',
        size: 12_000_000,
        filename: 'planta.png',
        obraId: dono.obraId,
      },
    });
    expect(imagemGrande.status(), 'imagem acima de 10 MB → 400').toBe(400);

    // DWG agora é aceito — antes o formato era recusado de saída.
    const dwg = await request.post('/api/uploads/presign', {
      data: {
        kind: 'obra_anexo',
        mime: 'image/vnd.dwg',
        size: 15_000_000,
        filename: 'estrutural.dwg',
        obraId: dono.obraId,
      },
    });
    expect(dwg.status(), 'DWG de 15 MB é aceito').toBe(200);

    await logout(request);

    // Quota de obra alheia não pode ser sondada por um terceiro.
    await criarAssinanteComObra(request, 'xg10-storage-intruso');
    const idor = await request.get(`/api/obras/${dono.obraId}/storage`);
    expect(idor.status(), 'storage de obra alheia → 404').toBe(404);

    await logout(request);
  });
});
