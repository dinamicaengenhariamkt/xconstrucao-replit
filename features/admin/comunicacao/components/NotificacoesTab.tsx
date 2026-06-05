'use client';

import { useState } from 'react';
import {
  RiSearchLine,
  RiNotification3Line,
  RiAlertLine,
  RiInformationLine,
  RiCheckboxCircleLine,
  RiTimeLine,
} from 'react-icons/ri';
import { Input } from '@shared/components/ui/input';
import { Badge } from '@shared/components/ui/badge';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { formatDateTime } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';
import { useAdminNotificacoes } from '../hooks/use-comunicacao';
import { PaginadorSimples } from './PaginadorSimples';
import type { NotificacaoTipo } from '../types';

const PAGE_SIZE = 20;

const TIPO_META: Record<
  NotificacaoTipo,
  { label: string; icon: typeof RiAlertLine; badge: string }
> = {
  alerta: {
    label: 'Alerta',
    icon: RiAlertLine,
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  },
  info: {
    label: 'Info',
    icon: RiInformationLine,
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  },
  sucesso: {
    label: 'Sucesso',
    icon: RiCheckboxCircleLine,
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  lembrete: {
    label: 'Lembrete',
    icon: RiTimeLine,
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  },
};

export function NotificacoesTab() {
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<NotificacaoTipo | 'todos'>('todos');
  const [status, setStatus] = useState<'todos' | 'lida' | 'nao-lida'>('todos');

  const { data, isLoading } = useAdminNotificacoes({
    page,
    pageSize: PAGE_SIZE,
    busca: busca || undefined,
    tipo: tipo === 'todos' ? undefined : tipo,
    status: status === 'todos' ? undefined : status,
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const resetPage = () => setPage(1);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Filtros */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              resetPage();
            }}
            placeholder="Buscar por título, descrição ou destinatário…"
            className="pl-9"
            data-testid="input-busca-notificacao"
          />
        </div>
        <Select
          value={tipo}
          onValueChange={(v) => {
            setTipo(v as NotificacaoTipo | 'todos');
            resetPage();
          }}
        >
          <SelectTrigger className="w-full md:w-44" data-testid="select-tipo-notificacao">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="alerta">Alerta</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="sucesso">Sucesso</SelectItem>
            <SelectItem value="lembrete">Lembrete</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as 'todos' | 'lida' | 'nao-lida');
            resetPage();
          }}
        >
          <SelectTrigger className="w-full md:w-44" data-testid="select-status-notificacao">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="nao-lida">Não lidas</SelectItem>
            <SelectItem value="lida">Lidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <RiNotification3Line className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Nenhuma notificação encontrada
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Ajuste os filtros acima.
            </p>
          </div>
        ) : (
          items.map((n) => {
            const meta = TIPO_META[n.tipo];
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                data-testid={`notificacao-row-${n.id}`}
                className="p-4 flex items-start gap-3 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="shrink-0 mt-0.5">
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      n.tipo === 'alerta' && 'text-red-500',
                      n.tipo === 'info' && 'text-blue-500',
                      n.tipo === 'sucesso' && 'text-emerald-500',
                      n.tipo === 'lembrete' && 'text-amber-500',
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {n.titulo}
                    </p>
                    <Badge className={cn('text-[10px]', meta.badge)}>{meta.label}</Badge>
                    <Badge className="text-[10px] bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      in-app
                    </Badge>
                    {!n.lida && (
                      <Badge className="text-[10px] bg-primary/10 text-primary">não lida</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {n.descricao}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                    Para <span className="font-medium">{n.destinatarioNome}</span> ({n.destinatarioEmail})
                    · {formatDateTime(n.criadoEm)}
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
