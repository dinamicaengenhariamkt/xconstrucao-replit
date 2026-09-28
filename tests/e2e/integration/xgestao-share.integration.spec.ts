import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  completarPerfilOperacional,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from '../helpers';

const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
let cnpjSequence = 1;

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

async function registrarEmpreiteiro(request: APIRequestContext, label: string) {
  const email = uniqueEmail(label);
  const response = await request.post('/api/auth/register', {
    data: {
      name: `Empreiteiro ${label}`,
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
  return payload.rows[0].id;
}

function tokenFromPath(path: string) {
  const token = path.split('/').pop() ?? '';
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  return token;
}

test.describe('xgestão — link público de obra', () => {
  test('emite, reexibe, limita, expira, revoga e invalida links de obra própria', async ({ request }) => {
    const ownerEmail = await registrarEmpreiteiro(request, 'xgestao-share-owner');
    await loginAs(request, ownerEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    const ownerId = await concederXGestao(request, ownerEmail);
    await loginAs(request, ownerEmail);

    const obraResponse = await request.post('/api/xgestao/obras', {
      data: {
        nome: 'Obra pública E2E',
        endereco: 'Rua que não deve aparecer, 123',
        cidade: 'São Paulo',
        uf: 'SP',
      },
    });
    expect(obraResponse.status(), await obraResponse.text()).toBe(201);
    const obra = (await obraResponse.json()) as { id: string };
    const detalhes = await request.patch(`/api/obras/${obra.id}`, {
      data: {
        tipo: 'Reforma residencial',
        descricao: 'Modernização dos ambientes e instalações.',
        areaM2: '84.5',
        valorTotal: '987654.32',
        dataInicio: '2026-09-10',
        dataPrevisao: '2027-02-20',
        status: 'em_andamento',
      },
    });
    expect(detalhes.status(), await detalhes.text()).toBe(200);

    // XG23 — a medição continua aqui porque alimenta a data de "última
    // atualização" e o histórico, mas já não move o progresso da obra própria:
    // desde que a aba Atualizações saiu, o avanço é digitado por etapa.
    const avanco = await request.post('/api/empreiteiro/medicoes', {
      data: {
        obraId: obra.id,
        etapa: 'Avanço E2E',
        descricao: 'Registro de avanço para o link público.',
        percentual: 35,
        valor: 0,
      },
    });
    expect(avanco.status(), await avanco.text()).toBe(201);

    const privateFileResponse = await request.post('/api/test/file-setup', {
      data: {
        email: ownerEmail,
        kind: 'obra_foto',
        originalName: 'capa-privada-e2e.jpg',
        mime: 'image/jpeg',
      },
    });
    expect(privateFileResponse.status(), await privateFileResponse.text()).toBe(200);
    const privateFile = (await privateFileResponse.json()) as { fileId: string; key: string };
    const privatePhoto = await request.post(`/api/obras/${obra.id}/fotos`, {
      data: { fileId: privateFile.fileId, enviadaAoContratante: false },
    });
    expect(privatePhoto.status(), await privatePhoto.text()).toBe(201);
    const privateCover = await request.patch(`/api/obras/${obra.id}`, {
      data: { fotoCapaFileId: privateFile.fileId },
    });
    expect(privateCover.status(), await privateCover.text()).toBe(200);

    const etapa = await request.post(`/api/obras/${obra.id}/etapas`, {
      data: { nome: 'Fundação E2E', descricao: 'Preparação controlada' },
    });
    expect(etapa.status(), await etapa.text()).toBe(201);
    const ocorrencia = await request.post(`/api/obras/${obra.id}/ocorrencias`, {
      data: { titulo: 'Vistoria E2E', descricao: 'Acompanhamento da execução', gravidade: 'baixo' },
    });
    expect(ocorrencia.status(), await ocorrencia.text()).toBe(201);

    const criada = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: {} });
    expect(criada.status(), await criada.text()).toBe(201);
    const first = (await criada.json()) as { share: { id: string; nome: string; path: string } };
    expect(first.share.path).toMatch(/^\/publico\/obra\/[A-Za-z0-9_-]{43}$/);
    // XG30 — sem nome, o link vira "Cliente", como os emitidos antes da coluna.
    expect(first.share.nome).toBe('Cliente');
    tokenFromPath(first.share.path);

    const reexibida = await request.get(`/api/xgestao/obras/${obra.id}/share`);
    expect(reexibida.status()).toBe(200);
    expect(await reexibida.json()).toMatchObject({ shares: [{ id: first.share.id, path: first.share.path }] });

    // Ocorrências não saem por padrão: o link nasce sem o conteúdo operacional
    // interno, e é o dono quem decide publicá-lo.
    await logout(request);
    const semOcorrencias = await request.get(first.share.path);
    expect(semOcorrencias.status()).toBe(200);
    expect(await semOcorrencias.text()).not.toContain('Vistoria E2E');

    await loginAs(request, ownerEmail);
    const liberada = await request.patch(`/api/xgestao/obras/${obra.id}/share/${first.share.id}`, {
      data: {
        secoes: {
          etapas: true,
          cronograma: true,
          fotos: true,
          pagamentos: false,
          diario: true,
          ocorrencias: true,
          tarefas: true,
          localizacao: false,
        },
      },
    });
    expect(liberada.status(), await liberada.text()).toBe(200);
    // Alterar o que o link mostra não pode trocar o endereço já enviado.
    expect(await liberada.json()).toMatchObject({ share: { path: first.share.path } });

    await logout(request);
    const publica = await request.get(first.share.path);
    expect(publica.status(), await publica.text()).toBe(200);
    const html = await publica.text();
    expect(html).toContain('Obra pública E2E');
    expect(html).toContain('Fundação E2E');
    expect(html).toContain('Vistoria E2E');
    expect(html).toContain('Reforma residencial');
    expect(html).toContain('Modernização dos ambientes e instalações.');
    expect(html).toContain('84,5 m²');
    expect(html).toContain('10/09/2026');
    expect(html).toContain('20/02/2027');
    /*
     * XG23 — a barra de "Progresso geral" saiu da página pública.
     *
     * Ela lia `obras.progresso`, alimentado pelas atualizações; com elas fora
     * da obra própria a coluna ficou sem escritor e o número congelaria. O
     * avanço passou a viver nas etapas, cada uma com o percentual digitado, e
     * é isso que o cliente final lê agora.
     *
     * A asserção inverte: o consolidado não pode reaparecer sem que alguém
     * volte a alimentá-lo.
     */
    expect(html).not.toContain('Progresso geral');
    expect(html).not.toContain(privateFile.key);
    // O badge de status precisa sair traduzido. Antes o dicionário aplicado era
    // o do status derivado da UI, e o valor do banco vazava cru para o cliente.
    expect(html).toContain('Em andamento');
    expect(html).not.toContain('>em_andamento<');
    expect(html).toMatch(/noindex/i);
    expect(publica.headers()['cache-control'] ?? '').toMatch(/no-store|no-cache/i);
    for (const proibido of [
      // Valores reais são a asserção útil aqui: o HTML de desenvolvimento do
      // Next inclui código de runtime com palavras genéricas como "email".
      'Rua que não deve aparecer', '987654.32', 'clienteId', 'empreiteiraId',
    ]) {
      expect(html).not.toContain(proibido);
    }

    await loginAs(request, ownerEmail);
    const publicFileResponse = await request.post('/api/test/file-setup', {
      data: {
        email: ownerEmail,
        kind: 'obra_foto',
        originalName: 'capa-aprovada-e2e.jpg',
        mime: 'image/jpeg',
      },
    });
    expect(publicFileResponse.status(), await publicFileResponse.text()).toBe(200);
    const publicFile = (await publicFileResponse.json()) as { fileId: string; key: string };
    const publicPhoto = await request.post(`/api/obras/${obra.id}/fotos`, {
      data: { fileId: publicFile.fileId, enviadaAoContratante: true },
    });
    expect(publicPhoto.status(), await publicPhoto.text()).toBe(201);
    const publicCover = await request.patch(`/api/obras/${obra.id}`, {
      data: { fotoCapaFileId: publicFile.fileId },
    });
    expect(publicCover.status(), await publicCover.text()).toBe(200);
    await logout(request);
    const publicaComCapaAprovada = await request.get(first.share.path);
    expect(publicaComCapaAprovada.status(), await publicaComCapaAprovada.text()).toBe(200);
    expect(await publicaComCapaAprovada.text()).toContain(publicFile.key);

    const invalido = await request.get('/publico/obra/token-invalido');
    expect(invalido.status()).toBe(404);

    // Outra empresa não pode listar endereços, criar nem revogar links da obra.
    const otherEmail = await registrarEmpreiteiro(request, 'xgestao-share-other');
    await loginAs(request, otherEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    await concederXGestao(request, otherEmail);
    await loginAs(request, otherEmail);
    const outroGet = await request.get(`/api/xgestao/obras/${obra.id}/share`);
    const outroPost = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: {} });
    const outroDelete = await request.delete(`/api/xgestao/obras/${obra.id}/share/${first.share.id}`);
    expect(outroGet.status()).toBe(404);
    expect(await outroGet.text()).not.toContain(tokenFromPath(first.share.path));
    expect(outroPost.status()).toBe(404);
    expect(outroDelete.status()).toBe(404);
    await logout(request);

    // XG30 — criar outro link não revoga o anterior: cada público tem o seu.
    await loginAs(request, ownerEmail);
    const segundoLink = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: { nome: 'Arquiteto' } });
    expect(segundoLink.status()).toBe(201);
    const second = (await segundoLink.json()) as { share: { path: string } };
    expect(second.share.path).not.toBe(first.share.path);
    await logout(request);
    expect((await request.get(first.share.path)).status()).toBe(200);
    expect((await request.get(second.share.path)).status()).toBe(200);

    // Expiração é indistinguível de um token inexistente.
    await loginAs(request, ownerEmail);
    const expirada = await request.post(`/api/xgestao/obras/${obra.id}/share`, {
      data: { expiraEm: new Date(Date.now() - 60_000).toISOString() },
    });
    expect(expirada.status()).toBe(201);
    const expiredPath = ((await expirada.json()) as { share: { path: string } }).share.path;
    await logout(request);
    expect((await request.get(expiredPath)).status()).toBe(404);

    // Revogação mantém histórico, mas torna o token público indisponível.
    await loginAs(request, ownerEmail);
    const ativa = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: {} });
    const { path: activePath, id: activeId } = ((await ativa.json()) as { share: { path: string; id: string } }).share;
    const revogada = await request.delete(`/api/xgestao/obras/${obra.id}/share/${activeId}`);
    expect(revogada.status()).toBe(200);
    expect(await revogada.json()).toEqual({ revoked: true });
    // Revogar de novo não acha link ativo.
    expect((await request.delete(`/api/xgestao/obras/${obra.id}/share/${activeId}`)).status()).toBe(404);
    await logout(request);
    expect((await request.get(activePath)).status()).toBe(404);
    // Os demais links da obra seguem valendo.
    expect((await request.get(first.share.path)).status()).toBe(200);

    // Uma assinatura/entitlement revogada não deixa uma capability já emitida
    // ativa e impossível de administrar pelo dono.
    await loginAs(request, ownerEmail);
    const paraRevogarEntitlement = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: {} });
    const entitlementPath = ((await paraRevogarEntitlement.json()) as { share: { path: string } }).share.path;
    await logout(request);
    await loginAs(request, SEED_ADMIN_EMAIL);
    const entitlementRevogado = await request.patch(`/api/admin/usuarios/${ownerId}`, { data: { xgestao: false } });
    expect(entitlementRevogado.status(), await entitlementRevogado.text()).toBe(200);
    await logout(request);
    expect((await request.get(entitlementPath)).status()).toBe(404);

    // Cascata ao remover a obra evita que um link órfão passe a resolver dados.
    await loginAs(request, SEED_ADMIN_EMAIL);
    const entitlementRestaurado = await request.patch(`/api/admin/usuarios/${ownerId}`, { data: { xgestao: true } });
    expect(entitlementRestaurado.status(), await entitlementRestaurado.text()).toBe(200);
    await logout(request);
    await loginAs(request, ownerEmail);
    const paraExcluir = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: {} });
    const deletedPath = ((await paraExcluir.json()) as { share: { path: string } }).share.path;
    await logout(request);
    await loginAs(request, SEED_ADMIN_EMAIL);
    const excluida = await request.delete(`/api/obras/${obra.id}`);
    expect(excluida.status(), await excluida.text()).toBe(200);
    await logout(request);
    expect((await request.get(deletedPath)).status()).toBe(404);
  });

  test('um link por público: pagamentos só no link em que o dono ligou', async ({ request }) => {
    const ownerEmail = await registrarEmpreiteiro(request, 'xgestao-publicos');
    await loginAs(request, ownerEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    await concederXGestao(request, ownerEmail);
    await loginAs(request, ownerEmail);

    const obraResponse = await request.post('/api/xgestao/obras', {
      data: { nome: 'Obra públicos E2E', endereco: 'Rua dos públicos, 1', cidade: 'São Paulo', uf: 'SP' },
    });
    expect(obraResponse.status(), await obraResponse.text()).toBe(201);
    const obra = (await obraResponse.json()) as { id: string };
    const valores = await request.patch(`/api/obras/${obra.id}`, { data: { valorTotal: '250000' } });
    expect(valores.status(), await valores.text()).toBe(200);

    // Uma receita (o cliente pagou) e uma despesa (o empreiteiro pagou).
    const receita = await request.post(`/api/obras/${obra.id}/financeiro`, {
      data: { tipo: 'entrada', descricao: 'Parcela entrada E2E', valor: 50000, data: '2026-09-01' },
    });
    expect(receita.status(), await receita.text()).toBe(201);
    const despesa = await request.post(`/api/obras/${obra.id}/financeiro`, {
      data: { tipo: 'saida', categoria: 'material', descricao: 'Cimento despesa E2E', valor: 1234.56, data: '2026-09-02' },
    });
    expect(despesa.status(), await despesa.text()).toBe(201);

    const etapa = await request.post(`/api/obras/${obra.id}/etapas`, {
      data: {
        nome: 'Alvenaria cronograma E2E',
        dataInicio: '2026-09-01T00:00:00.000Z',
        prazo: '2026-09-30T00:00:00.000Z',
      },
    });
    expect(etapa.status(), await etapa.text()).toBe(201);
    const checklist = await request.post(`/api/obras/${obra.id}/checklists`, {
      data: { nome: 'Checklist interno E2E', itens: [{ titulo: 'Conferir EPIs' }] },
    });
    expect(checklist.status(), await checklist.text()).toBe(201);

    const cliente = (await (await request.post(`/api/xgestao/obras/${obra.id}/share`, {
      data: { nome: 'Cliente' },
    })).json()) as { share: { id: string; path: string; secoes: Record<string, boolean> } };
    const arquiteto = (await (await request.post(`/api/xgestao/obras/${obra.id}/share`, {
      data: { nome: 'Arquiteto' },
    })).json()) as { share: { id: string; path: string; secoes: Record<string, boolean> } };
    // Pagamentos nasce desligado em todo link.
    expect(cliente.share.secoes.pagamentos).toBe(false);
    expect(arquiteto.share.secoes.pagamentos).toBe(false);

    const ligarPagamentos = await request.patch(`/api/xgestao/obras/${obra.id}/share/${cliente.share.id}`, {
      data: { secoes: { ...cliente.share.secoes, pagamentos: true } },
    });
    expect(ligarPagamentos.status(), await ligarPagamentos.text()).toBe(200);

    // As seções antigas não existem mais: a API recusa em vez de ignorar.
    const secaoAntiga = await request.patch(`/api/xgestao/obras/${obra.id}/share/${cliente.share.id}`, {
      data: { secoes: { ...cliente.share.secoes, checklists: true } },
    });
    expect(secaoAntiga.status()).toBe(400);

    await logout(request);
    // O HTML inclui o payload serializado das abas, inclusive as não abertas:
    // procurar nele é o que prova que o dado não saiu do servidor.
    const htmlCliente = await (await request.get(cliente.share.path)).text();
    expect(htmlCliente).toContain('Parcela entrada E2E');
    expect(htmlCliente).toContain('Alvenaria cronograma E2E');
    expect(htmlCliente).not.toContain('Cimento despesa E2E');
    expect(htmlCliente).not.toContain('Checklist interno E2E');

    const htmlArquiteto = await (await request.get(arquiteto.share.path)).text();
    expect(htmlArquiteto).toContain('Alvenaria cronograma E2E');
    expect(htmlArquiteto).not.toContain('Parcela entrada E2E');
    expect(htmlArquiteto).not.toContain('Cimento despesa E2E');
    expect(htmlArquiteto).not.toContain('Checklist interno E2E');

    // IDOR: outro dono xgestão, com obra própria, não alcança o link alheio
    // nem pela obra dele nem pela obra do dono.
    const outroEmail = await registrarEmpreiteiro(request, 'xgestao-publicos-outro');
    await loginAs(request, outroEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    await concederXGestao(request, outroEmail);
    await loginAs(request, outroEmail);
    const obraOutro = (await (await request.post('/api/xgestao/obras', {
      data: { nome: 'Obra do outro E2E', endereco: 'Rua do outro, 2' },
    })).json()) as { id: string };
    const viaObraPropria = await request.patch(`/api/xgestao/obras/${obraOutro.id}/share/${cliente.share.id}`, {
      data: { nome: 'Sequestrado' },
    });
    expect(viaObraPropria.status()).toBe(404);
    expect((await request.delete(`/api/xgestao/obras/${obraOutro.id}/share/${cliente.share.id}`)).status()).toBe(404);
    expect((await request.patch(`/api/xgestao/obras/${obra.id}/share/${cliente.share.id}`, {
      data: { nome: 'Sequestrado' },
    })).status()).toBe(404);
    await logout(request);
    expect((await request.get(cliente.share.path)).status()).toBe(200);

    // Revogar o do arquiteto não derruba o do cliente.
    await loginAs(request, ownerEmail);
    expect((await request.delete(`/api/xgestao/obras/${obra.id}/share/${arquiteto.share.id}`)).status()).toBe(200);
    const lista = (await (await request.get(`/api/xgestao/obras/${obra.id}/share`)).json()) as {
      shares: Array<{ id: string; nome: string }>;
      limite: number;
    };
    expect(lista.shares.map((s) => s.id)).toEqual([cliente.share.id]);

    // Teto de links ativos por obra.
    for (let i = lista.shares.length; i < lista.limite; i++) {
      const extra = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: { nome: `Extra ${i}` } });
      expect(extra.status(), await extra.text()).toBe(201);
    }
    expect((await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: { nome: 'Além do teto' } })).status()).toBe(409);
    await logout(request);
    expect((await request.get(arquiteto.share.path)).status()).toBe(404);
    expect((await request.get(cliente.share.path)).status()).toBe(200);
  });

  test('somente quem executa a obra decide quais fotos vão ao cliente', async ({ request }) => {
    const ownerEmail = await registrarEmpreiteiro(request, 'xgestao-curadoria');
    await loginAs(request, ownerEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    await concederXGestao(request, ownerEmail);

    await loginAs(request, ownerEmail);
    const criada = await request.post('/api/xgestao/obras', {
      data: { nome: 'Obra curadoria E2E', endereco: 'Rua da curadoria, 1' },
    });
    expect(criada.status(), await criada.text()).toBe(201);
    const obra = (await criada.json()) as { id: string };

    const arquivo = await request.post('/api/test/file-setup', {
      data: { email: ownerEmail, kind: 'obra_foto', originalName: 'curadoria-e2e.jpg', mime: 'image/jpeg' },
    });
    expect(arquivo.status(), await arquivo.text()).toBe(200);
    const { fileId } = (await arquivo.json()) as { fileId: string };
    const foto = await request.post(`/api/obras/${obra.id}/fotos`, { data: { fileId } });
    expect(foto.status(), await foto.text()).toBe(201);
    const fotoId = ((await foto.json()) as { id: string }).id;

    // O dono da obra alterna a visibilidade — o controle que a tela prometia.
    const desmarcar = await request.patch(`/api/obras/${obra.id}/fotos/${fotoId}`, {
      data: { enviadaAoContratante: false },
    });
    expect(desmarcar.status(), await desmarcar.text()).toBe(200);
    expect((await desmarcar.json()).enviadaAoContratante).toBe(false);

    const remarcar = await request.patch(`/api/obras/${obra.id}/fotos/${fotoId}`, {
      data: { enviadaAoContratante: true },
    });
    expect(remarcar.status()).toBe(200);
    expect((await remarcar.json()).enviadaAoContratante).toBe(true);

    // Valor não-booleano é recusado, e não interpretado como falso.
    expect((await request.patch(`/api/obras/${obra.id}/fotos/${fotoId}`, {
      data: { enviadaAoContratante: 'nao' },
    })).status()).toBe(400);
    await logout(request);

    // Empreiteiro de outra empresa não enxerga nem cura a obra alheia.
    const outroEmail = await registrarEmpreiteiro(request, 'xgestao-curadoria-outro');
    await loginAs(request, outroEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    const alheio = await request.patch(`/api/obras/${obra.id}/fotos/${fotoId}`, {
      data: { enviadaAoContratante: false },
    });
    expect([403, 404]).toContain(alheio.status());
    await logout(request);
  });
});