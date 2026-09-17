/**
 * Projeção de checklist no cliente — o espelho de `projetarChecklist`.
 *
 * O toggle de item era o caminho mais lento da obra: o `checked` do checkbox
 * vinha 100% do servidor, então o tique só aparecia depois do PATCH **mais** um
 * refetch de `buildMinhaObraDetalheReal` (~19 queries sequenciais e um presign
 * R2 por foto, documento e contrato de equipe) — 5 a 6 segundos para virar um
 * booleano. Sem feedback nenhum, o usuário clicava de novo; como
 * `alternarMarcacao` faz *flip*, o segundo clique desmarcava o primeiro.
 *
 * Para marcar na hora é preciso derivar no cliente o mesmo estado que o
 * servidor derivaria. É o que está aqui. A regra tem de ficar **idêntica** à de
 * `features/obras/api/checklist-recorrencia.ts`: se divergir, o card pisca com
 * o status errado no intervalo entre o clique e a resposta. `checklist-projecao.test.ts`
 * existe justamente para ser esse contrato de paridade.
 *
 * Fica em `lib/` (e não junto dos componentes) porque é função pura, usada pelo
 * hook e testável sem React — mesma escolha de [[checklist-periodo]].
 */

import type { MinhaObraChecklist } from '../types';

/** Percentual de itens concluídos. Igual ao que o builder grava no detalhe. */
export function calcularProgressoItens(itens: MinhaObraChecklist['itens']): number {
  if (itens.length === 0) return 0;
  return Math.round((itens.filter((i) => i.concluida).length / itens.length) * 100);
}

/**
 * Vira o tique de um item e rederiva o que depende dele.
 *
 * O ponto delicado é o status, e ele difere conforme a recorrência:
 *
 * - **Sem recorrência**, o status é a coluna do banco e o toggle não a altera.
 *   A rota confirma: no caminho sem período ela só faz
 *   `UPDATE obra_checklist_itens SET concluida` e nunca toca em
 *   `obra_checklists.status` (só o botão Finalizar/Assinar faz isso). Mexer no
 *   status aqui faria o badge divergir da resposta que vai chegar.
 *
 * - **Com recorrência**, o status é derivado do período pelo servidor. Aqui
 *   reproduzimos a mesma derivação, inclusive o `completadoEm`: "Concluído às
 *   21:14" não vale para um período que voltou a ter item pendente.
 */
export function aplicarToggleOtimista(
  checklist: MinhaObraChecklist,
  itemId: string,
): MinhaObraChecklist {
  const itens = checklist.itens.map((i) =>
    i.id === itemId ? { ...i, concluida: !i.concluida } : i,
  );
  const progresso = calcularProgressoItens(itens);

  const eRecorrente = (checklist.recorrencia ?? 'nenhuma') !== 'nenhuma';
  if (!eRecorrente) {
    return { ...checklist, itens, progresso };
  }

  const todosFeitos = itens.length > 0 && itens.every((i) => i.concluida);
  const algumFeito = itens.some((i) => i.concluida);
  return {
    ...checklist,
    itens,
    status: todosFeitos ? 'completo' : algumFeito ? 'em_andamento' : 'pendente',
    completadoEm: todosFeitos ? checklist.completadoEm : undefined,
    pendenteNoPeriodo: !todosFeitos,
    progresso,
  };
}

/**
 * O formato em que o PATCH de checklist responde.
 *
 * É a linha crua do banco acrescida dos campos já projetados — não é
 * `MinhaObraChecklist`, daí a normalização logo abaixo.
 */
export interface ChecklistPatchResponse {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: MinhaObraChecklist['tipo'];
  status: MinhaObraChecklist['status'];
  itens: { id: string; titulo: string; concluida: boolean }[];
  completadoEm: string | null;
  assinadoPor: string | null;
  assinadoEm: string | null;
  registroProfissional: string | null;
  recorrencia: MinhaObraChecklist['recorrencia'];
  recorrenciaDiaSemana: number | null;
  pendenteNoPeriodo: boolean;
}

/**
 * Converte a resposta do PATCH no formato que a tela consome.
 *
 * Existe para que o `onSuccess` possa escrever a resposta direto no cache em
 * vez de invalidar o detalhe. O servidor já resolveu o período corrente e
 * derivou o status ali — reler tudo de novo custaria o refetch caro descrito no
 * topo do arquivo para obter exatamente o que já veio na resposta.
 *
 * As diferenças de formato: os itens vêm com `checklistId`/`ordem` que a tela
 * não usa, os opcionais vêm `null` onde o tipo espera `undefined`, e
 * `progresso` não é enviado (o builder calcula).
 */
export function normalizarChecklistResposta(
  resp: ChecklistPatchResponse,
): MinhaObraChecklist {
  const itens = resp.itens.map((i) => ({
    id: i.id,
    titulo: i.titulo,
    concluida: i.concluida,
  }));
  return {
    id: resp.id,
    nome: resp.nome,
    descricao: resp.descricao ?? '',
    tipo: resp.tipo,
    status: resp.status,
    itens,
    completadoEm: resp.completadoEm ?? undefined,
    progresso: calcularProgressoItens(itens),
    assinadoPor: resp.assinadoPor ?? undefined,
    assinadoEm: resp.assinadoEm ?? undefined,
    registroProfissional: resp.registroProfissional ?? undefined,
    recorrencia: resp.recorrencia ?? 'nenhuma',
    recorrenciaDiaSemana: resp.recorrenciaDiaSemana ?? undefined,
    pendenteNoPeriodo: resp.pendenteNoPeriodo,
  };
}
