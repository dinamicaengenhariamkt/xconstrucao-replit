import type { AnuncioStatus, AnuncianteStatus } from './types';

export const PAGE_SIZE_CAMPANHAS = 10;
export const PAGE_SIZE_ANUNCIANTES = 10;

export const statusClasses: Record<AnuncioStatus, string> = {
  ativa: 'bg-[#22846D]/10 text-[#22846D]',
  pausada: 'bg-amber-50 text-amber-600 dark:bg-amber-900/10 dark:text-amber-500',
  expirada: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  agendada: 'bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400',
};

export const statusLabels: Record<AnuncioStatus, string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  expirada: 'Expirada',
  agendada: 'Agendada',
};

export const STATUS_CAMPANHA_OPTIONS: { value: AnuncioStatus; label: string }[] = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'expirada', label: 'Expirada' },
  { value: 'agendada', label: 'Agendada' },
];

export const ZONA_OPTIONS: { value: string; label: string }[] = [
  { value: 'sidebar-sup-contratante', label: 'Sidebar Sup. Contratante' },
  { value: 'sidebar-inf-contratante', label: 'Sidebar Inf. Contratante' },
  { value: 'sidebar-sup-empreiteiro', label: 'Sidebar Sup. Empreiteiro' },
  { value: 'sidebar-inf-empreiteiro', label: 'Sidebar Inf. Empreiteiro' },
  { value: 'banner-dashboard-contratante', label: 'Banner Dashboard – Contratante' },
  { value: 'banner-dashboard-empreiteiro', label: 'Banner Dashboard – Empreiteiro' },
  { value: 'banner-qa', label: 'Banner Q&A' },
];

export const STATUS_ANUNCIANTE_OPTIONS: { value: AnuncianteStatus; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
];
