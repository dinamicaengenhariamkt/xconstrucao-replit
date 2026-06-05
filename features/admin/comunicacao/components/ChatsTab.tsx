'use client';

import { useState } from 'react';
import {
  RiSearchLine,
  RiChat3Line,
  RiEyeLine,
  RiInformationLine,
  RiHammerLine,
} from 'react-icons/ri';
import { Input } from '@shared/components/ui/input';
import { Badge } from '@shared/components/ui/badge';
import { Switch } from '@shared/components/ui/switch';
import { Skeleton } from '@shared/components/ui/skeleton';
import { formatDateTime, getInitials } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';
import {
  useAdminChatThreads,
  useAdminChatThreadDetalhe,
} from '../hooks/use-comunicacao';
import { PaginadorSimples } from './PaginadorSimples';
import type { AdminChatThread } from '../types';

const PAGE_SIZE = 15;

export function ChatsTab() {
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState('');
  const [somenteNaoRespondidas, setSomenteNaoRespondidas] = useState(false);
  const [threadSelecionada, setThreadSelecionada] = useState<string | null>(null);

  const { data, isLoading } = useAdminChatThreads({
    page,
    pageSize: PAGE_SIZE,
    busca: busca || undefined,
    somenteNaoRespondidas,
  });

  const threads = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4">
      {/* Lista de threads */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por obra ou participante…"
              className="pl-9"
              data-testid="input-busca-conversa"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            <Switch
              checked={somenteNaoRespondidas}
              onCheckedChange={(v) => {
                setSomenteNaoRespondidas(v);
                setPage(1);
              }}
              data-testid="switch-nao-respondidas"
            />
            Apenas com mensagem não respondida
          </label>
        </div>

        <div className="flex-1 divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))
          ) : threads.length === 0 ? (
            <EmptyState
              icon={RiChat3Line}
              title="Nenhuma conversa encontrada"
              hint="Ajuste a busca ou o filtro acima."
            />
          ) : (
            threads.map((t) => (
              <ThreadListItem
                key={t.threadId}
                thread={t}
                active={threadSelecionada === t.threadId}
                onClick={() => setThreadSelecionada(t.threadId)}
              />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-800">
            <PaginadorSimples page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Histórico read-only */}
      <ThreadHistorico threadId={threadSelecionada} />
    </div>
  );
}

function ThreadListItem({
  thread,
  active,
  onClick,
}: {
  thread: AdminChatThread;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`thread-item-${thread.threadId}`}
      className={cn(
        'w-full text-left p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60',
        active && 'bg-primary/[0.05] dark:bg-primary/10',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <RiHammerLine className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {thread.obraNome}
          </span>
        </div>
        {thread.temNaoRespondida && (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 text-[10px] shrink-0">
            Aguardando
          </Badge>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
        {thread.contratanteNome} ↔ {thread.empreiteiroNome}
      </p>
      {thread.ultimaMensagemTexto && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-1">
          {thread.ultimaMensagemTexto}
        </p>
      )}
      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
        <span>{thread.totalMensagens} msg</span>
        {thread.ultimaMensagemEm && <span>· {formatDateTime(thread.ultimaMensagemEm)}</span>}
      </div>
    </button>
  );
}

function ThreadHistorico({ threadId }: { threadId: string | null }) {
  const { data, isLoading } = useAdminChatThreadDetalhe(threadId);

  if (!threadId) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 flex flex-col items-center justify-center p-10 text-center min-h-[300px]">
        <RiEyeLine className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Selecione uma conversa para ler o histórico
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
          Modo leitura — a comunicação entre as partes não é alterada.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col min-h-[300px]">
      {isLoading || !data ? (
        <div className="p-5 space-y-4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-16 w-2/3 ml-auto" />
        </div>
      ) : (
        <>
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{data.thread.obraNome}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {data.thread.contratanteNome} ↔ {data.thread.empreiteiroNome} ·{' '}
              {data.thread.totalMensagens} mensagens
            </p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[55vh] p-4 space-y-3">
            {data.mensagens.map((m) => {
              const doContratante = m.autorUserId === data.thread.contratanteUserId;
              return (
                <div
                  key={m.id}
                  className={cn('flex gap-2', doContratante ? 'justify-start' : 'justify-end')}
                >
                  {doContratante && <Avatar nome={m.autorNome} />}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-3.5 py-2',
                      doContratante
                        ? 'bg-gray-100 dark:bg-gray-800 rounded-tl-sm'
                        : 'bg-primary/10 dark:bg-primary/20 rounded-tr-sm',
                    )}
                  >
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                      {m.autorNome}
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">
                      {m.texto}
                    </p>
                    {m.anexoObraNome && (
                      <p className="text-[11px] text-gray-500 mt-1 italic">📎 {m.anexoObraNome}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1 text-right">
                      {formatDateTime(m.criadaEm)}
                    </p>
                  </div>
                  {!doContratante && <Avatar nome={m.autorNome} />}
                </div>
              );
            })}
          </div>

          {/* Faixa de modo leitura — substitui o input de envio */}
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 bg-gray-50/60 dark:bg-gray-800/40">
            <RiInformationLine className="w-4 h-4 text-gray-400 shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Modo leitura · administradores não enviam mensagens nesta conversa.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Avatar({ nome }: { nome: string }) {
  return (
    <div className="shrink-0 w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
      {getInitials(nome)}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof RiChat3Line;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <Icon className="w-7 h-7 text-gray-300 dark:text-gray-600 mb-2" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>
    </div>
  );
}
