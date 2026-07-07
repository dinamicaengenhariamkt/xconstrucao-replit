'use client';

import { useState } from 'react';
import { RiEyeLine, RiShieldCheckLine } from 'react-icons/ri';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Badge } from '@shared/components/ui/badge';
import { formatDateTime } from '@shared/lib/formatters';
import { useAdminComunicacaoAuditoria } from '../hooks/use-comunicacao';
import { PaginadorSimples } from './PaginadorSimples';

const PAGE_SIZE = 20;

/** Trilha de auditoria das leituras de chat pelo admin (action=admin.chat.read). */
export function AuditoriaTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminComunicacaoAuditoria(page, PAGE_SIZE);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <RiShieldCheckLine className="w-4 h-4 text-gray-400" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Leituras de conversa por administradores
        </p>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <RiEyeLine className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Nenhuma leitura registrada ainda
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Abra uma conversa na aba “Conversas” — o acesso será registrado aqui.
            </p>
          </div>
        ) : (
          items.map((a) => {
            const obraId = typeof a.payload?.obraId === 'string' ? a.payload.obraId : null;
            const totalMsg =
              typeof a.payload?.totalMensagens === 'number' ? a.payload.totalMensagens : null;
            return (
              <div
                key={a.id}
                data-testid={`auditoria-row-${a.id}`}
                className="p-4 flex items-start gap-3"
              >
                <div className="shrink-0 mt-0.5">
                  <RiEyeLine className="w-5 h-5 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {a.actorNome ?? 'Administrador'}
                    </p>
                    <Badge className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
                      leu conversa
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {obraId && <>Obra <span className="font-mono text-[11px]">{obraId.slice(0, 8)}</span> · </>}
                    {totalMsg != null && <>{totalMsg} mensagens · </>}
                    {formatDateTime(a.criadoEm)}
                    {a.ip && <> · IP {a.ip}</>}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <PaginadorSimples page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
