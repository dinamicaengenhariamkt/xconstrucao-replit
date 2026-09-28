import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EtapasJ06Card } from '@features/obras/medicoes/components/EtapasJ06Card';
import { DiarioJ06Card } from '@features/obras/medicoes/components/DiarioJ06Card';
import { OcorrenciasJ06Card } from '@features/obras/medicoes/components/OcorrenciasJ06Card';
import { FotosJ06Card } from '@features/obras/medicoes/components/FotosJ06Card';
import { CronogramaGanttCard } from '@features/empreiteiro/minhas-obras/components/CronogramaGanttCard';
import { ObraPublicaShell } from '@features/xgestao/obra-publica/components/ObraPublicaShell';
import { SECOES_PADRAO } from '@features/xgestao/obra-publica/secoes';

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
        // XG30 — o Gantt do console, alimentado pela projeção pública.
        createElement(CronogramaGanttCard, {
          obraId: 'obra-publica-fixture',
          readOnly: true,
          data: [{
            id: 'etapa-gantt',
            nome: 'Alvenaria do Gantt',
            descricao: null,
            progresso: 50,
            status: 'em_andamento',
            dataInicio: '2026-09-01T00:00:00.000Z',
            prazo: '2026-09-20T00:00:00.000Z',
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
  assert.match(markup, /Alvenaria do Gantt/);
  assert.doesNotMatch(markup, /Nova etapa|Publicar|Nova ocorrência|Enviar foto|Resolver|Excluir/);
  // Quem vê o link não tem aba Etapas para editar datas.
  assert.doesNotMatch(markup, /aba Etapas|Informar datas|Cadastrar etapas/);

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
            cidade: 'São Paulo',
            uf: 'SP',
            logradouro: null,
            dataInicio: '2026-09-10',
            dataPrevisao: '2027-02-20',
            imagemUrl: null,
            ultimaAtualizacao: null,
          },
          etapas: [],
          diario: [],
          ocorrencias: [],
          fotos: [],
          tarefas: [],
          pagamentos: null,
          secoes: SECOES_PADRAO,
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
  // XG30 — Atualizações e Checklists saíram do link; Cronograma entrou;
  // Pagamentos não aparece sem a seção ligada.
  assert.doesNotMatch(shellMarkup, /Atualizações|Checklists|Pagamentos/);
  assert.match(shellMarkup, /Cronograma/);

  const pagamentosMarkup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement(ObraPublicaShell, {
        view: {
          obra: {
            id: 'obra-publica-pagamentos',
            titulo: 'Obra com pagamentos',
            tipo: null,
            descricao: null,
            areaM2: null,
            status: 'em_andamento',
            cidade: null,
            uf: null,
            logradouro: null,
            dataInicio: null,
            dataPrevisao: null,
            imagemUrl: null,
            ultimaAtualizacao: null,
          },
          etapas: [],
          diario: [],
          ocorrencias: [],
          fotos: [],
          tarefas: [],
          pagamentos: {
            valorTotal: 100000,
            recebido: 40000,
            saldo: 60000,
            parcelas: [
              { id: 'p1', descricao: 'Entrada', valor: 40000, vencimento: '2026-09-01', pagoEm: '2026-09-01', status: 'pago' },
            ],
          },
          // Só Pagamentos ligado: vira a aba inicial e renderiza no SSR.
          secoes: Object.fromEntries(
            Object.keys(SECOES_PADRAO).map((secao) => [secao, secao === 'pagamentos']),
          ) as typeof SECOES_PADRAO,
        },
      }),
    ),
  );
  assert.match(pagamentosMarkup, /Pagamentos/);
  assert.match(pagamentosMarkup, /Entrada/);
  assert.match(pagamentosMarkup, /60\.000,00/);

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
            cidade: null,
            uf: null,
            logradouro: null,
            dataInicio: null,
            dataPrevisao: null,
            imagemUrl: null,
            ultimaAtualizacao: null,
          },
          etapas: [],
          diario: [],
          ocorrencias: [],
          fotos: [],
          tarefas: [],
          pagamentos: null,
          secoes: SECOES_PADRAO,
        },
      }),
    ),
  );
  assert.doesNotMatch(minimalShellMarkup, /Detalhes da obra|Tipo de obra|Área|Início|Previsão de término/);
} finally {
  global.fetch = originalFetch;
  client.clear();
}