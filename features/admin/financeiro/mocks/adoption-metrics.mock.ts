import type { AdoptionMetrics } from '../types';

/**
 * Métricas de adoção mockadas. Em produção viriam de um endpoint
 * de analytics (eventos de login, candidatura, conversão).
 */
export const mockAdoptionMetrics: AdoptionMetrics = {
  usuariosAtivos30d: 234,
  usuariosAtivos30dDeltaPercent: 12,
  novosUsuarios30d: 18,
  aplicacoes7d: 45,
  aplicacoes7dDeltaPercent: 8,
  taxaConversaoCandidatura: 28,
  churnEmpreiteirosPercent: 6,
};
