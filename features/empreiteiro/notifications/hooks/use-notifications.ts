'use client';

import { useNotificationsList } from '@features/shared/notifications/hooks/use-notifications-list';
import { MOCK_EMPREITEIRO_NOTIFICATIONS } from '../mocks';

export type { NotifFilter } from '@features/shared/notifications/types';

export const useEmpreiteiroNotifications = () =>
  useNotificationsList(MOCK_EMPREITEIRO_NOTIFICATIONS);
