'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { HealthStatus } from '../types';
import { HEALTH_QUERY_PARAM, parseHealthStatus } from '../urls';

export interface UseSaudeMultiFilterResult {
  values: HealthStatus[];
  setValues: (next: HealthStatus[]) => void;
}

/**
 * Versão multi-select de useSaudeFilter — sincroniza com `?saude=` da URL como CSV.
 * Ex.: `?saude=saudavel,risco` → ['saudavel', 'risco']. Retrocompatível com single value.
 */
export function useSaudeMultiFilter(): UseSaudeMultiFilterResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = searchParams?.get(HEALTH_QUERY_PARAM) ?? '';
  const values = raw
    .split(',')
    .map((token) => parseHealthStatus(token.trim()))
    .filter((v): v is HealthStatus => v !== undefined);

  const setValues = useCallback(
    (next: HealthStatus[]) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      if (next.length > 0) {
        params.set(HEALTH_QUERY_PARAM, next.join(','));
      } else {
        params.delete(HEALTH_QUERY_PARAM);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname ?? '');
    },
    [pathname, router, searchParams]
  );

  return { values, setValues };
}
