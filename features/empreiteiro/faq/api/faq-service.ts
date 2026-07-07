import type { FAQItem } from '../types';

export async function getFAQItems(): Promise<FAQItem[]> {
  const response = await fetch('/api/empreiteiro/faq');
  if (!response.ok) throw new Error('Erro ao buscar FAQ');
  return response.json();
}
