import type { ContratanteFAQItem } from '../types';

export async function getContratanteFAQItems(): Promise<ContratanteFAQItem[]> {
  const response = await fetch('/api/contratante/faq');
  if (!response.ok) throw new Error('Erro ao buscar FAQ');
  return response.json();
}
