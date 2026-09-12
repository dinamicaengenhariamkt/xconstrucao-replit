'use client';

import { cn } from '@shared/lib/utils';
import type { ObraPublicaTarefa } from '../types';

/**
 * Tarefas em modo leitura. O responsável não é exibido: é nome de pessoa da
 * equipe, retido pelo mesmo motivo que `obra_equipe` fica fora do link.
 */
const STATUS: Record<ObraPublicaTarefa['status'], { label: string; classe: string }> = {
  pendente: { label: 'Pendente', classe: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  em_andamento: { label: 'Em andamento', classe: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  bloqueado: { label: 'Bloqueada', classe: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  concluido: { label: 'Concluída', classe: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

function formatarPrazo(valor: string): string {
  const somenteData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (somenteData) return `${somenteData[3]}/${somenteData[2]}/${somenteData[1]}`;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleDateString('pt-BR');
}

export function TabTarefasPublica({ tarefas }: { tarefas: ObraPublicaTarefa[] }) {
  if (tarefas.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">Nenhuma tarefa registrada ainda.</p>;
  }

  return (
    <div className="space-y-3" data-testid="obra-publica-tarefas">
      {tarefas.map((tarefa) => {
        const status = STATUS[tarefa.status];
        return (
          <article key={tarefa.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white">{tarefa.titulo}</h3>
                {tarefa.etapa && <p className="mt-0.5 text-xs text-gray-500">{tarefa.etapa}</p>}
              </div>
              <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', status.classe)}>
                {status.label}
              </span>
            </div>

            {tarefa.descricao && (
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">
                {tarefa.descricao}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              {tarefa.prazo && <span>Prazo: {formatarPrazo(tarefa.prazo)}</span>}
              {tarefa.progresso !== null && <span>{tarefa.progresso}% concluído</span>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
