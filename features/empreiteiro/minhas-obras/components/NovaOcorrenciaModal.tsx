'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import type { ObraOcorrencia } from '../types';
import { IconEdit, IconWarning } from '@shared/components/icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERIDADE_OPTIONS: { value: ObraOcorrencia['severidade']; label: string }[] = [
  { value: 'critico', label: 'Crítico' },
  { value: 'medio', label: 'Médio' },
  { value: 'baixo', label: 'Baixo' },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  titulo: z.string().min(1, 'Título obrigatório').max(120, 'Máximo 120 caracteres'),
  descricao: z.string().min(1, 'Descrição obrigatória').max(500, 'Máximo 500 caracteres'),
  severidade: z.enum(['critico', 'medio', 'baixo']),
  responsavel: z.string().min(1, 'Responsável obrigatório').max(80, 'Máximo 80 caracteres'),
  dataAbertura: z.string().min(1, 'Data de abertura obrigatória'),
  prazo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface NovaOcorrenciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ocorrencia?: ObraOcorrencia | null;
  onSalvar: (data: Omit<ObraOcorrencia, 'id' | 'status' | 'resolvidoEm' | 'resolvidoPor' | 'observacoesResolucao'>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NovaOcorrenciaModal({
  open,
  onOpenChange,
  ocorrencia,
  onSalvar,
}: NovaOcorrenciaModalProps) {
  const isEdit = !!ocorrencia;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: '',
      descricao: '',
      severidade: 'medio',
      responsavel: '',
      dataAbertura: '',
      prazo: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (ocorrencia) {
        form.reset({
          titulo: ocorrencia.titulo,
          descricao: ocorrencia.descricao,
          severidade: ocorrencia.severidade,
          responsavel: ocorrencia.responsavel,
          dataAbertura: ocorrencia.dataAbertura,
          prazo: ocorrencia.prazo ?? '',
        });
      } else {
        form.reset({
          titulo: '',
          descricao: '',
          severidade: 'medio',
          responsavel: '',
          dataAbertura: '',
          prazo: '',
        });
      }
    }
  }, [open, ocorrencia]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: FormData) => {
    onSalvar({
      titulo: data.titulo.trim(),
      descricao: data.descricao.trim(),
      severidade: data.severidade,
      responsavel: data.responsavel.trim(),
      dataAbertura: data.dataAbertura.trim(),
      prazo: data.prazo?.trim() || undefined,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {isEdit ? (
                <IconEdit className="text-red-500 text-xl" />
              ) : (
                <IconWarning className="text-red-500 text-xl" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                {isEdit ? 'Editar ocorrência' : 'Reportar problema'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                {isEdit ? 'Altere os dados da ocorrência' : 'Registre um problema ou pendência da obra'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <Form {...form}>
            <form id="form-ocorrencia" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Título */}
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Atraso na entrega de esquadrias" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Severidade */}
              <FormField
                control={form.control}
                name="severidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severidade</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SEVERIDADE_OPTIONS.map((s) => (
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

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o problema com detalhes..."
                        className="resize-none h-24"
                        {...field}
                      />
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
                      <Input placeholder="Ex: Carlos Eng." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data Abertura + Prazo */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="dataAbertura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de abertura</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 10/06/2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prazo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Prazo{' '}
                        <span className="text-gray-400 font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 25/06/2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-0 flex flex-row justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-ocorrencia">
            {isEdit ? 'Salvar alterações' : 'Reportar problema'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
