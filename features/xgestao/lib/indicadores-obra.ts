/**
 * XG27 — os dois sinais do dashboard do xgestão: a obra está no prazo, e o
 * dinheiro está dentro do orçamento?
 *
 * Do pedido do cliente:
 *
 *   "o que pode mostrar no dashboard, eu acho que é saúde financeira (...) só
 *    mostra no dashboard se está no prazo e o financeiro da obra como está. Se
 *    está verdinho, se está vermelho, entendeu?"
 *
 * **Isto não é o `HealthSummary` voltando.** A XG17 tirou a Saúde do xgestão
 * inteiro porque ela "media, mas não comunicava": score de 0 a 100 com três
 * fatores ponderados exigia conhecer a régua por trás para significar alguma
 * coisa, e para o dono da obra virava alarme sem ação. O que entra aqui são
 * duas perguntas que ele responde de cabeça — atrasou? gastei mais do que o
 * orçado? —, cada uma com o número visível ao lado da cor.
 *
 * Por isso também são funções puras e ridiculamente simples: a régua tem de
 * caber numa frase, senão volta a ser o que foi removido.
 */

export type Semaforo = 'ok' | 'atencao' | 'critico' | 'sem_dado';

/**
 * Quanto do orçamento já foi consumido pelo custo real da obra.
 *
 * Faixas: verde abaixo de 80%, âmbar de 80% a 100%, vermelho acima de 100%.
 * O 80 é inclusivo no âmbar — 79% ainda é tranquilo, 80% já merece o aviso —
 * e o 100 também, porque gastar exatamente o orçado não é estouro, mas é o
 * fim da folga.
 *
 * `null` (→ `sem_dado`) quando a obra não tem orçamento lançado: sem
 * denominador não há percentual, e mostrar verde seria afirmar uma folga que
 * ninguém verificou.
 */
export function semaforoFinanceiro(consumoOrcamento: number | null): Semaforo {
  if (consumoOrcamento === null) return 'sem_dado';
  if (consumoOrcamento > 100) return 'critico';
  if (consumoOrcamento >= 80) return 'atencao';
  return 'ok';
}

/**
 * Prazo é binário: ou a data prevista passou, ou não passou.
 *
 * Sem faixa de "atenção" de propósito. Inventar uma ("faltam 5 dias") exigiria
 * uma régua que o cliente não pediu, e o dado que temos — `diasAtraso`, já
 * calculado na listagem — só conta dias **depois** do prazo. Obra concluída e
 * obra sem prazo chegam aqui com 0, que é a leitura certa: não há atraso a
 * apontar.
 */
export function semaforoPrazo(diasAtraso: number): Semaforo {
  return diasAtraso > 0 ? 'critico' : 'ok';
}

/**
 * O pior dos dois sinais, para a coluna "Situação" e para a ordenação da
 * tabela. `sem_dado` não piora nada: não saber o orçamento de uma obra não a
 * torna problemática, só menos informada.
 */
export function situacaoObra(prazo: Semaforo, financeiro: Semaforo): Semaforo {
  const ordem: Semaforo[] = ['ok', 'sem_dado', 'atencao', 'critico'];
  return ordem.indexOf(prazo) >= ordem.indexOf(financeiro) ? prazo : financeiro;
}
