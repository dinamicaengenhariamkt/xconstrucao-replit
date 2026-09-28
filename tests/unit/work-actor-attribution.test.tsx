import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TimelineDisplay } from '@features/shared/components/TimelineDisplay';
import { toAtividadeDisplay, type AtividadeFeedItem } from '@features/atividades/hooks/use-atividades';

function atividade(actorName: string | null): AtividadeFeedItem {
  return {
    id: 'atividade-1',
    tipo: 'lancamento_criado',
    actorUserId: actorName ? 'user-1' : null,
    obraId: 'obra-1',
    targetUserId: null,
    payload: { lancamentoId: 'lancamento-1' },
    createdAt: '2026-09-12T12:00:00.000Z',
    actorName,
    actorRole: actorName ? 'empreiteiro' : null,
    obraNome: 'Obra própria',
  };
}

describe('atribuição de ator em obra', () => {
  it('mantém o nome de sistema no adaptador usado pelo marketplace', () => {
    assert.equal(toAtividadeDisplay(atividade(null), 'contratante').actorName, 'Sistema');
  });

  it('oculta ator desconhecido na timeline de obra e mostra nome conhecido', () => {
    const baseEvent = {
      id: 'event-1',
      tipo: 'documento' as const,
      titulo: 'Lançamento criado',
      descricao: 'Entrada registrada',
      data: '2026-09-12T12:00:00.000Z',
    };
    const markup = renderToStaticMarkup(
      createElement(TimelineDisplay, {
        events: [
          { ...baseEvent, autor: null },
          { ...baseEvent, id: 'event-2', autor: 'Ana Lima' },
        ],
      }),
    );

    assert.doesNotMatch(markup, /Sistema/);
    assert.match(markup, /Ana Lima/);
  });
});