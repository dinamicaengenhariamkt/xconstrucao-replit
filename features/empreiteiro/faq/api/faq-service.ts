import { ENABLE_MOCK } from '../constants';
import { mockFAQItems } from '../mocks/faq.mock';
import type { FAQItem } from '../types';

export async function getFAQItems(): Promise<FAQItem[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockFAQItems;
  }
  const response = await fetch('/api/empreiteiro/faq');
  if (!response.ok) throw new Error('Erro ao buscar FAQ');
  return response.json();
}
