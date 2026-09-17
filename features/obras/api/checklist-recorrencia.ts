import { and, eq, inArray } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obraChecklistMarcacoes } from "@shared/db/schema";
import {
  periodoAtual,
  type ChecklistRecorrencia,
} from "@features/empreiteiro/minhas-obras/lib/checklist-periodo";

/**
 * XG21 — projeta o estado do checklist no período corrente.
 *
 * Fica aqui, e não dentro de uma rota, porque quatro consumidores precisam
 * enxergar exatamente a mesma coisa: a API REST, a projeção do detalhe do
 * empreiteiro, a aba do contratante e a obra pública. Se cada um calculasse por
 * conta própria, um deles mostraria o checklist "completo" enquanto os outros
 * já teriam virado o dia.
 *
 * A regra: para um checklist recorrente, `concluida` **não** vem da coluna do
 * item — vem de existir (ou não) uma marcação no período corrente. É isso que
 * faz o checklist "zerar sozinho" à meia-noite sem nenhum job.
 */

interface ChecklistBase {
  id: string;
  status: string;
  completadoEm: string | null;
  recorrencia: ChecklistRecorrencia;
  recorrenciaDiaSemana: number | null;
}

interface ItemBase {
  id: string;
  checklistId: string;
  titulo: string;
  concluida: boolean;
  ordem: number;
}

export interface ChecklistProjetado {
  itens: ItemBase[];
  status: string;
  completadoEm: string | null;
  /** `null` quando não é recorrente. */
  periodoRef: string | null;
  /** Recorrente e ainda com item por marcar neste período. */
  pendenteNoPeriodo: boolean;
}

/**
 * Carrega as marcações do período corrente de vários checklists de uma vez.
 *
 * Uma query só para todos, em vez de uma por checklist — a tela da obra mostra
 * a lista inteira e um N+1 aqui apareceria como lentidão a cada abertura.
 */
export async function carregarMarcacoes(
  checklists: ChecklistBase[],
  agora: Date = new Date(),
): Promise<Map<string, Set<number>>> {
  const recorrentes = checklists.filter((c) => c.recorrencia !== "nenhuma");
  if (recorrentes.length === 0) return new Map();

  const linhas = await db
    .select()
    .from(obraChecklistMarcacoes)
    .where(
      inArray(
        obraChecklistMarcacoes.checklistId,
        recorrentes.map((c) => c.id),
      ),
    );

  // Filtra pelo período de cada checklist: dois checklists recorrentes podem
  // estar em períodos diferentes (um diário, outro semanal).
  const periodoPorChecklist = new Map(
    recorrentes.map((c) => [c.id, periodoAtual(c.recorrencia, c.recorrenciaDiaSemana, agora)]),
  );

  const porChecklist = new Map<string, Set<number>>();
  for (const linha of linhas) {
    if (linha.periodoRef !== periodoPorChecklist.get(linha.checklistId)) continue;
    const set = porChecklist.get(linha.checklistId) ?? new Set<number>();
    set.add(linha.itemOrdem);
    porChecklist.set(linha.checklistId, set);
  }
  return porChecklist;
}

/**
 * Aplica as marcações do período a um checklist.
 *
 * Sem recorrência, devolve tudo como está — o caminho antigo continua intacto.
 */
export function projetarChecklist<C extends ChecklistBase, I extends ItemBase>(
  checklist: C,
  itens: I[],
  marcacoes: Map<string, Set<number>>,
  agora: Date = new Date(),
): ChecklistProjetado {
  if (checklist.recorrencia === "nenhuma") {
    return {
      itens,
      status: checklist.status,
      completadoEm: checklist.completadoEm,
      periodoRef: null,
      pendenteNoPeriodo: false,
    };
  }

  const periodoRef = periodoAtual(checklist.recorrencia, checklist.recorrenciaDiaSemana, agora);
  const marcadas = marcacoes.get(checklist.id) ?? new Set<number>();
  const projetados = itens.map((it) => ({ ...it, concluida: marcadas.has(it.ordem) }));
  const todosFeitos = projetados.length > 0 && projetados.every((it) => it.concluida);
  const algumFeito = projetados.some((it) => it.concluida);

  return {
    itens: projetados,
    // O status é do PERÍODO, não do checklist: sem isto, um checklist marcado
    // como 'completo' ontem continuaria completo (e travado) hoje — o card fica
    // read-only quando está completo.
    status: todosFeitos ? "completo" : algumFeito ? "em_andamento" : "pendente",
    // Idem para a hora: "Concluído às 21:14" de ontem não vale para hoje.
    completadoEm: todosFeitos ? checklist.completadoEm : null,
    periodoRef,
    pendenteNoPeriodo: !todosFeitos,
  };
}

/**
 * Marca ou desmarca um item no período corrente.
 *
 * Devolve `true` se o item ficou marcado. O UNIQUE em
 * (checklist_id, item_ordem, periodo_ref) faz o insert ser idempotente, então
 * dois cliques rápidos não viram duas linhas.
 */
export async function alternarMarcacao(
  checklistId: string,
  itemOrdem: number,
  periodoRef: string,
  usuarioId: string,
): Promise<boolean> {
  const [existente] = await db
    .select()
    .from(obraChecklistMarcacoes)
    .where(
      and(
        eq(obraChecklistMarcacoes.checklistId, checklistId),
        eq(obraChecklistMarcacoes.itemOrdem, itemOrdem),
        eq(obraChecklistMarcacoes.periodoRef, periodoRef),
      ),
    );

  if (existente) {
    await db.delete(obraChecklistMarcacoes).where(eq(obraChecklistMarcacoes.id, existente.id));
    return false;
  }

  await db
    .insert(obraChecklistMarcacoes)
    .values({ checklistId, itemOrdem, periodoRef, marcadoPor: usuarioId })
    .onConflictDoNothing();
  return true;
}

/** Marca todos os itens do período de uma vez (o botão "Finalizar"). */
export async function marcarTodosNoPeriodo(
  checklistId: string,
  ordens: number[],
  periodoRef: string,
  usuarioId: string,
): Promise<void> {
  if (ordens.length === 0) return;
  await db
    .insert(obraChecklistMarcacoes)
    .values(ordens.map((itemOrdem) => ({ checklistId, itemOrdem, periodoRef, marcadoPor: usuarioId })))
    .onConflictDoNothing();
}
