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

/**
 * XG15 — a outra metade do relato de 11:42, que a XG10 não cobriu.
 *
 * A XG10 corrigiu o fator financeiro e o KPI de tarefas, mas o score continuou
 * lendo `tarefasPendentes` (que inclui `em_andamento`). Na prática, a obra no
 * prazo em que o empreiteiro começou a trabalhar caía em "Risco" — exatamente
 * o "eu tô executando o serviço, tá dando alerta" (28:00).
 */

test("tarefa em andamento NÃO é pendência: quem trabalha não vira risco", () => {
  // O caso do relato: uma tarefa criada e posta em execução.
  const trabalhando = computeHealthFromObra(
    obra({ tarefasTotal: 1, tarefasPendentes: 1, tarefasEmAndamento: 1 }),
  );
  assert.equal(trabalhando.status, "saudavel");
  assert.ok(
    trabalhando.factors.tarefas >= 60,
    `esperado fator alto para obra em execução, veio ${trabalhando.factors.tarefas}`,
  );

  // Vale em escala: dez frentes abertas continuam sendo trabalho, não dívida.
  const dezFrentes = computeHealthFromObra(
    obra({ tarefasTotal: 10, tarefasPendentes: 10, tarefasEmAndamento: 10 }),
  );
  assert.equal(dezFrentes.status, "saudavel");
});

test("planejar a obra não derruba a saúde", () => {
  // Antes: cadastrar o plano levava de "saudável 100" para "risco 75".
  const soPlano = computeHealthFromObra(
    obra({ tarefasTotal: 8, tarefasPendentes: 8, tarefasEmAndamento: 0 }),
  );
  assert.equal(soPlano.factors.tarefas, 100);
  assert.equal(soPlano.status, "saudavel");
  assert.equal(soPlano.reasons.length, 0);
});

test("obra realmente parada continua sinalizando", () => {
  // Metade do plano parado enquanto a obra anda: o indicador tem de falar.
  const metadeParada = computeHealthFromObra(
    obra({ tarefasTotal: 10, tarefasPendentes: 10, tarefasEmAndamento: 5 }),
  );
  assert.notEqual(metadeParada.status, "saudavel");

  // E problema aberto continua pesando mesmo com todo mundo trabalhando.
  const comProblemas = computeHealthFromObra(
    obra({ tarefasTotal: 5, tarefasPendentes: 5, tarefasEmAndamento: 5, problemasAbertos: 2 }),
  );
  assert.ok(
    comProblemas.factors.tarefas < 100,
    "problema aberto deve descontar do fator",
  );
});

test("o motivo diz o número, não uma frase genérica", () => {
  const h = computeHealthFromObra(
    obra({ tarefasTotal: 10, tarefasPendentes: 10, tarefasEmAndamento: 1 }),
  );
  const motivo = h.reasons.find((r) => r.fator === "tarefas");
  assert.ok(motivo, "esperava um motivo para o fator tarefas");
  assert.match(motivo!.mensagem, /9 tarefas ainda não foram iniciadas/);

  // 12 dias ⇒ fator 52, abaixo do limiar individual: aí sim vira motivo.
  // (3 dias dariam 88, que é saudável e, corretamente, não gera alerta.)
  const atrasada = computeHealthFromObra(obra({ diasAtraso: 12 }));
  const motivoAtraso = atrasada.reasons.find((r) => r.fator === "atraso");
  assert.ok(motivoAtraso, "esperava um motivo para o fator atraso");
  assert.match(motivoAtraso!.mensagem, /12 dias além da data prevista/);
});

test("tarefa concluída conta integralmente", () => {
  const todasFeitas = computeHealthFromObra(
    obra({ tarefasTotal: 4, tarefasPendentes: 0, tarefasEmAndamento: 0 }),
  );
  assert.equal(todasFeitas.factors.tarefas, 100);
  assert.equal(todasFeitas.status, "saudavel");
});
