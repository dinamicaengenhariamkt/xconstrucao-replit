'use client';

import { useState } from 'react';
import { MOCK_EMPREITEIRO_NOTIFICATIONS } from '../mocks';
import type { EmpreiteiroNotification } from '../types';

const TOPBAR_LIMIT = 6;
const PAGE_SIZE = 10;

export type NotifFilter = 'todas' | 'nao_lidas' | 'lidas';

export function useEmpreiteiroNotifications() {
  const [notifications, setNotifications] = useState<EmpreiteiroNotification[]>(MOCK_EMPREITEIRO_NOTIFICATIONS);
  const [visibleCount, setVisibleCount] = useState(30);
  const [filterLida, setFilterLida] = useState<NotifFilter>('todas');

  const unreadCount = notifications.filter((n) => !n.lida).length;

  const filtered = notifications.filter((n) => {
    if (filterLida === 'nao_lidas') return !n.lida;
    if (filterLida === 'lidas') return n.lida;
    return true;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const loadMore = () => setVisibleCount((c) => c + PAGE_SIZE);

  const marcarComoLida = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  const marcarTodasComoLidas = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  return {
    // Full list for the notifications page (filtered + paginated)
    notifications: visible,
    hasMore,
    filterLida,
    setFilterLida,
    loadMore,
    // Topbar uses only the first N items (no filter)
    topbarNotifications: notifications.slice(0, TOPBAR_LIMIT),
    unreadCount,
    marcarComoLida,
    marcarTodasComoLidas,
  };
}
