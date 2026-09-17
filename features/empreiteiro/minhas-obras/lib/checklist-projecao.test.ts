import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  aplicarToggleOtimista,
  calcularProgressoItens,
  normalizarChecklistResposta,
  type ChecklistPatchResponse,
} from './checklist-projecao';
import type { MinhaObraChecklist } from '../types';

/**
 * Este arquivo é o **contrato de paridade** entre a projeção do cliente
 * (`checklist-projecao.ts`) e a do servidor (`features/obras/api/checklist-recorrencia.ts`).
 *
 * O toggle é otimista: o tique aparece antes da resposta. Se as duas projeções
 * discordarem, o card mostra um status no clique e outro quando o servidor
 * responde — um flicker que ninguém associa à causa. Os casos abaixo travam as
 * regras que precisam ser idênticas nos dois lados.
 */

function checklistBase(over: Partial<MinhaObraChecklist> = {}): MinhaObraChecklist {
  return {
    id: 'c1',
    nome: 'EPIs',
    descricao: 'Conferência diária',
    tipo: 'seguranca',
    status: 'pendente',
    itens: [
      { id: 'i1', titulo: 'Capacete', concluida: false },
      { id: 'i2', titulo: 'Bota', concluida: false },
    ],
    recorrencia: 'diaria',
    ...over,
  };
}

test('recorrente — marcar o último item deixa o checklist completo no período', () => {
  const c = checklistBase({
    itens: [
      { id: 'i1', titulo: 'Capacete', concluida: true },
      { id: 'i2', titulo: 'Bota', concluida: false },
    ],
  });
  const r = aplicarToggleOtimista(c, 'i2');
  assert.equal(r.status, 'completo');
  assert.equal(r.pendenteNoPeriodo, false);
  assert.equal(r.progresso, 100);
});

test('recorrente — desmarcar um de todos marcados volta para em_andamento e limpa completadoEm', () => {
  const c = checklistBase({
    status: 'completo',
    completadoEm: '21:14',
    itens: [
      { id: 'i1', titulo: 'Capacete', concluida: true },
      { id: 'i2', titulo: 'Bota', concluida: true },
    ],
  });
  const r = aplicarToggleOtimista(c, 'i2');
  assert.equal(r.status, 'em_andamento');
  assert.equal(r.pendenteNoPeriodo, true);
  // "Concluído às 21:14" não vale para um período que voltou a ter pendência.
  assert.equal(r.completadoEm, undefined);
});

test('recorrente — desmarcar o único marcado volta para pendente', () => {
  const c = checklistBase({
    status: 'em_andamento',
    itens: [
      { id: 'i1', titulo: 'Capacete', concluida: true },
      { id: 'i2', titulo: 'Bota', concluida: false },
    ],
  });
  const r = aplicarToggleOtimista(c, 'i1');
  assert.equal(r.status, 'pendente');
  assert.equal(r.progresso, 0);
});

test('NÃO recorrente — o toggle não mexe no status (só Finalizar/Assinar mexe)', () => {
  /*
   * O caso que garante paridade com a rota: no caminho sem período ela só faz
   * `UPDATE obra_checklist_itens SET concluida` e nunca toca em
   * `obra_checklists.status`. Derivar status aqui faria o badge divergir da
   * resposta que está a caminho.
   */
  const c = checklistBase({
    recorrencia: 'nenhuma',
    status: 'pendente',
    itens: [
      { id: 'i1', titulo: 'Capacete', concluida: true },
      { id: 'i2', titulo: 'Bota', concluida: false },
    ],
  });
  const r = aplicarToggleOtimista(c, 'i2');
  assert.equal(r.status, 'pendente');
  assert.equal(r.itens.every((i) => i.concluida), true);
  assert.equal(r.progresso, 100);
});

test('recorrência ausente é tratada como nenhuma', () => {
  const c = checklistBase({ recorrencia: undefined, status: 'pendente' });
  const r = aplicarToggleOtimista(c, 'i1');
  assert.equal(r.status, 'pendente');
});

test('toggle não altera os outros itens nem muta o original', () => {
  const c = checklistBase();
  const r = aplicarToggleOtimista(c, 'i1');
  assert.equal(r.itens[0].concluida, true);
  assert.equal(r.itens[1].concluida, false);
  // O snapshot de rollback do onMutate depende de o original ficar intacto.
  assert.equal(c.itens[0].concluida, false);
});

test('calcularProgressoItens — lista vazia é 0, não NaN', () => {
  assert.equal(calcularProgressoItens([]), 0);
});

test('normalizarChecklistResposta — null vira undefined e progresso é calculado', () => {
  const resp: ChecklistPatchResponse = {
    id: 'c1',
    nome: 'EPIs',
    descricao: null,
    tipo: 'seguranca',
    status: 'em_andamento',
    itens: [
      { id: 'i1', titulo: 'Capacete', concluida: true },
      { id: 'i2', titulo: 'Bota', concluida: false },
    ],
    completadoEm: null,
    assinadoPor: null,
    assinadoEm: null,
    registroProfissional: null,
    recorrencia: 'diaria',
    recorrenciaDiaSemana: null,
    pendenteNoPeriodo: true,
  };
  const r = normalizarChecklistResposta(resp);
  assert.equal(r.descricao, '');
  assert.equal(r.completadoEm, undefined);
  assert.equal(r.assinadoPor, undefined);
  assert.equal(r.registroProfissional, undefined);
  assert.equal(r.recorrenciaDiaSemana, undefined);
  assert.equal(r.progresso, 50);
});

test('normalizarChecklistResposta — itens ficam só com id, titulo e concluida', () => {
  // A rota devolve os itens com `checklistId` e `ordem`, que a tela não usa.
  const resp = {
    id: 'c1',
    nome: 'EPIs',
    descricao: 'x',
    tipo: 'seguranca',
    status: 'completo',
    itens: [{ id: 'i1', titulo: 'Capacete', concluida: true, checklistId: 'c1', ordem: 0 }],
    completadoEm: '21:14',
    assinadoPor: 'Eng. Teste',
    assinadoEm: '17/09/2026 21:14',
    registroProfissional: 'CREA-123',
    recorrencia: 'nenhuma',
    recorrenciaDiaSemana: null,
    pendenteNoPeriodo: false,
  } as unknown as ChecklistPatchResponse;
  const r = normalizarChecklistResposta(resp);
  assert.deepEqual(Object.keys(r.itens[0]).sort(), ['concluida', 'id', 'titulo']);
  assert.equal(r.assinadoPor, 'Eng. Teste');
  assert.equal(r.progresso, 100);
});
