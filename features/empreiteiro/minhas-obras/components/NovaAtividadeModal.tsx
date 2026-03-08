'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@shared/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { Button } from '@shared/components/ui/button';
import { Slider } from '@shared/components/ui/slider';
import type { ObraAtividade } from '../types';
import { IconCalendarMonth, IconAddTask } from '@shared/components/icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ObraAtividade['status']; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'concluido', label: 'Concluído' },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(100, 'Máximo 100 caracteres'),
  responsavel: z.string().min(1, 'Responsável obrigatório').max(80, 'Máximo 80 caracteres'),
  inicio: z.string().min(1, 'Início obrigatório'),
  fim: z.string().min(1, 'Fim obrigatório'),
  progresso: z.number().min(0).max(100),
  status: z.enum(['pendente', 'em_andamento', 'atrasado', 'concluido']),
  descricao: z.string().max(300, 'Máximo 300 caracteres').optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface NovaAtividadeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atividade?: ObraAtividade | null;
  onSalvar: (data: Omit<ObraAtividade, 'id'>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NovaAtividadeModal({
  open,
  onOpenChange,
  atividade,
  onSalvar,
}: NovaAtividadeModalProps) {
  const isEdit = !!atividade;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      responsavel: '',
      inicio: '',
      fim: '',
      progresso: 0,
      status: 'pendente',
      descricao: '',
    },
  });

  const statusValue = form.watch('status');

  // When status changes to 'concluido', force progresso to 100
  useEffect(() => {
    if (statusValue === 'concluido') {
      form.setValue('progresso', 100);
    }
  }, [statusValue, form]);

  useEffect(() => {
    if (open) {
      if (atividade) {
        form.reset({
          nome: atividade.nome,
          responsavel: atividade.responsavel,
          inicio: atividade.inicio,
          fim: atividade.fim,
          progresso: atividade.progresso,
          status: atividade.status,
          descricao: atividade.descricao ?? '',
        });
      } else {
        form.reset({
          nome: '',
          responsavel: '',
          inicio: '',
          fim: '',
          progresso: 0,
          status: 'pendente',
          descricao: '',
        });
      }
    }
  }, [open, atividade]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: FormData) => {
    onSalvar({
      nome: data.nome.trim(),
      responsavel: data.responsavel.trim(),
      inicio: data.inicio.trim(),
      fim: data.fim.trim(),
      progresso: data.status === 'concluido' ? 100 : data.progresso,
      status: data.status,
      descricao: data.descricao?.trim() || undefined,
    });
    handleClose();
  };

  const progressoTravado = statusValue === 'concluido';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              {isEdit ? (
                <IconCalendarMonth className="text-primary text-xl" />
              ) : (
                <IconAddTask className="text-primary text-xl" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                {isEdit ? 'Editar atividade' : 'Nova atividade'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                {isEdit ? 'Altere os dados da atividade' : 'Adicione uma atividade ao cronograma'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <Form {...form}>
            <form id="form-atividade" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da atividade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Estrutura de concreto" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Responsável */}
              <FormField
                control={form.control}
                name="responsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Equipe B" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Período: Início + Fim */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 01/07" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 30/09" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Progresso */}
              <FormField
                control={form.control}
                name="progresso"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Progresso</FormLabel>
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {field.value}%
                      </span>
                    </div>
                    <FormControl>
                      <Controller
                        control={form.control}
                        name="progresso"
                        render={({ field: sliderField }) => (
                          <Slider
                            min={0}
                            max={100}
                            step={5}
                            value={[sliderField.value]}
                            onValueChange={([v]) => sliderField.onChange(v)}
                            disabled={progressoTravado}
                            className={progressoTravado ? 'opacity-50 cursor-not-allowed' : ''}
                          />
                        )}
                      />
                    </FormControl>
                    {progressoTravado && (
                      <p className="text-xs text-gray-400">Travado em 100% — atividade concluída</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Descrição{' '}
                      <span className="text-gray-400 font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Detalhes, observações ou notas sobre a atividade..."
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-0 flex flex-row justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-atividade">
            {isEdit ? 'Salvar alterações' : 'Adicionar atividade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
