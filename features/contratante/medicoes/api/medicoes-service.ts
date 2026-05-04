/**
 * Service para buscar medições do contratante (visão de quem aprova).
 */

import { ENABLE_MOCK } from '../constants';
import {
  mockMedicoesContratante,
  mockMedicoesContratanteKPI,
} from '../mocks/medicoes.mock';
import type { MedicaoContratante, MedicoesContratanteKPI } from '../types';

export async function getMedicoesContratante(): Promise<MedicaoContratante[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockMedicoesContratante;
  }

  const response = await fetch('/api/contratante/medicoes');
  if (!response.ok) {
    throw new Error('Erro ao buscar medições do contratante');
  }
  return response.json();
}

export async function getMedicoesContratanteKPI(): Promise<MedicoesContratanteKPI> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockMedicoesContratanteKPI;
  }

  const response = await fetch('/api/contratante/medicoes/kpi');
  if (!response.ok) {
    throw new Error('Erro ao buscar KPI de medições');
  }
  return response.json();
}
