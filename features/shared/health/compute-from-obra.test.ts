import assert from "node:assert/strict";
import test from "node:test";
import { computeHealthFromObra, type HealthObraInput } from "./compute-from-obra";

/**
 * XG10 — o relato que originou estes testes: "eu comecei só para encher, o
 * negócio já está dando risco para mim" (11:42). A obra recém-criada, sem
 * contrato nem pagamento, era punida no fator financeiro porque `valorPago`
 * ficava 0 e qualquer progresso virava "gap" entre execução e pagamento.
 */

function obra(over: Partial<HealthObraInput> = {}): HealthObraInput {
  return {
    progresso: 0,
    diasAtraso: 0,
    problemasAbertos: 0,
    tarefasPendentes: 0,
    tarefasTotal: 0,
    financeiro: { valorContratado: 0, valorTotal: 0, saldoReceber: 0 },
    valorPago: 0,
    ...over,
  };
}

test("obra recém-criada, sem nada lançado, é saudável", () => {
  const h = computeHealthFromObra(obra());
  assert.equal(h.status, "saudavel");
  assert.equal(h.factors.financeiro, 100);
  assert.equal(h.reasons.length, 0);
});

test("progresso sem dado financeiro NÃO derruba a saúde", () => {
  // Antes: gap = 0.34 ⇒ financeiro = 59 ⇒ status "atencao".
  // O avanço da obra não é sintoma de problema financeiro.
  const h = computeHealthFromObra(obra({ progresso: 34 }));
  assert.equal(h.factors.financeiro, 100);
  assert.equal(h.status, "saudavel");

  // Mesmo perto do fim, sem contrato lançado não há o que apontar.
  const quaseFim = computeHealthFromObra(obra({ progresso: 90 }));
  assert.equal(quaseFim.factors.financeiro, 100);
  assert.equal(quaseFim.status, "saudavel");
});

test("com contrato lançado, o desalinhamento volta a pesar", () => {
  // 50% executado e nada recebido: aí sim há gap real a sinalizar.
  const h = computeHealthFromObra(
    obra({
      progresso: 50,
      financeiro: { valorContratado: 100_000, valorTotal: 100_000, saldoReceber: 100_000 },
      valorPago: 0,
    }),
  );
  assert.equal(h.factors.financeiro, 40);
  assert.notEqual(h.status, "saudavel");
});

test("pagamento acompanhando a execução mantém o fator alto", () => {
  const h = computeHealthFromObra(
    obra({
      progresso: 50,
      financeiro: { valorContratado: 100_000, valorTotal: 100_000, saldoReceber: 50_000 },
      valorPago: 50_000,
    }),
  );
  assert.equal(h.factors.financeiro, 100);
  assert.equal(h.status, "saudavel");
});

test("lançamento de entrada/saída também conta como dado financeiro", () => {
  // Obra do xgestão sem `valorTotal` preenchido, mas com dinheiro lançado:
  // o fator deixa de ser neutro porque agora há o que comparar.
  const h = computeHealthFromObra(
    obra({
      progresso: 60,
      financeiro: {
        valorContratado: 0,
        valorTotal: 0,
        saldoReceber: 0,
        receitaTotal: 250,
        custoTotal: 100,
      },
    }),
  );
  assert.ok(h.factors.financeiro < 100, "com lançamento, o fator volta a medir");
});

test("atraso e tarefas seguem pesando normalmente", () => {
  const atrasada = computeHealthFromObra(obra({ diasAtraso: 20 }));
  assert.equal(atrasada.factors.atraso, 20);
  assert.equal(atrasada.status, "risco");

  const comPendencias = computeHealthFromObra(
    obra({ tarefasTotal: 10, tarefasPendentes: 9 }),
  );
  assert.equal(comPendencias.factors.tarefas, 10);
  assert.equal(comPendencias.status, "risco");
});

test("obra sem tarefas e sem problemas não inventa pendência", () => {
  const h = computeHealthFromObra(obra({ tarefasTotal: 0, problemasAbertos: 0 }));
  assert.equal(h.factors.tarefas, 100);
});
