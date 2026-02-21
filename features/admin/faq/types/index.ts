export interface AdminFAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
