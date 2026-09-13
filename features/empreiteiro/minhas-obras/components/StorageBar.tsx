'use client';

import { cn } from '@shared/lib/utils';
import { IconFolderOpen, IconWarning } from '@shared/components/icons';
import { useObraStorage, formatarMB } from '../hooks/use-obra-storage';

/**
 * XG10 — barra de consumo do armazenamento da obra.
 *
 * Pedido direto do cliente: "a gente pode colocar um avisozinho ali, como se
 * fosse uma barra de progresso. O cara adicionou ali 5 arquivos, deu 50 MB. A
 * gente vai preenchendo a porcentagem até o máximo dessa barra."
 *
 * O número vem do banco (soma real de `user_files`), nunca estimado no cliente.
 */

/** Avisa antes de barrar: âmbar a partir de 70%, vermelho a partir de 90%. */
function corDoNivel(percentual: number) {
  if (percentual >= 90) return { barra: 'bg-red-500', texto: 'text-red-600' };
  if (percentual >= 70) return { barra: 'bg-amber-500', texto: 'text-amber-600' };
  return { barra: 'bg-success', texto: 'text-gray-500' };
}

export function StorageBar({ obraId }: { obraId: string }) {
  const { data, isLoading } = useObraStorage(obraId);

  if (isLoading || !data) return null;

  const cor = corDoNivel(data.percentual);
  const cheio = data.percentual >= 100;

  return (
    <div
      className="mb-5 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40"
      data-testid="storage-bar"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <IconFolderOpen className="text-sm" />
          Armazenamento da obra
        </span>
        <span className={cn('text-xs font-semibold tabular-nums', cor.texto)}>
          {formatarMB(data.usadoBytes)} de {formatarMB(data.limiteBytes)}
          {data.arquivos > 0 && (
            <span className="text-gray-400 font-normal">
              {' · '}
              {data.arquivos} {data.arquivos === 1 ? 'arquivo' : 'arquivos'}
            </span>
          )}
        </span>
      </div>

      <div
        className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={data.percentual}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Armazenamento usado nesta obra"
      >
        <div
          className={cn('h-full rounded-full transition-all', cor.barra)}
          style={{ width: `${Math.max(data.percentual, data.usadoBytes > 0 ? 2 : 0)}%` }}
        />
      </div>

      {data.percentual >= 70 && (
        <p className={cn('text-xs mt-2 flex items-center gap-1.5', cor.texto)}>
          <IconWarning className="text-sm flex-shrink-0" />
          {cheio
            ? 'Limite atingido. Remova algum arquivo para enviar outros.'
            : `Restam ${formatarMB(data.disponivelBytes)} nesta obra.`}
        </p>
      )}
    </div>
  );
}
