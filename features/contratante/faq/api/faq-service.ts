import { ENABLE_MOCK } from '../constants';
import { mockContratanteFAQItems } from '../mocks/faq.mock';
import type { ContratanteFAQItem } from '../types';

export async function getContratanteFAQItems(): Promise<ContratanteFAQItem[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockContratanteFAQItems;
  }
  const response = await fetch('/api/contratante/faq');
  if (!response.ok) throw new Error('Erro ao buscar FAQ');
  return response.json();
}
