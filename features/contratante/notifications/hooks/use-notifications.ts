'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotificationsList } from '@features/shared/notifications/hooks/use-notifications-list';
import { apiRequest } from '@shared/lib/queryClient';
import type { ContratanteNotification } from '../types';

export type { NotifFilter } from '@features/shared/notifications/types';

const QUERY_KEY = ['notificacoes'] as const;

interface ApiNotification {
  id: string;
  tipo: 'lembrete' | 'alerta' | 'info' | 'sucesso';
  titulo: string;
  descricao: string;
  href: string;
  lida: boolean;
  criadoEm: string;
}

interface ApiResponse {
  items: ApiNotification[];
  naoLidas: number;
}

export const useContratanteNotifications = () => {
  const qc = useQueryClient();

  const { data } = useQuery<ApiResponse>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch('/api/notificacoes', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao carregar notificações');
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const initial = useMemo<ContratanteNotification[]>(
    () => (data?.items ?? []) as ContratanteNotification[],
    [data],
  );

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('POST', `/api/notificacoes/${id}/lida`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const markAll = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/notificacoes/marcar-todas-lidas');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return useNotificationsList(initial, {
    onMarkRead: (id) => markRead.mutate(id),
    onMarkAllRead: () => markAll.mutate(),
  });
};
