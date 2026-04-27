'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { HealthStatus } from '../types';
import { HEALTH_QUERY_PARAM, parseHealthStatus } from '../urls';

export interface UseSaudeFilterResult {
  value: HealthStatus | undefined;
  setValue: (next: HealthStatus | undefined) => void;
}

/**
 * Sincroniza o filtro de saúde com o query param `?saude=` da URL.
 * URL é a single source of truth — chips clicáveis e links externos compartilham o mesmo estado.
 */
export function useSaudeFilter(): UseSaudeFilterResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const value = parseHealthStatus(searchParams?.get(HEALTH_QUERY_PARAM));

  const setValue = useCallback(
    (next: HealthStatus | undefined) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      if (next) {
        params.set(HEALTH_QUERY_PARAM, next);
      } else {
        params.delete(HEALTH_QUERY_PARAM);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname ?? '');
    },
    [pathname, router, searchParams]
  );

  return { value, setValue };
}
