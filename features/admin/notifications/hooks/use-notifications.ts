'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminNotification } from '../types';

interface NotificacoesResponse {
  items: AdminNotification[];
  naoLidas: number;
}

/**
 * Sino de notificações do admin logado (J21 — dados reais).
 * Lê as notificações do próprio usuário via `/api/notificacoes` (mesma fonte do
 * sino das demais personas). Substitui o antigo mock em memória.
 */
export function useAdminNotifications() {
  const queryClient = useQueryClient();

  const { data } = useQuery<NotificacoesResponse>({
    queryKey: ['notificacoes', 'sino'],
    queryFn: async () => {
      const res = await fetch('/api/notificacoes?limit=20');
      if (!res.ok) throw new Error('Erro ao buscar notificações');
      return res.json();
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const notifications = data?.items ?? [];
  const unreadCount = data?.naoLidas ?? 0;

  const marcarComoLida = useCallback(
    async (id: string) => {
      await fetch(`/api/notificacoes/${id}/lida`, { method: 'POST' }).catch(() => {});
      await queryClient.invalidateQueries({ queryKey: ['notificacoes', 'sino'] });
    },
    [queryClient],
  );

  const marcarTodasComoLidas = useCallback(async () => {
    await fetch('/api/notificacoes/marcar-todas-lidas', { method: 'POST' }).catch(() => {});
    await queryClient.invalidateQueries({ queryKey: ['notificacoes', 'sino'] });
  }, [queryClient]);

  return {
    notifications: notifications.slice(0, 6),
    unreadCount,
    marcarComoLida,
    marcarTodasComoLidas,
  };
}
