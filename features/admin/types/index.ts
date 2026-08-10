import type { IconType } from 'react-icons';

export interface NavItem {
  title: string;
  url: string;
  icon: IconType;
  // XG06 — escopos que enxergam o item. AUSENTE ⇒ apenas "global", que é o
  // default de todo admin existente: por isso nenhum item precisou ser anotado
  // para a navegação de hoje continuar idêntica. Só o que o admin xgestão pode
  // ver recebe a anotação explícita.
  escopos?: Array<'global' | 'xgestao'>;
}

export interface AdminLayoutProps {
  children: React.ReactNode;
}
