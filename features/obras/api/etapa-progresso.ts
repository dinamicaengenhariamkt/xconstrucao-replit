/**
 * XG23 — de onde vem o progresso de uma etapa.
 *
 * Havia uma única regra para os dois produtos: a etapa era sempre a média do
 * progresso das tarefas dela. O cliente do xgestão desmontou essa premissa:
 *
 *   "eu crio uma etapa, uma tarefa dentro da etapa, aí se eu conclui essa
 *    tarefa, ela conclui a etapa, cara (...) tá uma bagunça (...) tira isso
 *    tudo, e deixa só a etapas, e a etapa deixa com uma barrinha manual mesmo"
 *
 * A reclamação é exata. A média é não-ponderada, então numa etapa com uma
 * tarefa só concluir a tarefa fechava a etapa inteira. Na obra própria o
 * percentual passa a ser digitado, e este módulo é o que impede o cálculo
 * antigo de voltar por cima dele.
 *
 * No marketplace nada muda: lá a medição é contratual — o contratante aprova e
 * isso libera pagamento —, e a etapa derivada das tarefas medidas é o
 * comportamento correto.
 */

/**
 * A etapa tem progresso derivado (média das tarefas) ou digitado à mão?
 *
 * `clienteId` é o discriminador que o projeto já usa para separar os dois
 * produtos: obra de marketplace tem contratante, obra do xgestão não.
 *
 * Por que gatear o recálculo e não confiar só em esconder a UI: as rotas de
 * tarefa continuam ativas e alcançáveis, e as obras próprias já têm tarefas
 * gravadas de antes. Bastaria alguém tocar numa delas para a média apagar o
 * valor digitado. E o cliente avisou que as tarefas voltam ("posteriormente a
 * gente vai querer implementar tarefas dentro da etapa") — deixar o recálculo
 * ligado seria plantar de novo o defeito que esta jornada acabou de remover.
 */
export function etapaProgressoEhDerivado(obra: { clienteId: string | null }): boolean {
  return obra.clienteId !== null;
}
