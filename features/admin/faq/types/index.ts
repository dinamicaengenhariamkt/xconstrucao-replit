export type FAQVisao = 'contratante' | 'empreiteiro' | 'anunciante' | 'ambos';

export interface AdminFAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  visao: FAQVisao;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
