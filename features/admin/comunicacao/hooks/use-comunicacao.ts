'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  AdminAuditoriaItem,
  AdminChatThread,
  AdminChatThreadDetalhe,
  AdminNotificacaoItem,
  AdminNotificacoesFiltro,
  AdminChatThreadsFiltro,
  Paginado,
} from '../types';

const CFG = { staleTime: 60 * 1000, refetchOnWindowFocus: false } as const;

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== false) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function useAdminChatThreads(filtro: AdminChatThreadsFiltro) {
  return useQuery<Paginado<AdminChatThread>>({
    queryKey: ['admin', 'comunicacao', 'threads', filtro],
    queryFn: async () => {
      const res = await fetch(`/api/admin/chat/threads${buildQuery({ ...filtro })}`);
      if (!res.ok) throw new Error('Erro ao buscar conversas');
      return res.json();
    },
    ...CFG,
  });
}

export function useAdminChatThreadDetalhe(threadId: string | null) {
  return useQuery<AdminChatThreadDetalhe>({
    queryKey: ['admin', 'comunicacao', 'thread', threadId],
    enabled: Boolean(threadId),
    queryFn: async () => {
      const res = await fetch(`/api/admin/chat/threads/${threadId}/mensagens`);
      if (!res.ok) throw new Error('Erro ao buscar histórico da conversa');
      return res.json();
    },
    // Histórico read-only é estável; evita re-fetch ao reabrir a mesma thread.
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAdminNotificacoes(filtro: AdminNotificacoesFiltro) {
  return useQuery<Paginado<AdminNotificacaoItem>>({
    queryKey: ['admin', 'comunicacao', 'notificacoes', filtro],
    queryFn: async () => {
      const res = await fetch(`/api/admin/notificacoes${buildQuery({ ...filtro })}`);
      if (!res.ok) throw new Error('Erro ao buscar notificações');
      return res.json();
    },
    ...CFG,
  });
}

export function useAdminComunicacaoAuditoria(page = 1, pageSize = 20) {
  return useQuery<Paginado<AdminAuditoriaItem>>({
    queryKey: ['admin', 'comunicacao', 'auditoria', page, pageSize],
    queryFn: async () => {
      const res = await fetch(`/api/admin/comunicacao/auditoria${buildQuery({ page, pageSize })}`);
      if (!res.ok) throw new Error('Erro ao buscar auditoria');
      return res.json();
    },
    ...CFG,
  });
}
