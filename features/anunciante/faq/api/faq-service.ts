import type { AnuncianteFAQItem } from '../types';

export async function getAnuncianteFAQItems(): Promise<AnuncianteFAQItem[]> {
  const response = await fetch('/api/anunciante/faq');
  if (!response.ok) throw new Error('Erro ao buscar FAQ');
  return response.json();
}
