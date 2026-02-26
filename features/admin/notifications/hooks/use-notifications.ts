'use client';

import { useState } from 'react';
import { mockAdminNotifications } from '../mocks';
import type { AdminNotification } from '../types';

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>(mockAdminNotifications);

  const unreadCount = notifications.filter((n) => !n.lida).length;

  const marcarComoLida = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  const marcarTodasComoLidas = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  return {
    notifications: notifications.slice(0, 6),
    unreadCount,
    marcarComoLida,
    marcarTodasComoLidas,
  };
}
