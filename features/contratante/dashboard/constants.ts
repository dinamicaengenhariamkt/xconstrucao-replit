/**
 * Constantes do Dashboard do Contratante
 */

import { isMockEnabled } from '@/features/shared/lib/mock-flag';

export const ENABLE_MOCK = isMockEnabled();

export const PHASE_COLORS = {
  planejamento: '#f59e0b',
  fundacao: '#3b82f6',
  estrutura: '#8b5cf6',
  acabamento: '#f97316',
  concluido: '#22846D',
} as const;
