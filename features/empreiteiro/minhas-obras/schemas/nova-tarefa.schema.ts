import { z } from 'zod';
import type { MinhaObraTarefa } from '../types';

export const novaTarefaSchema = z
  .object({
    titulo: z.string().min(3, 'Título deve ter ao menos 3 caracteres'),
    etapa: z.string().min(1, 'Selecione uma etapa'),
    responsavel: z.string().min(1, 'Informe o responsável'),
    prazo: z.string().min(1, 'Informe o prazo'),
    prioridade: z.enum(['alta', 'media', 'baixa']),
    status: z.enum(['pendente', 'em_andamento', 'bloqueado', 'concluido']),
    progresso: z.number().min(0).max(100).optional(),
    bloqueioMotivo: z.string().optional(),
    bloqueioInfo: z.string().optional(),
    descricao: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'bloqueado' && !data.bloqueioMotivo?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o motivo do bloqueio',
        path: ['bloqueioMotivo'],
      });
    }
  });

export type NovaTarefaFormData = z.infer<typeof novaTarefaSchema>;

export const PRIORIDADE_OPTIONS: { value: MinhaObraTarefa['prioridade']; label: string; color: string }[] = [
  { value: 'alta', label: 'Alta', color: 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600' },
  { value: 'media', label: 'Média', color: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
  { value: 'baixa', label: 'Baixa', color: 'border-success bg-success/10 text-success' },
];

export const TAREFA_STATUS_OPTIONS: { value: MinhaObraTarefa['status']; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'bloqueado', label: 'Bloqueado' },
  { value: 'concluido', label: 'Concluído' },
];
