import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carimbarAssinaturaChecklist } from '../../features/obras/api/checklist-assinatura';
import {
  formatarMomentoChecklist,
  preposicaoMomento,
} from '../../features/empreiteiro/minhas-obras/lib/checklist-momento';

const AGORA = new Date('2026-11-10T17:30:00.000Z');

test('EMP-08: assinar ignora a data do cliente e grava o usuário logado', () => {
  const r = carimbarAssinaturaChecklist(
    { assinadoPor: '  Eng. Ana  ', assinadoEm: '01/01/2000 00:00', completadoEm: '00:00' },
    'user-1',
    AGORA,
  );
  assert.deepEqual(r, {
    completadoEm: AGORA.toISOString(),
    assinadoPor: 'Eng. Ana',
    assinadoEm: AGORA.toISOString(),
    assinadoPorUserId: 'user-1',
  });
});

test('EMP-08: finalizar sem assinar só carimba a conclusão', () => {
  assert.deepEqual(carimbarAssinaturaChecklist({ completadoEm: '23:59' }, 'u', AGORA), {
    completadoEm: AGORA.toISOString(),
  });
});

test('EMP-08: reabrir limpa tudo, inclusive o usuário', () => {
  assert.deepEqual(
    carimbarAssinaturaChecklist({ assinadoPor: null, assinadoEm: null, completadoEm: null }, 'u', AGORA),
    { completadoEm: null, assinadoPor: null, assinadoEm: null, assinadoPorUserId: null },
  );
});

test('EMP-08: assinadoEm sozinho com texto é ignorado', () => {
  assert.deepEqual(carimbarAssinaturaChecklist({ assinadoEm: '01/01/2000' }, 'u', AGORA), {});
});

test('exibição: ISO vira data e hora de Brasília; legado fica igual', () => {
  assert.equal(formatarMomentoChecklist(AGORA.toISOString()), '10/11/2026 14:30');
  assert.equal(preposicaoMomento(AGORA.toISOString()), 'em');
  assert.equal(formatarMomentoChecklist('21:14'), '21:14');
  assert.equal(preposicaoMomento('21:14'), 'às');
  assert.equal(formatarMomentoChecklist('17/09/2026 21:14'), '17/09/2026 21:14');
  assert.equal(formatarMomentoChecklist(null), '');
});
