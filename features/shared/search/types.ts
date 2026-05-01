import type { ElementType } from 'react';

export interface SearchHit<TCategory extends string> {
  id: string;
  category: TCategory;
  title: string;
  subtitle?: string;
  meta?: string;
  href: string;
}

export interface SearchGroup<TCategory extends string> {
  category: TCategory;
  label: string;
  hits: SearchHit<TCategory>[];
  totalMatches: number;
  seeAllHref: string;
}

export interface QuickLink<TCategory extends string> {
  label: string;
  href: string;
  category: TCategory;
}

export interface SearchConfig<TCategory extends string> {
  /** Placeholder do CommandInput dentro do dialog. */
  placeholder: string;
  /** Texto exibido no botão trigger do topbar. */
  triggerLabel: string;
  categoryIcon: Record<TCategory, ElementType>;
  categoryIconBg: Record<TCategory, string>;
  quickLinks: QuickLink<TCategory>[];
}

export interface UseSearchResult<TCategory extends string> {
  groups: SearchGroup<TCategory>[];
  isLoading: boolean;
}
