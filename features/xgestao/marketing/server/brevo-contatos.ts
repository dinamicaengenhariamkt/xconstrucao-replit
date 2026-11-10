/**
 * XG52 — sincronização da lista de contatos do Brevo com quem deu opt-in.
 *
 * - lista "xgestão assinantes" (criada na 1ª vez, numa pasta "xgestão");
 * - atributos SITUACAO, PLANO e FIM_TESTE (criados se faltarem);
 * - entra quem tem consentimento ativo; quem revogou é removido da lista;
 * - falha do Brevo nunca derruba a rotina: devolve `ok: false` com o motivo.
 *
 * O `fetch` é injetável (teste unitário). Com `EMAIL_TEST_MODE=1`, nada sai
 * para a rede: a função só conta o que faria.
 */
import { isEmailTestMode } from '@shared/lib/test-email-store';

const API = 'https://api.brevo.com/v3';
export const NOME_LISTA_PADRAO = 'xgestão assinantes';
const NOME_PASTA = 'xgestão';
const ATRIBUTOS: Array<{ nome: string; tipo: 'text' | 'date' }> = [
  { nome: 'SITUACAO', tipo: 'text' },
  { nome: 'PLANO', tipo: 'text' },
  { nome: 'FIM_TESTE', tipo: 'date' },
];
/** Limite do endpoint de remoção de contatos da lista. */
const LOTE_REMOCAO = 150;
const LOTE_IMPORTACAO = 500;

export interface ContatoBrevo {
  email: string;
  situacao: string;
  plano: string;
  /** `AAAA-MM-DD` ou nulo. */
  fimTeste: string | null;
}

export interface ResultadoSyncBrevo {
  ok: boolean;
  modo: 'real' | 'teste' | 'desligado';
  listaId: number | null;
  enviados: number;
  removidos: number;
  erro?: string;
}

type Fetch = typeof fetch;

class ErroBrevo extends Error {}

function cliente(apiKey: string, f: Fetch) {
  return async function chamar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
    const res = await f(`${API}${caminho}`, {
      method: metodo,
      headers: { 'api-key': apiKey, accept: 'application/json', 'content-type': 'application/json' },
      ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
    });
    if (!res.ok) {
      // Só o status e o código do Brevo: a resposta pode citar e-mails.
      let codigo = '';
      try {
        codigo = String(((await res.json()) as { code?: string }).code ?? '');
      } catch {
        // sem corpo
      }
      throw new ErroBrevo(`${metodo} ${caminho.split('?')[0]} -> ${res.status}${codigo ? ` ${codigo}` : ''}`);
    }
    if (res.status === 204) return {} as T;
    return (await res.json().catch(() => ({}))) as T;
  };
}

async function garantirLista(chamar: ReturnType<typeof cliente>, nome: string): Promise<number> {
  for (let offset = 0; offset < 1000; offset += 50) {
    const r = await chamar<{ lists?: Array<{ id: number; name: string }>; count?: number }>('GET', `/contacts/lists?limit=50&offset=${offset}`);
    const achada = r.lists?.find((l) => l.name === nome);
    if (achada) return achada.id;
    if (!r.lists || r.lists.length < 50) break;
  }
  const pastas = await chamar<{ folders?: Array<{ id: number; name: string }> }>('GET', '/contacts/folders?limit=50&offset=0');
  let pastaId = pastas.folders?.find((p) => p.name === NOME_PASTA)?.id;
  if (!pastaId) pastaId = (await chamar<{ id: number }>('POST', '/contacts/folders', { name: NOME_PASTA })).id;
  return (await chamar<{ id: number }>('POST', '/contacts/lists', { name: nome, folderId: pastaId })).id;
}

async function garantirAtributos(chamar: ReturnType<typeof cliente>): Promise<void> {
  const r = await chamar<{ attributes?: Array<{ name: string }> }>('GET', '/contacts/attributes');
  const existentes = new Set((r.attributes ?? []).map((a) => a.name.toUpperCase()));
  for (const a of ATRIBUTOS) {
    if (!existentes.has(a.nome)) await chamar('POST', `/contacts/attributes/normal/${a.nome}`, { type: a.tipo });
  }
}

export async function sincronizarContatosBrevo(
  contatos: readonly ContatoBrevo[],
  removidos: readonly string[],
  opcoes: { fetch?: Fetch; apiKey?: string | null; nomeLista?: string; modoTeste?: boolean } = {},
): Promise<ResultadoSyncBrevo> {
  const modoTeste = opcoes.modoTeste ?? isEmailTestMode();
  if (modoTeste && !opcoes.fetch) {
    return { ok: true, modo: 'teste', listaId: null, enviados: contatos.length, removidos: removidos.length };
  }
  const apiKey = opcoes.apiKey === undefined ? process.env.BREVO_API_KEY : opcoes.apiKey;
  if (!apiKey) return { ok: false, modo: 'desligado', listaId: null, enviados: 0, removidos: 0, erro: 'BREVO_API_KEY ausente' };

  const chamar = cliente(apiKey, opcoes.fetch ?? fetch);
  let listaId: number | null = null;
  let enviados = 0;
  let removidosOk = 0;
  try {
    listaId = await garantirLista(chamar, opcoes.nomeLista ?? process.env.BREVO_LISTA_XGESTAO ?? NOME_LISTA_PADRAO);
    if (contatos.length > 0) {
      await garantirAtributos(chamar);
      for (let i = 0; i < contatos.length; i += LOTE_IMPORTACAO) {
        const lote = contatos.slice(i, i + LOTE_IMPORTACAO);
        await chamar('POST', '/contacts/import', {
          listIds: [listaId],
          updateExistingContacts: true,
          emptyContactsAttributes: false,
          jsonBody: lote.map((c) => ({
            email: c.email,
            attributes: { SITUACAO: c.situacao, PLANO: c.plano, ...(c.fimTeste ? { FIM_TESTE: c.fimTeste } : {}) },
          })),
        });
        enviados += lote.length;
      }
    }
    for (let i = 0; i < removidos.length; i += LOTE_REMOCAO) {
      const lote = removidos.slice(i, i + LOTE_REMOCAO);
      try {
        await chamar('POST', `/contacts/lists/${listaId}/contacts/remove`, { emails: lote });
        removidosOk += lote.length;
      } catch (erro) {
        // 400 quando nenhum dos e-mails estava na lista: não é falha da rotina.
        if (!(erro instanceof ErroBrevo && / -> 400\b/.test(erro.message))) throw erro;
      }
    }
    return { ok: true, modo: 'real', listaId, enviados, removidos: removidosOk };
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    console.error(`[xgestao-brevo] falha na sincronização: ${motivo}`);
    return { ok: false, modo: 'real', listaId, enviados, removidos: removidosOk, erro: motivo };
  }
}
