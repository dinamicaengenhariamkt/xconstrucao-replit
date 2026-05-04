import type { SatisfactionMetrics } from '../types';

/**
 * Métricas de satisfação mockadas. Em produção viriam dos surveys
 * pós-conclusão de obra (cliente) e pós-pagamento (empreiteira).
 */
export const mockSatisfactionMetrics: SatisfactionMetrics = {
  npsScore: 48,
  npsDelta: 6,
  npsResponses: 187,
  csatClientes: 4.3,
  csatEmpreiteiras: 4.1,
  breakdown: {
    promotores: 62,
    neutros: 24,
    detratores: 14,
  },
};
