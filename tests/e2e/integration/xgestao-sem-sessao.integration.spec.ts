import { expect, test } from '@playwright/test';

/**
 * TST-07 — toda rota do xgestão sem sessão responde 401.
 *
 * Laço por rota e método: uma rota nova que esqueça o `requireVerifiedUser`
 * aparece aqui como falha nominal, em vez de passar despercebida. Os ids são
 * fictícios de propósito: sem sessão, a resposta tem de ser 401 antes de
 * qualquer busca (404 aqui revelaria que a rota consulta o banco sem login).
 *
 * Fora da lista: `/api/obras/destaque` (vitrine pública do marketplace).
 */

const OBRA = '00000000-0000-4000-8000-000000000001';
const ITEM = '00000000-0000-4000-8000-000000000002';

type Metodo = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const ROTAS: Array<[string, Metodo[]]> = [
  // /api/xgestao/*
  ['/api/xgestao/obras', ['POST']],
  ['/api/xgestao/perfil-status', ['GET']],
  ['/api/xgestao/teste', ['POST']],
  ['/api/xgestao/teste/continuar-free', ['POST']],
  ['/api/xgestao/membros', ['GET', 'POST']],
  [`/api/xgestao/membros/${ITEM}`, ['PATCH', 'DELETE']],
  [`/api/xgestao/membros/${ITEM}/reenviar`, ['POST']],
  [`/api/xgestao/obras/${OBRA}/share`, ['GET', 'POST']],
  [`/api/xgestao/obras/${OBRA}/share/${ITEM}`, ['PATCH', 'DELETE']],
  // /api/obras/* (obra e subitens)
  ['/api/obras', ['POST']],
  [`/api/obras/${OBRA}`, ['GET', 'PATCH', 'DELETE']],
  [`/api/obras/${OBRA}/health`, ['GET']],
  [`/api/obras/${OBRA}/storage`, ['GET']],
  [`/api/obras/${OBRA}/medicoes`, ['GET']],
  [`/api/obras/${OBRA}/contrato`, ['GET']],
  [`/api/obras/${OBRA}/contrato/assinar`, ['POST']],
  [`/api/obras/${OBRA}/contrato/cancelar`, ['POST']],
  [`/api/obras/${OBRA}/disputas`, ['GET']],
  ...(['financeiro', 'aditivos', 'etapas', 'tarefas', 'checklists', 'diario', 'fotos', 'equipe', 'ocorrencias'] as const)
    .flatMap((aba): Array<[string, Metodo[]]> => [
      [`/api/obras/${OBRA}/${aba}`, ['GET', 'POST']],
      [`/api/obras/${OBRA}/${aba}/${ITEM}`, ['PATCH', 'DELETE']],
    ]),
  [`/api/obras/${OBRA}/anexos`, ['GET', 'POST']],
  [`/api/obras/${OBRA}/anexos/${ITEM}`, ['DELETE']],
  [`/api/obras/${OBRA}/ocorrencias/${ITEM}/resolver`, ['POST']],
  [`/api/obras/${OBRA}/ocorrencias/${ITEM}/reabrir`, ['POST']],
];

test.describe('TST-07 — rotas do xgestão sem sessão', () => {
  for (const [rota, metodos] of ROTAS) {
    for (const metodo of metodos) {
      test(`${metodo} ${rota.replaceAll(OBRA, ':obra').replaceAll(ITEM, ':id')} → 401`, async ({ request }) => {
        const r = await request.fetch(rota, {
          method: metodo,
          ...(metodo === 'GET' || metodo === 'DELETE' ? {} : { data: {} }),
          maxRedirects: 0,
        });
        expect(r.status(), `${metodo} ${rota}: ${await r.text()}`).toBe(401);
      });
    }
  }
});
