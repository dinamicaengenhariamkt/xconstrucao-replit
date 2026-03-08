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
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { Button } from '@shared/components/ui/button';
import type { ObraOcorrencia } from '../types';
import { IconTaskAlt, IconCheck } from '@shared/components/icons';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  resolvidoPor: z.string().min(1, 'Informe quem resolveu').max(80, 'Máximo 80 caracteres'),
  resolvidoEm: z.string().min(1, 'Data de resolução obrigatória'),
  observacoesResolucao: z.string().max(300, 'Máximo 300 caracteres').optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ResolverOcorrenciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ocorrencia: ObraOcorrencia | null;
  onResolver: (dados: Pick<ObraOcorrencia, 'resolvidoPor' | 'resolvidoEm' | 'observacoesResolucao'>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResolverOcorrenciaModal({
  open,
  onOpenChange,
  ocorrencia,
  onResolver,
}: ResolverOcorrenciaModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      resolvidoPor: '',
      resolvidoEm: '',
      observacoesResolucao: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        resolvidoPor: '',
        resolvidoEm: '',
        observacoesResolucao: '',
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: FormData) => {
    onResolver({
      resolvidoPor: data.resolvidoPor.trim(),
      resolvidoEm: data.resolvidoEm.trim(),
      observacoesResolucao: data.observacoesResolucao?.trim() || undefined,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-sm p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <IconTaskAlt className="text-emerald-600 text-xl" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Marcar como resolvida
              </DialogTitle>
              {ocorrencia && (
                <DialogDescription className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {ocorrencia.titulo}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-5">
          <Form {...form}>
            <form id="form-resolver" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Resolvido por */}
              <FormField
                control={form.control}
                name="resolvidoPor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolvido por</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Carlos Eng." {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Resolvido em */}
              <FormField
                control={form.control}
                name="resolvidoEm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de resolução</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 08/06/2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoesResolucao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Observações{' '}
                      <span className="text-gray-400 font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Laudo aprovado, resina epóxi aplicada..."
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
        <DialogFooter className="p-5 pt-0 flex flex-row justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-resolver"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <IconCheck className="text-sm mr-1" />
            Marcar resolvida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
