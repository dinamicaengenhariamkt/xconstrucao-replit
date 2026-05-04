import type { ComponentType } from 'react';
import {
  IconDraw,
  IconHealthAndSafety,
  IconFactCheck,
  IconDomain,
} from '@shared/components/icons';
import type { MinhaObraChecklist } from '../../types';

export const CHECKLIST_CONFIG: Record<
  MinhaObraChecklist['tipo'],
  {
    bgWrapper: string;
    borderColor: string;
    iconBg: string;
    checkboxAccent: string;
    itemCheckedBg: string;
    itemHoverBg: string;
    footerBorder: string;
    actionBtn: string;
    ActionBtnIcon?: ComponentType<{ className?: string }>;
    actionBtnLabel: string;
  }
> = {
  seguranca: {
    bgWrapper: 'bg-red-50/50 dark:bg-red-900/10',
    borderColor: 'border-red-100 dark:border-red-800',
    iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600',
    checkboxAccent: 'accent-red-600',
    itemCheckedBg: 'bg-success/10',
    itemHoverBg: 'hover:bg-red-100/50 dark:hover:bg-red-900/20',
    footerBorder: 'border-red-200 dark:border-red-800',
    actionBtn: 'bg-red-600 text-white hover:bg-red-700',
    actionBtnLabel: 'Finalizar',
  },
  diario: {
    bgWrapper: 'bg-blue-50/50 dark:bg-blue-900/10',
    borderColor: 'border-blue-100 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    checkboxAccent: 'accent-blue-600',
    itemCheckedBg: 'bg-success/10',
    itemHoverBg: 'hover:bg-blue-100/50 dark:hover:bg-blue-900/20',
    footerBorder: 'border-blue-200 dark:border-blue-800',
    actionBtn: 'bg-blue-600 text-white hover:bg-blue-700',
    actionBtnLabel: 'Concluir registro',
  },
  etapa: {
    bgWrapper: 'bg-purple-50/50 dark:bg-purple-900/10',
    borderColor: 'border-purple-100 dark:border-purple-800',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    checkboxAccent: 'accent-purple-600',
    itemCheckedBg: 'bg-success/10',
    itemHoverBg: 'hover:bg-purple-100/50 dark:hover:bg-purple-900/20',
    footerBorder: 'border-purple-200 dark:border-purple-800',
    actionBtn: 'bg-purple-600 text-white hover:bg-purple-700',
    ActionBtnIcon: IconDraw,
    actionBtnLabel: 'Assinar',
  },
};

export const TIPO_ICON: Record<
  MinhaObraChecklist['tipo'],
  ComponentType<{ className?: string }>
> = {
  seguranca: IconHealthAndSafety,
  diario: IconFactCheck,
  etapa: IconDomain,
};

export const STATUS_BADGE: Record<
  MinhaObraChecklist['status'],
  { label: string; classes: string }
> = {
  pendente: { label: 'Pendente', classes: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  completo: { label: 'Completo', classes: 'text-success bg-success/20' },
  em_andamento: { label: 'Em andamento', classes: 'text-primary bg-primary/10' },
};

// ─── Modal types ──────────────────────────────────────────────────────────────

export type ChecklistModalType =
  | 'novo'
  | 'editar'
  | 'assinar'
  | 'registro'
  | 'finalizar_confirm'
  | 'excluir'
  | null;

export interface ChecklistModalState {
  type: ChecklistModalType;
  checklist: MinhaObraChecklist | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function calcularStatus(
  itens: MinhaObraChecklist['itens'],
): MinhaObraChecklist['status'] {
  if (itens.length === 0) return 'pendente';
  const concluidos = itens.filter((i) => i.concluida).length;
  if (concluidos === 0) return 'pendente';
  return 'em_andamento'; // Completo só ao clicar Finalizar/Assinar
}

export function calcularProgresso(itens: MinhaObraChecklist['itens']): number {
  if (itens.length === 0) return 0;
  return Math.round((itens.filter((i) => i.concluida).length / itens.length) * 100);
}

export function horaAtual(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function dataHoraAtual(): string {
  return new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
