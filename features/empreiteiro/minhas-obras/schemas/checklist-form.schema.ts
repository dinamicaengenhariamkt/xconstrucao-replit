import { z } from 'zod';
import type { MinhaObraChecklist } from '../types';
import type { ComponentType } from 'react';
import { IconHealthAndSafety, IconFactCheck, IconDomain } from '@shared/components/icons';

export const checklistSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  tipo: z.enum(['seguranca', 'diario', 'etapa']),
  // XG21 — separado do `tipo` de propósito: o cliente pediu reset diário num
  // checklist de Segurança/EPIs, e `tipo` é só rótulo, ícone e cor.
  recorrencia: z.enum(['nenhuma', 'diaria', 'semanal']),
  recorrenciaDiaSemana: z.number().int().min(0).max(6).optional(),
  descricao: z.string().optional(),
  itens: z
    .array(z.object({ titulo: z.string().min(1, 'Item não pode ser vazio') }))
    .min(1, 'Adicione ao menos um item'),
});

export type ChecklistFormData = z.infer<typeof checklistSchema>;

export const TIPO_OPTIONS: {
  value: MinhaObraChecklist['tipo'];
  label: string;
  descricao: string;
  Icon: ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    value: 'seguranca',
    label: 'Segurança',
    descricao: 'EPIs, isolamentos e verificações de segurança',
    Icon: IconHealthAndSafety,
    color: 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600',
  },
  {
    value: 'diario',
    label: 'Diário',
    descricao: 'Registros e atividades do dia na obra',
    Icon: IconFactCheck,
    color: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600',
  },
  {
    value: 'etapa',
    label: 'Etapa',
    descricao: 'Validação técnica de fase da obra (requer assinatura)',
    Icon: IconDomain,
    color: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-600',
  },
];

/**
 * XG21 — com que frequência o checklist zera.
 *
 * "Deu meia-noite, ele zera, o stick some, daí eu tenho que ir lá na obra e
 * ticar tudo de novo." O histórico de cada período fica guardado, então dá para
 * saber depois se num dia específico o checklist não foi feito.
 */
export const RECORRENCIA_OPTIONS: {
  value: 'nenhuma' | 'diaria' | 'semanal';
  label: string;
  descricao: string;
}[] = [
  {
    value: 'nenhuma',
    label: 'Não repete',
    descricao: 'Marca uma vez e fica concluído',
  },
  {
    value: 'diaria',
    label: 'Todo dia',
    descricao: 'Zera à meia-noite; precisa ser refeito diariamente',
  },
  {
    value: 'semanal',
    label: 'Toda semana',
    descricao: 'Zera no início da semana escolhida',
  },
];

export const DIAS_SEMANA: { value: number; label: string }[] = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];
