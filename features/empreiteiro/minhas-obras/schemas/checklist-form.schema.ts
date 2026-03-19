import { z } from 'zod';
import type { MinhaObraChecklist } from '../types';
import type { ComponentType } from 'react';
import { IconHealthAndSafety, IconFactCheck, IconDomain } from '@shared/components/icons';

export const checklistSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  tipo: z.enum(['seguranca', 'diario', 'etapa']),
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
