import { isMockEnabled } from '@/features/shared/lib/mock-flag';

export const ENABLE_MOCK = isMockEnabled();

export const QUERY_CONFIG = {
  staleTime: 1 * 60 * 1000,
  refetchInterval: 1 * 60 * 1000,
  refetchOnWindowFocus: true,
} as const;
