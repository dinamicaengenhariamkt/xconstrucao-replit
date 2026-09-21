/**
 * XG27 — de onde vem o progresso de uma OBRA.
 *
 * Irmão de `etapa-progresso.ts`, um nível acima: aquele decide de onde vem o
 * percentual de cada etapa, este de onde vem o da obra inteira.
 *
 * A XG23 desligou as medições na obra própria e moveu o avanço para a barrinha
 * de cada etapa. O efeito colateral só apareceu agora: `obras.progresso` ficou
 * **sem nenhum escritor** nesse fluxo — a própria XG23 registrou a dívida ("a
 * coluna continua no banco e é lida por KPIs e projeções, mas nada a atualiza")
 * — e quem lia a coluna passou a mostrar zero para obra em pleno andamento.
 *
 * O relato do cliente, com o print do dashboard:
 *
 *   "esse apartamento do Fernando, eu já coloquei lá no cronograma os
 *    executados, as porcentagens, mas é de etapas. E ele conta como 0%. E o
 *    outro, 100%."
 *
 * Os dois números do print têm a mesma causa: 0% é obra criada depois da XG23,
 * cuja coluna nunca foi escrita; 100% é valor antigo, congelado desde a última
 * medição de antes da mudança.
 */

import { etapaProgressoEhDerivado } from './etapa-progresso';

export interface ProgressoObraInput {
  clienteId: string | null;
  /** `obras.progresso` — a coluna. */
  progressoColuna: number | null;
  /** Média de `obra_etapas.progresso`, ou `null` se a obra não tem etapa. */
  mediaEtapas: number | null;
}

/**
 * O progresso da obra, ou `null` quando não há como saber.
 *
 * **Marketplace** (`clienteId != null`): a coluna manda. Lá ela tem escritor
 * ativo — é o acumulador das medições que o contratante aprova, com peso
 * contratual — e seria errado substituí-la pela média das etapas.
 *
 * **Obra própria**: a verdade é a média das etapas, que é o que o dono digitou.
 *
 * O discriminador é o mesmo `clienteId` que o projeto já usa para separar os
 * dois produtos, reusado de `etapaProgressoEhDerivado` em vez de reimplementado:
 * se um dia a regra de separação mudar, muda num lugar só.
 *
 * **Média simples, não ponderada.** `obra_etapas` não tem coluna de peso, e
 * inventar uma (duração, valor) seria criar uma regra que o cliente não pediu e
 * não teria como conferir. Vale lembrar que foi justamente uma média
 * não-ponderada que causou o defeito da XG23 — mas lá o problema era a média
 * *substituir* o valor digitado; aqui ela agrega valores digitados, que é o uso
 * para o qual o cliente pediu a barrinha.
 *
 * **Por que `null` e não 0 para obra sem etapa.** Zero é uma afirmação — "esta
 * obra não avançou nada" — e o que se sabe é outra coisa: que não há cronograma
 * para medir. Devolver 0 aqui reproduziria, com outra fonte, exatamente o
 * defeito que esta jornada corrige: um número inventado com cara de dado. Quem
 * exibe decide como dizer isso (ver `progressoDisponivel` em `MinhaObra`).
 */
export function resolverProgressoObra(input: ProgressoObraInput): number | null {
  if (etapaProgressoEhDerivado(input)) return input.progressoColuna ?? 0;
  return input.mediaEtapas;
}

/**
 * Média simples de uma lista de etapas já carregada, ou `null` se não há etapa.
 *
 * Existe para o detalhe da obra, que já tem as etapas em memória e não precisa
 * de uma query só para isto. A lista usa `AVG` no Postgres, pelo motivo oposto:
 * lá são muitas obras e trazer todas as etapas seria desperdício.
 *
 * As duas somam do mesmo jeito e arredondam do mesmo jeito (`ROUND` do Postgres
 * e `Math.round` são half-up para positivos, e progresso é sempre 0..100).
 */
export function mediaProgressoEtapas(etapas: { progresso?: number | null }[]): number | null {
  if (etapas.length === 0) return null;
  const soma = etapas.reduce((total, etapa) => total + (etapa.progresso ?? 0), 0);
  return Math.round(soma / etapas.length);
}
