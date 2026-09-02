import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EtapasJ06Card } from '@features/obras/medicoes/components/EtapasJ06Card';
import { DiarioJ06Card } from '@features/obras/medicoes/components/DiarioJ06Card';
import { OcorrenciasJ06Card } from '@features/obras/medicoes/components/OcorrenciasJ06Card';
import { FotosJ06Card } from '@features/obras/medicoes/components/FotosJ06Card';
import { ObraPublicaShell } from '@features/xgestao/obra-publica/components/ObraPublicaShell';

const client = new QueryClient();
const calls: string[] = [];
const originalFetch = global.fetch;

global.fetch = (async (input: string | URL | Request) => {
  calls.push(String(input));
  throw new Error('O modo público não deve buscar dados autenticados.');
}) as typeof fetch;

try {
  const cardProps = { obraId: 'obra-publica-fixture', canWrite: false };
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement('div', null,
        createElement(EtapasJ06Card, {
          ...cardProps,
          canEditScope: false,
          data: [{ id: 'etapa-1', nome: 'Fundação', descricao: null, progresso: 35, status: 'em_andamento' }],
        }),
        createElement(DiarioJ06Card, {
          ...cardProps,
          data: [{ id: 'diario-1', texto: 'Concretagem concluída.', createdAt: '2026-08-21T12:00:00.000Z', fotos: [] }],
        }),
        createElement(OcorrenciasJ06Card, {
          ...cardProps,
          data: [{
            id: 'ocorrencia-1',
            titulo: 'Acesso',
            descricao: 'Aguardar liberação.',
            gravidade: 'baixo',
            status: 'aberta',
            fotoUrl: null,
            createdAt: '2026-08-21T12:00:00.000Z',
          }],
        }),
        createElement(FotosJ06Card, {
          ...cardProps,
          data: [{
            id: 'foto-1',
            url: 'https://cdn.example.com/foto-publica.jpg',
            fase: 'durante',
            tag: null,
            createdAt: '2026-08-21T12:00:00.000Z',
          }],
        }),
      ),
    ),
  );

  assert.deepEqual(calls, []);
  assert.match(markup, /Fundação/);
  assert.match(markup, /Concretagem concluída/);
  assert.match(markup, /Aguardar liberação/);
  assert.match(markup, /https:\/\/cdn\.example\.com\/foto-publica\.jpg/);
  assert.doesNotMatch(markup, /Nova etapa|Publicar|Nova ocorrência|Enviar foto|Resolver|Excluir/);

  const shellMarkup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement(ObraPublicaShell, {
        view: {
          obra: {
            id: 'obra-publica-fixture',
            titulo: 'Residência Alameda',
            tipo: 'Reforma residencial',
            descricao: 'Modernização dos ambientes.',
            areaM2: '84.50',
            status: 'em_andamento',
            progresso: 35,
            cidade: 'São Paulo',
            uf: 'SP',
            dataInicio: '2026-09-10',
            dataPrevisao: '2027-02-20',
            imagemUrl: null,
            ultimaAtualizacao: null,
          },
          etapas: [],
          diario: [],
          ocorrencias: [],
          fotos: [],
          checklists: [],
        },
      }),
    ),
  );
  assert.match(shellMarkup, /Detalhes da obra/);
  assert.match(shellMarkup, /Reforma residencial/);
  assert.match(shellMarkup, /Modernização dos ambientes/);
  assert.match(shellMarkup, /84,5 m²/);
  assert.match(shellMarkup, /10\/09\/2026/);
  assert.match(shellMarkup, /20\/02\/2027/);
  assert.doesNotMatch(shellMarkup, /Orçamento|Endereço|Equipe|Documento/);

  const minimalShellMarkup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement(ObraPublicaShell, {
        view: {
          obra: {
            id: 'obra-publica-minimal',
            titulo: 'Obra sem opcionais',
            tipo: null,
            descricao: null,
            areaM2: null,
            status: 'planejamento',
            progresso: 0,
            cidade: null,
            uf: null,
            dataInicio: null,
            dataPrevisao: null,
            imagemUrl: null,
            ultimaAtualizacao: null,
          },
          etapas: [],
          diario: [],
          ocorrencias: [],
          fotos: [],
          checklists: [],
        },
      }),
    ),
  );
  assert.doesNotMatch(minimalShellMarkup, /Detalhes da obra|Tipo de obra|Área|Início|Previsão de término/);
} finally {
  global.fetch = originalFetch;
  client.clear();
}