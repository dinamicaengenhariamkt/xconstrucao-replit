import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { marketingAtivo, mudancaConsentimento } from '../../features/xgestao/marketing/lib/consentimento';
import {
  criarTokenDescadastro,
  lerTokenDescadastro,
  segredoDescadastro,
  urlDescadastro,
  urlDescadastroUmClique,
} from '../../features/xgestao/marketing/lib/token-descadastro';
import { autorizarCron } from '../../features/xgestao/marketing/lib/cron-auth';
import {
  aplicarTeto,
  CATEGORIA_EMAIL,
  diaSp,
  emailsDoDia,
  tetoDiario,
  TETO_MAXIMO,
  TETO_PADRAO,
  TIPOS_EMAIL,
  type LinhaRotinaEmail,
} from '../../features/xgestao/marketing/lib/regras-emails';
import { conteudoEmail, dataBrSp, primeiroNome } from '../../features/xgestao/marketing/lib/textos-emails';
import { somenteDigitosTelefone, telefoneBrValido } from '../../shared/lib/telefone-br';
import { registerSchema } from '../../features/auth/schemas';
import { sincronizarContatosBrevo } from '../../features/xgestao/marketing/server/brevo-contatos';
import { PASSOS_ESSENCIAIS } from '../../server/bootstrap-colunas-essenciais';
import { aplicarSegmento, filtrosDaUrl, filtrosParaQuery } from '../../features/xgestao/admin/lib/segmentos-assinante';

/**
 * XG52 — consentimento de marketing, token de descadastro, rotina diária de
 * e-mails (quem recebe o quê, idempotência, teto), Brevo e telefone.
 */
const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;
const agora = new Date('2026-11-10T12:00:00Z');
const SEGREDO = 'segredo-de-teste-unitario';

function linha(parcial: Partial<LinhaRotinaEmail> = {}): LinhaRotinaEmail {
  return {
    userId: 'u1',
    email: 'a@exemplo.test',
    nome: 'Ana Souza',
    role: 'empreiteiro',
    ativo: true,
    contaInterna: false,
    marketing: { consentimentoEm: null, revogadoEm: null },
    avisosAssinatura: true,
    situacao: { codigo: 'pago', ate: new Date(agora.getTime() + 20 * DIA).toISOString(), diasRestantes: 20 },
    cancelamentoPedidoEm: null,
    entradaEm: new Date(agora.getTime() - 60 * DIA),
    obrasGerenciadas: 2,
    saidaEm: null,
    ...parcial,
  };
}
const aceitou = { consentimentoEm: new Date(agora.getTime() - 10 * DIA), revogadoEm: null };
const tipos = (l: LinhaRotinaEmail, quando = agora) => emailsDoDia(l, quando).map((e) => e.tipo);

// ── Consentimento ──────────────────────────────────────────────────────────

test('XG52 consentimento: opt-in desmarcado por padrão, revogação vale até novo aceite', () => {
  assert.equal(marketingAtivo(null), false);
  assert.equal(marketingAtivo({ consentimentoEm: null, revogadoEm: null }), false);
  assert.equal(marketingAtivo(aceitou), true);
  const t0 = new Date('2026-11-01T00:00:00Z');
  const t1 = new Date('2026-11-05T00:00:00Z');
  assert.equal(marketingAtivo({ consentimentoEm: t0, revogadoEm: t1 }), false);
  assert.equal(marketingAtivo({ consentimentoEm: t1, revogadoEm: t0 }), true);
});

test('XG52 consentimento: aceitar grava data e limpa revogação; revogar preserva o aceite', () => {
  assert.deepEqual(mudancaConsentimento(true, 'configuracoes', agora), { marketingConsentimentoEm: agora, marketingRevogadoEm: null, marketingOrigem: 'configuracoes' });
  const rev = mudancaConsentimento(false, 'descadastro', agora);
  assert.deepEqual(rev, { marketingRevogadoEm: agora, marketingOrigem: 'descadastro' });
  assert.equal('marketingConsentimentoEm' in rev, false);
  assert.throws(() => mudancaConsentimento(true, 'descadastro', agora));
});

// ── Token de descadastro ───────────────────────────────────────────────────

test('XG52 token de descadastro: ida e volta, sem expor o id', () => {
  const id = '8f3c2a10-1111-4222-8333-444455556666';
  const token = criarTokenDescadastro(id, SEGREDO)!;
  assert.ok(token.startsWith('v1.'));
  assert.equal(lerTokenDescadastro(token, SEGREDO), id);
  assert.ok(!token.includes(id));
  assert.ok(!token.includes(Buffer.from(id).toString('base64url')));
  // Dois tokens da mesma conta são diferentes (IV aleatório) e ambos valem.
  const outro = criarTokenDescadastro(id, SEGREDO)!;
  assert.notEqual(outro, token);
  assert.equal(lerTokenDescadastro(outro, SEGREDO), id);
});

test('XG52 token de descadastro: alterado, de outro segredo ou malformado não vale', () => {
  const token = criarTokenDescadastro('conta-1', SEGREDO)!;
  const [v, dados] = token.split('.');
  const ultimo = dados.at(-1) === 'A' ? 'B' : 'A';
  assert.equal(lerTokenDescadastro(`${v}.${dados.slice(0, -1)}${ultimo}`, SEGREDO), null);
  assert.equal(lerTokenDescadastro(token, 'outro-segredo'), null);
  for (const ruim of ['', 'v1.', 'v2.abc', 'abc', `${token}.x`, 'v1.' + 'A'.repeat(500), null, undefined]) {
    assert.equal(lerTokenDescadastro(ruim as string, SEGREDO), null, String(ruim));
  }
  assert.equal(criarTokenDescadastro('conta-1', null), null);
  assert.equal(lerTokenDescadastro(token, null), null);
});

test('XG52 token de descadastro: segredo existente e URLs do link e do um-clique', () => {
  assert.equal(segredoDescadastro({ SESSION_SECRET: 's1', NEXTAUTH_SECRET: 's2' }), 's1');
  assert.equal(segredoDescadastro({ NEXTAUTH_SECRET: 's2' }), 's2');
  assert.equal(segredoDescadastro({ AUTH_SECRET: 's3' }), 's3');
  assert.equal(segredoDescadastro({}), null);
  assert.equal(urlDescadastro('https://x.com/', 'v1.a+b'), 'https://x.com/descadastro?t=v1.a%2Bb');
  assert.equal(urlDescadastroUmClique('https://x.com', 'v1.ab'), 'https://x.com/api/xgestao/descadastro?t=v1.ab');
});

// ── Autorização do cron ────────────────────────────────────────────────────

test('XG52 cron: sem CRON_SECRET é 503, segredo ausente ou errado é 401', () => {
  assert.equal(autorizarCron('Bearer qualquer', undefined), 'sem_secret');
  assert.equal(autorizarCron('Bearer qualquer', '  '), 'sem_secret');
  assert.equal(autorizarCron(null, 'abc'), 'negado');
  assert.equal(autorizarCron('abc', 'abc'), 'negado');
  assert.equal(autorizarCron('Basic abc', 'abc'), 'negado');
  assert.equal(autorizarCron('Bearer abcd', 'abc'), 'negado');
  assert.equal(autorizarCron('Bearer abc', 'abc'), 'ok');
  assert.equal(autorizarCron('bearer  abc ', 'abc'), 'ok');
});

// ── Quem recebe o quê ──────────────────────────────────────────────────────

test('XG52 teste acabando: 7, 3 e 1 dia, um aviso por faixa, ancorado no fim do teste', () => {
  const fim = new Date(agora.getTime() + 6.5 * DIA);
  const em = (dias: number) => linha({ situacao: { codigo: 'em_teste', ate: fim.toISOString(), diasRestantes: dias } });
  assert.deepEqual(tipos(em(10)), []);
  assert.deepEqual(tipos(em(7)), ['teste_acaba_7d']);
  assert.deepEqual(tipos(em(5)), ['teste_acaba_7d']);
  assert.deepEqual(tipos(em(3)), ['teste_acaba_3d']);
  assert.deepEqual(tipos(em(2)), ['teste_acaba_3d']);
  assert.deepEqual(tipos(em(1)), ['teste_acaba_1d']);
  assert.equal(emailsDoDia(em(7), agora)[0].referencia, diaSp(fim));
  assert.equal(emailsDoDia(em(7), agora)[0].categoria, 'transacional');
});

test('XG52 transacionais: teste acabou, cobrança em atraso e cancelamento confirmado', () => {
  const ate = new Date(agora.getTime() + 12 * HORA).toISOString();
  assert.deepEqual(tipos(linha({ situacao: { codigo: 'teste_tolerancia', ate, diasRestantes: 1 } })), ['teste_acabou']);
  assert.deepEqual(tipos(linha({ situacao: { codigo: 'inadimplente', ate, diasRestantes: 5 } })), ['cobranca_atraso']);
  const pedido = new Date(agora.getTime() - 2 * DIA).toISOString();
  const cancel = emailsDoDia(linha({ situacao: { codigo: 'cancelamento_agendado', ate, diasRestantes: 20 }, cancelamentoPedidoEm: pedido }), agora);
  assert.deepEqual(cancel.map((e) => [e.tipo, e.referencia]), [['cancelamento_confirmado', diaSp(pedido)]]);
  // Transacional não pede opt-in.
  assert.equal(cancel[0].categoria, 'transacional');
});

test('XG52 switch "Avisos sobre sua assinatura" desligado corta avisos de prazo, não o cancelamento', () => {
  const ate = new Date(agora.getTime() + 2 * DIA).toISOString();
  const sem = { avisosAssinatura: false };
  assert.deepEqual(tipos(linha({ ...sem, situacao: { codigo: 'em_teste', ate, diasRestantes: 2 } })), []);
  assert.deepEqual(tipos(linha({ ...sem, situacao: { codigo: 'inadimplente', ate, diasRestantes: 2 } })), []);
  assert.deepEqual(tipos(linha({ ...sem, situacao: { codigo: 'cancelamento_agendado', ate, diasRestantes: 2 } })), ['cancelamento_confirmado']);
});

test('XG52 marketing "sem obra": só com opt-in, 3 a 30 dias depois de entrar, sem obra e com acesso', () => {
  const base = { obrasGerenciadas: 0, entradaEm: new Date(agora.getTime() - 4 * DIA), situacao: { codigo: 'em_teste' as const, ate: new Date(agora.getTime() + 80 * DIA).toISOString(), diasRestantes: 80 } };
  assert.deepEqual(tipos(linha(base)), [], 'sem opt-in, nada de marketing');
  assert.deepEqual(tipos(linha({ ...base, marketing: aceitou })), ['sem_obra_3d']);
  assert.equal(emailsDoDia(linha({ ...base, marketing: aceitou }), agora)[0].referencia, 'unico');
  assert.deepEqual(tipos(linha({ ...base, marketing: aceitou, entradaEm: new Date(agora.getTime() - 2 * DIA) })), []);
  assert.deepEqual(tipos(linha({ ...base, marketing: aceitou, entradaEm: new Date(agora.getTime() - 31 * DIA) })), []);
  assert.deepEqual(tipos(linha({ ...base, marketing: aceitou, obrasGerenciadas: 1 })), []);
  assert.deepEqual(tipos(linha({ ...base, marketing: aceitou, situacao: { codigo: 'somente_leitura', ate: null, diasRestantes: null } })), []);
  // Revogou depois de aceitar: sai.
  assert.deepEqual(tipos(linha({ ...base, marketing: { consentimentoEm: aceitou.consentimentoEm, revogadoEm: new Date(agora.getTime() - DIA) } })), []);
});

test('XG52 marketing "volta": 7 e 30 dias depois de perder o acesso, só com opt-in', () => {
  const saiu = (dias: number) => linha({
    marketing: aceitou,
    situacao: { codigo: 'somente_leitura', ate: null, diasRestantes: null },
    saidaEm: new Date(agora.getTime() - dias * DIA - HORA),
  });
  assert.deepEqual(tipos(saiu(6)), []);
  assert.deepEqual(tipos(saiu(7)), ['volta_7d']);
  assert.deepEqual(tipos(saiu(13)), ['volta_7d']);
  assert.deepEqual(tipos(saiu(14)), []);
  assert.deepEqual(tipos(saiu(30)), ['volta_30d']);
  assert.deepEqual(tipos(saiu(45)), []);
  assert.equal(emailsDoDia(saiu(7), agora)[0].referencia, diaSp(new Date(agora.getTime() - 7 * DIA - HORA)));
  assert.deepEqual(tipos(linha({ ...saiu(7), marketing: { consentimentoEm: null, revogadoEm: null } })), []);
});

test('XG52 conta interna, admin e conta desativada nunca recebem', () => {
  const ate = new Date(agora.getTime() + 2 * DIA).toISOString();
  const s = { situacao: { codigo: 'inadimplente' as const, ate, diasRestantes: 2 }, marketing: aceitou };
  assert.equal(tipos(linha(s)).length, 1);
  assert.deepEqual(tipos(linha({ ...s, contaInterna: true })), []);
  assert.deepEqual(tipos(linha({ ...s, role: 'admin' })), []);
  assert.deepEqual(tipos(linha({ ...s, role: 'superadmin' })), []);
  assert.deepEqual(tipos(linha({ ...s, ativo: false })), []);
});

test('XG52 categorias: só sem_obra e volta são marketing', () => {
  assert.deepEqual(TIPOS_EMAIL.filter((t) => CATEGORIA_EMAIL[t] === 'marketing'), ['sem_obra_3d', 'volta_7d', 'volta_30d']);
});

// ── Teto diário ────────────────────────────────────────────────────────────

test('XG52 teto: transacional primeiro, desconta o que já saiu hoje', () => {
  const p = [
    { id: 1, categoria: 'marketing' as const },
    { id: 2, categoria: 'transacional' as const },
    { id: 3, categoria: 'marketing' as const },
    { id: 4, categoria: 'transacional' as const },
  ];
  assert.deepEqual(aplicarTeto(p, 3, 0).enviar.map((x) => x.id), [2, 4, 1]);
  assert.deepEqual(aplicarTeto(p, 3, 0).adiados.map((x) => x.id), [3]);
  assert.deepEqual(aplicarTeto(p, 3, 2).enviar.map((x) => x.id), [2]);
  assert.deepEqual(aplicarTeto(p, 3, 5).enviar, []);
  assert.equal(tetoDiario({}), TETO_PADRAO);
  assert.equal(tetoDiario({ XGESTAO_EMAILS_TETO_DIARIO: '50' }), 50);
  assert.equal(tetoDiario({ XGESTAO_EMAILS_TETO_DIARIO: '1000' }), TETO_MAXIMO);
  assert.equal(tetoDiario({ XGESTAO_EMAILS_TETO_DIARIO: 'abc' }), TETO_PADRAO);
  assert.equal(tetoDiario({ XGESTAO_EMAILS_TETO_DIARIO: '-1' }), TETO_PADRAO);
  assert.ok(TETO_MAXIMO < 300);
});

// ── Textos ─────────────────────────────────────────────────────────────────

test('XG52 textos: curtos, sem travessão, sem IA, sem oferecer teste ou bônus de novo', () => {
  for (const tipo of TIPOS_EMAIL) {
    const c = conteudoEmail(tipo, { nome: 'Ana', data: '20/11/2026' });
    const tudo = [c.assunto, c.titulo, ...c.paragrafos, c.botao.texto, c.rodape].join('\n');
    assert.doesNotMatch(tudo, /[—–]/, tipo);
    assert.doesNotMatch(tudo, /\bIA\b|intelig[êe]ncia artificial/i, tipo);
    assert.ok(c.paragrafos.join(' ').length < 600, `${tipo} curto`);
    assert.ok(c.botao.caminho.startsWith('/xgestao/'), tipo);
    if (CATEGORIA_EMAIL[tipo] === 'marketing') {
      assert.doesNotMatch(tudo, /b[ôo]nus|teste gr[áa]tis|gr[áa]tis|desconto/i, tipo);
      assert.match(c.rodape, /sair/i, tipo);
    }
    // Sem nome, não fica "Olá, ."
    assert.doesNotMatch(conteudoEmail(tipo, { nome: null, data: null }).paragrafos.join(' '), /Olá, \./);
  }
  assert.match(conteudoEmail('cancelamento_confirmado', { nome: 'Ana', data: '20/11/2026' }).paragrafos.join(' '), /acesso completo até 20\/11\/2026/);
  assert.equal(primeiroNome('  Ana Maria Souza '), 'Ana');
  assert.equal(primeiroNome(''), null);
  assert.equal(dataBrSp('2026-11-20T02:00:00Z'), '19/11/2026');
});

// ── Telefone ───────────────────────────────────────────────────────────────

test('XG52 telefone BR: 10 ou 11 dígitos com DDD, com ou sem máscara', () => {
  for (const ok of ['11988880000', '(11) 98888-0000', '(21) 3333-4444', '2133334444', '+55 11 98888-0000', '5511988880000']) {
    assert.equal(telefoneBrValido(ok), true, ok);
  }
  for (const ruim of ['', '988880000', '119888800001', '01988880000', '10988880000', '11888880000', '(11) 8888-000', 'abc']) {
    assert.equal(telefoneBrValido(ruim), false, ruim);
  }
  assert.equal(somenteDigitosTelefone('+55 (11) 98888-0000'), '11988880000');
});

const cadastroBase = {
  name: 'Ana Souza', email: 'ana@exemplo.test', username: 'ana_souza', password: 'Xconstr@E2E2026!',
  role: 'empreiteiro', acceptTerms: true,
};

test('XG52 cadastro: telefone opcional, validado quando vem, gravado só com dígitos', () => {
  assert.equal(registerSchema.safeParse(cadastroBase).success, true);
  const vazio = registerSchema.safeParse({ ...cadastroBase, phone: '  ' });
  assert.equal(vazio.success, true);
  assert.equal(vazio.success && vazio.data.phone, undefined);
  const mascarado = registerSchema.safeParse({ ...cadastroBase, phone: '(11) 98888-0000' });
  assert.equal(mascarado.success && mascarado.data.phone, '11988880000');
  const ruim = registerSchema.safeParse({ ...cadastroBase, phone: '1234' });
  assert.equal(ruim.success, false);
  assert.deepEqual(!ruim.success && Object.keys(ruim.error.flatten().fieldErrors), ['phone']);
});

test('XG52 cadastro: opt-in de marketing é opcional e não é condição', () => {
  for (const marketingOptIn of [undefined, false, true]) {
    const r = registerSchema.safeParse({ ...cadastroBase, xgestao: true, marketingOptIn });
    assert.equal(r.success, true, String(marketingOptIn));
  }
  assert.equal(registerSchema.safeParse({ ...cadastroBase, marketingOptIn: 'sim' }).success, false);
});

// ── Brevo ──────────────────────────────────────────────────────────────────

type Chamada = { metodo: string; caminho: string; corpo: any };
function fakeBrevo(opcoes: { listas?: Array<{ id: number; name: string }>; atributos?: string[]; falhar?: RegExp; remover400?: boolean } = {}) {
  const chamadas: Chamada[] = [];
  const f = (async (url: string, init: RequestInit) => {
    const caminho = String(url).replace('https://api.brevo.com/v3', '');
    const metodo = init.method ?? 'GET';
    chamadas.push({ metodo, caminho, corpo: init.body ? JSON.parse(String(init.body)) : undefined });
    const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
    if (opcoes.falhar?.test(`${metodo} ${caminho}`)) return resp(500, { code: 'erro' });
    if (caminho.startsWith('/contacts/lists?')) return resp(200, { lists: opcoes.listas ?? [] });
    if (caminho.startsWith('/contacts/folders?')) return resp(200, { folders: [] });
    if (caminho === '/contacts/folders') return resp(201, { id: 7 });
    if (caminho === '/contacts/lists') return resp(201, { id: 42 });
    if (caminho === '/contacts/attributes') return resp(200, { attributes: (opcoes.atributos ?? []).map((name) => ({ name })) });
    if (caminho.startsWith('/contacts/attributes/normal/')) return resp(201, {});
    if (caminho === '/contacts/import') return resp(202, { processId: 1 });
    if (caminho.endsWith('/contacts/remove')) return opcoes.remover400 ? resp(400, { code: 'invalid_parameter' }) : resp(201, { contacts: { success: [] } });
    return resp(404, {});
  }) as unknown as typeof fetch;
  return { f, chamadas };
}
const contato = { email: 'a@exemplo.test', situacao: 'em_teste', plano: 'Basic (teste)', fimTeste: '2026-12-01' };

test('XG52 Brevo: cria pasta, lista e atributos que faltam; importa quem aceitou e remove quem revogou', async () => {
  const { f, chamadas } = fakeBrevo({ atributos: ['PLANO'] });
  const r = await sincronizarContatosBrevo([contato], ['b@exemplo.test'], { fetch: f, apiKey: 'k' });
  assert.deepEqual(r, { ok: true, modo: 'real', listaId: 42, enviados: 1, removidos: 1 });
  const passos = chamadas.map((c) => `${c.metodo} ${c.caminho.split('?')[0]}`);
  assert.deepEqual(passos, [
    'GET /contacts/lists', 'GET /contacts/folders', 'POST /contacts/folders', 'POST /contacts/lists',
    'GET /contacts/attributes', 'POST /contacts/attributes/normal/SITUACAO', 'POST /contacts/attributes/normal/FIM_TESTE',
    'POST /contacts/import', 'POST /contacts/lists/42/contacts/remove',
  ]);
  assert.deepEqual(chamadas[3].corpo, { name: 'xgestão assinantes', folderId: 7 });
  assert.equal(chamadas[6].corpo.type, 'date');
  assert.deepEqual(chamadas[7].corpo.listIds, [42]);
  assert.deepEqual(chamadas[7].corpo.jsonBody[0], { email: contato.email, attributes: { SITUACAO: 'em_teste', PLANO: 'Basic (teste)', FIM_TESTE: '2026-12-01' } });
  assert.deepEqual(chamadas[8].corpo, { emails: ['b@exemplo.test'] });
});

test('XG52 Brevo: reaproveita a lista existente; 400 na remoção não é falha', async () => {
  const { f, chamadas } = fakeBrevo({ listas: [{ id: 9, name: 'xgestão assinantes' }], atributos: ['SITUACAO', 'PLANO', 'FIM_TESTE'], remover400: true });
  const r = await sincronizarContatosBrevo([], ['b@exemplo.test'], { fetch: f, apiKey: 'k' });
  assert.equal(r.ok, true);
  assert.equal(r.listaId, 9);
  assert.equal(r.removidos, 0);
  assert.ok(!chamadas.some((c) => c.caminho === '/contacts/lists' && c.metodo === 'POST'));
});

test('XG52 Brevo: falha não derruba a rotina; sem chave fica desligado; modo de teste não chama a rede', async () => {
  const { f } = fakeBrevo({ falhar: /POST \/contacts\/import/ });
  const r = await sincronizarContatosBrevo([contato], [], { fetch: f, apiKey: 'k' });
  assert.equal(r.ok, false);
  assert.match(r.erro ?? '', /import -> 500/);
  assert.doesNotMatch(r.erro ?? '', /@/);
  const semChave = await sincronizarContatosBrevo([contato], [], { fetch: f, apiKey: null });
  assert.deepEqual({ ok: semChave.ok, modo: semChave.modo }, { ok: false, modo: 'desligado' });
  // Modo de teste sem fetch injetado: não toca na rede (o fetch global falharia aqui).
  const fetchOriginal = globalThis.fetch;
  let chamou = false;
  globalThis.fetch = (async () => { chamou = true; return new Response('{}'); }) as typeof fetch;
  try {
    const teste = await sincronizarContatosBrevo([contato], ['x@y.test'], { modoTeste: true, apiKey: 'k' });
    assert.deepEqual(teste, { ok: true, modo: 'teste', listaId: null, enviados: 1, removidos: 1 });
  } finally {
    globalThis.fetch = fetchOriginal;
  }
  assert.equal(chamou, false);
});

// ── E-mail: cabeçalho de descadastro e link no rodapé ──────────────────────

test('XG52 e-mail de marketing leva List-Unsubscribe e link no rodapé', async () => {
  process.env.EMAIL_TEST_MODE = '1';
  const { sendXgestaoCicloEmail } = await import('../../shared/lib/email');
  const { listTestEmails, clearTestEmails } = await import('../../shared/lib/test-email-store');
  clearTestEmails();
  await sendXgestaoCicloEmail('ana@exemplo.test', {
    tipo: 'sem_obra_3d',
    assunto: 'Assunto',
    props: { titulo: 'T', paragrafos: ['P'], botaoTexto: 'B', botaoLink: 'https://x/xgestao/obras', rodape: 'R', descadastroUrl: 'https://x/descadastro?t=v1.abc' },
    listUnsubscribeUrl: 'https://x/api/xgestao/descadastro?t=v1.abc',
  });
  const [email] = listTestEmails({ to: 'ana@exemplo.test' });
  assert.equal(email.meta?.kind, 'xgestao-sem_obra_3d');
  assert.deepEqual(email.meta?.headers, {
    'List-Unsubscribe': '<https://x/api/xgestao/descadastro?t=v1.abc>',
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  });
  assert.match(email.html, /descadastro\?t=v1\.abc/);
  assert.match(email.html, /Não quero mais receber/);
  clearTestEmails();
  await sendXgestaoCicloEmail('ana@exemplo.test', {
    tipo: 'cobranca_atraso', assunto: 'A', props: { titulo: 'T', paragrafos: ['P'], botaoTexto: 'B', botaoLink: '#', rodape: 'R' },
  });
  const [transacional] = listTestEmails({ to: 'ana@exemplo.test' });
  assert.deepEqual(transacional.meta?.headers, {});
  assert.doesNotMatch(transacional.html, /Não quero mais receber/);
});

// ── Admin, schema e documentos ─────────────────────────────────────────────

test('XG52 admin: filtro "aceita marketing" vai para a URL e o CSV e recorta a lista', () => {
  const f = filtrosDaUrl(new URLSearchParams('marketing=aceitou&contato=nunca'));
  assert.equal(f.somenteMarketing, true);
  assert.equal(filtrosParaQuery(f), 'contato=nunca&marketing=aceitou');
  assert.equal('somenteMarketing' in filtrosDaUrl(new URLSearchParams('')), false);
  const base = {
    empreiteiraNome: 'E', nome: 'N', email: 'e@x', semEmpresa: false, atencao: [],
    situacao: { codigo: 'pago', rotulo: '', ate: null, diasRestantes: null, motivo: null, diasEmAtraso: null },
    engajamento: { nivel: 'ativo', diasSemUso: 1, ultimoSinalEm: null, ultimoRegistroEm: null, registros30d: 0 },
  } as any;
  const sim = { ...base, email: 'sim@x', marketing: { aceito: true } };
  const nao = { ...base, email: 'nao@x', marketing: { aceito: false } };
  assert.deepEqual(aplicarSegmento([sim, nao, base], { somenteMarketing: true }).map((l) => l.email), ['sim@x']);
  assert.equal(aplicarSegmento([sim, nao, base], {}).length, 3);
});

test('XG52 bootstrap essencial cobre a 0016 (colunas de consentimento e tabela de envios)', () => {
  const tudo = PASSOS_ESSENCIAIS.map((p) => p.sql).join('\n');
  for (const trecho of [
    'marketing_consentimento_em', 'marketing_revogado_em', 'marketing_origem',
    'CREATE TABLE IF NOT EXISTS xgestao_emails_enviados',
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_xgestao_emails_enviados ON xgestao_emails_enviados (user_id, tipo, referencia)',
  ]) {
    assert.ok(tudo.includes(trecho), trecho);
  }
  const migration = readFileSync('migrations/0016_xgestao_marketing_emails.sql', 'utf8');
  assert.match(migration, /uq_xgestao_emails_enviados[\s\S]*\(user_id, tipo, referencia\)/);
});

test('XG52 minutas v2: marketing por consentimento, revogação e Brevo como operador', () => {
  const privacidade = readFileSync('server/legal-seed/privacidade-v2.md', 'utf8');
  assert.match(privacidade, /Brevo/);
  assert.match(privacidade, /operadora/);
  assert.match(privacidade, /Consentimento \(inciso I\), revogável a qualquer momento/);
  assert.match(privacidade, /link de descadastro/);
  const termos = readFileSync('server/legal-seed/termos-v2.md', 'utf8');
  assert.match(termos, /3-A Comunicações por e-mail/);
  // A v1 publicada não muda.
  assert.doesNotMatch(readFileSync('server/legal-seed/privacidade-v1.md', 'utf8'), /Brevo/);
});
