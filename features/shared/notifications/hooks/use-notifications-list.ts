'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { BaseNotification, NotifFilter, NotificacaoTipo } from '../types';

export interface UseNotificationsListOptions {
  /** Callback chamado quando o usuário marca uma notificação como lida. */
  onMarkRead?: (id: string) => void;
  /** Callback chamado quando o usuário marca todas como lidas. */
  onMarkAllRead?: () => void;
}

const TOPBAR_LIMIT = 6;
const PAGE_SIZE = 10;
const INITIAL_VISIBLE = 10;

export interface UseNotificationsListReturn<T extends BaseNotification> {
  /** Lista filtrada + paginada para a página principal. */
  notifications: T[];
  /** True quando há mais resultados além de `visibleCount`. */
  hasMore: boolean;
  loadMore: () => void;

  /** Filtro primário (tabs). */
  filterLida: NotifFilter;
  setFilterLida: (next: NotifFilter) => void;

  /** Filtros avançados. */
  tipoSelected: NotificacaoTipo[];
  setTipoSelected: (next: NotificacaoTipo[]) => void;
  dateMin: string;
  setDateMin: (next: string) => void;
  dateMax: string;
  setDateMax: (next: string) => void;
  searchQuery: string;
  setSearchQuery: (next: string) => void;
  advancedActiveCount: number;
  clearAllAdvanced: () => void;

  /** Topbar consome as 6 mais recentes da lista bruta (sem filtros). */
  topbarNotifications: T[];
  unreadCount: number;
  marcarComoLida: (id: string) => void;
  marcarTodasComoLidas: () => void;

  /** Lista bruta (não filtrada) — usada para calcular contagens de tipo. */
  rawNotifications: T[];
}

export function useNotificationsList<T extends BaseNotification>(
  initial: T[],
  options: UseNotificationsListOptions = {},
): UseNotificationsListReturn<T> {
  const [notifications, setNotifications] = useState<T[]>(initial);
  const lastInitialRef = useRef<T[]>(initial);
  useEffect(() => {
    if (initial !== lastInitialRef.current) {
      lastInitialRef.current = initial;
      setNotifications(initial);
    }
  }, [initial]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [filterLida, setFilterLidaState] = useState<NotifFilter>('todas');
  const [tipoSelected, setTipoSelectedState] = useState<NotificacaoTipo[]>([]);
  const [dateMin, setDateMinState] = useState('');
  const [dateMax, setDateMaxState] = useState('');
  const [searchQuery, setSearchQueryState] = useState('');

  const resetPaging = () => setVisibleCount(INITIAL_VISIBLE);

  const setFilterLida = (next: NotifFilter) => {
    setFilterLidaState(next);
    resetPaging();
  };
  const setTipoSelected = (next: NotificacaoTipo[]) => {
    setTipoSelectedState(next);
    resetPaging();
  };
  const setDateMin = (next: string) => {
    setDateMinState(next);
    resetPaging();
  };
  const setDateMax = (next: string) => {
    setDateMaxState(next);
    resetPaging();
  };
  const setSearchQuery = (next: string) => {
    setSearchQueryState(next);
    resetPaging();
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.lida).length,
    [notifications],
  );

  const filtered = useMemo(() => {
    let result = notifications;
    if (filterLida === 'nao_lidas') {
      result = result.filter((n) => !n.lida);
    } else if (filterLida === 'lidas') {
      result = result.filter((n) => n.lida);
    }
    if (tipoSelected.length > 0) {
      result = result.filter((n) => tipoSelected.includes(n.tipo));
    }
    if (dateMin) {
      result = result.filter((n) => n.criadoEm.slice(0, 10) >= dateMin);
    }
    if (dateMax) {
      result = result.filter((n) => n.criadoEm.slice(0, 10) <= dateMax);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) => n.titulo.toLowerCase().includes(q) || n.descricao.toLowerCase().includes(q),
      );
    }
    return result;
  }, [notifications, filterLida, tipoSelected, dateMin, dateMax, searchQuery]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const loadMore = () => setVisibleCount((c) => c + PAGE_SIZE);

  const marcarComoLida = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? ({ ...n, lida: true } as T) : n)),
    );
    options.onMarkRead?.(id);
  };

  const marcarTodasComoLidas = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true } as T)));
    options.onMarkAllRead?.();
  };

  const advancedActiveCount =
    (tipoSelected.length > 0 ? 1 : 0) +
    (dateMin || dateMax ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearAllAdvanced = () => {
    setTipoSelectedState([]);
    setDateMinState('');
    setDateMaxState('');
    setSearchQueryState('');
    resetPaging();
  };

  return {
    notifications: visible,
    hasMore,
    loadMore,

    filterLida,
    setFilterLida,

    tipoSelected,
    setTipoSelected,
    dateMin,
    setDateMin,
    dateMax,
    setDateMax,
    searchQuery,
    setSearchQuery,
    advancedActiveCount,
    clearAllAdvanced,

    topbarNotifications: notifications.slice(0, TOPBAR_LIMIT),
    unreadCount,
    marcarComoLida,
    marcarTodasComoLidas,

    rawNotifications: notifications,
  };
}
