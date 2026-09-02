'use client';

import type { ObraPublicaAtualizacao } from '../types';
import { IconPhotoLibrary, IconTrendingUp } from '@shared/components/icons';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function TabAtualizacoesPublica({ atualizacoes }: { atualizacoes: ObraPublicaAtualizacao[] }) {
  if (atualizacoes.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">Nenhuma atualização registrada ainda.</p>;
  }

  return (
    <div className="space-y-4" data-testid="obra-publica-atualizacoes">
      {atualizacoes.map((item) => (
        <article key={item.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                <IconTrendingUp />
                +{item.percentual}% de avanço
              </span>
              <h3 className="mt-2 font-bold text-gray-900 dark:text-white">{item.etapa}</h3>
            </div>
            <time dateTime={item.createdAt} className="text-xs text-gray-500">{formatDate(item.createdAt)}</time>
          </div>
          {item.descricao && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">{item.descricao}</p>}
          {item.fotosCount > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <IconPhotoLibrary />
              {item.fotosCount} {item.fotosCount === 1 ? 'foto disponível' : 'fotos disponíveis'} na galeria
            </p>
          )}
        </article>
      ))}
    </div>
  );
}