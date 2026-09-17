import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  dataLocalISO,
  diaDaSemanaLocal,
  periodoAtual,
  rotuloRecorrencia,
} from './checklist-periodo';

/**
 * XG21 — a virada do período é o coração do reset e falha em silêncio: se o
 * fuso escorregar, o checklist zera na hora errada e ninguém percebe até o
 * cliente reclamar que "sumiu o tique no meio do dia".
 *
 * São Paulo é UTC-3 (sem horário de verão desde 2019), então as datas abaixo
 * são escolhidas para cair dos dois lados da meia-noite local.
 */

test('diaria — 23:59 local ainda é o dia que está terminando', () => {
  // 2026-03-10T23:59 em São Paulo = 2026-03-11T02:59Z
  assert.equal(periodoAtual('diaria', null, new Date('2026-03-11T02:59:00Z')), '2026-03-10');
});

test('diaria — 00:01 local já é o dia seguinte (o reset)', () => {
  // 2026-03-11T00:01 em São Paulo = 2026-03-11T03:01Z
  assert.equal(periodoAtual('diaria', null, new Date('2026-03-11T03:01:00Z')), '2026-03-11');
});

test('diaria — meia-noite UTC ainda é o dia anterior em São Paulo', () => {
  // O bug clássico: usar UTC viraria o dia 3h antes da meia-noite da obra.
  assert.equal(periodoAtual('diaria', null, new Date('2026-03-11T00:00:00Z')), '2026-03-10');
});

test('nenhuma — sem recorrência não há período', () => {
  assert.equal(periodoAtual('nenhuma', null, new Date('2026-03-11T12:00:00Z')), null);
});

test('semanal — todos os dias da mesma semana caem no mesmo balde', () => {
  // Semana de segunda 2026-03-09 a domingo 2026-03-15, âncora = segunda (1).
  const esperado = '2026-03-09';
  for (const dia of ['09', '10', '11', '12', '13', '14', '15']) {
    assert.equal(
      periodoAtual('semanal', 1, new Date(`2026-03-${dia}T15:00:00Z`)),
      esperado,
      `dia ${dia} deveria cair em ${esperado}`,
    );
  }
});

test('semanal — a semana seguinte abre um balde novo', () => {
  assert.equal(periodoAtual('semanal', 1, new Date('2026-03-16T15:00:00Z')), '2026-03-16');
});

test('semanal — domingo como âncora não volta 7 dias', () => {
  // Domingo (0) ancorado em domingo: recuo 0, não 7.
  assert.equal(periodoAtual('semanal', 0, new Date('2026-03-15T15:00:00Z')), '2026-03-15');
  // Segunda seguinte pertence à semana que abriu no domingo.
  assert.equal(periodoAtual('semanal', 0, new Date('2026-03-16T15:00:00Z')), '2026-03-15');
});

test('semanal — dia inválido cai no default (segunda)', () => {
  const comNulo = periodoAtual('semanal', null, new Date('2026-03-11T15:00:00Z'));
  assert.equal(comNulo, '2026-03-09');
  assert.equal(periodoAtual('semanal', 99, new Date('2026-03-11T15:00:00Z')), comNulo);
});

test('semanal — atravessa a virada de mês', () => {
  // Quarta 2026-04-01 pertence à semana que começou na segunda 2026-03-30.
  assert.equal(periodoAtual('semanal', 1, new Date('2026-04-01T15:00:00Z')), '2026-03-30');
});

test('dataLocalISO e diaDaSemanaLocal usam o fuso da obra', () => {
  const instante = new Date('2026-03-11T02:00:00Z'); // 23:00 de 10/03 em SP
  assert.equal(dataLocalISO(instante), '2026-03-10');
  assert.equal(diaDaSemanaLocal(instante), 2); // terça
});

test('rotuloRecorrencia descreve o ciclo', () => {
  assert.equal(rotuloRecorrencia('nenhuma', null), null);
  assert.equal(rotuloRecorrencia('diaria', null), 'Repete todo dia');
  assert.equal(rotuloRecorrencia('semanal', 1), 'Repete toda segunda');
  assert.equal(rotuloRecorrencia('semanal', 5), 'Repete toda sexta');
});
