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
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import type { MinhaObraChecklist, MembroEquipe } from '../types';
import { IconDraw } from '@shared/components/icons';

// ─── Schema ───────────────────────────────────────────────────────────────────

const assinarSchema = z.object({
  nome: z.string().min(3, 'Informe o nome completo do responsável'),
  registroProfissional: z.string().optional(),
  declaracao: z.literal(true, {
    errorMap: () => ({ message: 'É necessário confirmar a declaração para assinar' }),
  }),
});

type AssinarFormData = z.infer<typeof assinarSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AssinarChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklist: MinhaObraChecklist | null;
  equipe?: MembroEquipe[];
  onConfirmar: (assinadoPor: string, registroProfissional?: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssinarChecklistModal({
  open,
  onOpenChange,
  checklist,
  equipe = [],
  onConfirmar,
}: AssinarChecklistModalProps) {
  // Pré-preenche com o engenheiro responsável da equipe, se disponível
  const engenheiro = equipe.find((m) => m.tipo === 'engenheiro');

  const form = useForm<AssinarFormData>({
    resolver: zodResolver(assinarSchema),
    defaultValues: {
      nome: engenheiro?.nome ?? '',
      registroProfissional: engenheiro?.registro ?? '',
      declaracao: undefined as unknown as true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nome: engenheiro?.nome ?? '',
        registroProfissional: engenheiro?.registro ?? '',
        declaracao: undefined as unknown as true,
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: AssinarFormData) => {
    onConfirmar(data.nome, data.registroProfissional || undefined);
    handleClose();
  };

  const totalItens = checklist?.itens.length ?? 0;
  const concluidos = checklist?.itens.filter((i) => i.concluida).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <IconDraw className="text-purple-600 text-xl" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Assinar checklist
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {checklist?.nome}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 flex flex-col gap-5">
          {/* Resumo do checklist */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                Itens verificados
              </span>
              <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
                {concluidos}/{totalItens}
              </span>
            </div>
            <div className="w-full h-2 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all"
                style={{ width: totalItens > 0 ? `${(concluidos / totalItens) * 100}%` : '0%' }}
              />
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              Ao assinar, você atesta que todos os itens foram devidamente verificados.
            </p>
          </div>

          <Form {...form}>
            <form id="form-assinar" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Nome do responsável */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nome do responsável <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Registro profissional */}
              <FormField
                control={form.control}
                name="registroProfissional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Registro profissional{' '}
                      <span className="text-xs text-gray-400 font-normal">(CREA/CAU — opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: CREA-SP 123456-D" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Declaração */}
              <FormField
                control={form.control}
                name="declaracao"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <label
                        className={cn(
                          'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                          field.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={field.value === true}
                          onChange={(e) => field.onChange(e.target.checked ? true : undefined)}
                          className="w-4 h-4 mt-0.5 rounded accent-purple-600 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          Declaro que todos os itens deste checklist foram verificados conforme as
                          normas técnicas vigentes e assumo responsabilidade técnica por esta validação.
                        </span>
                      </label>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-0 flex flex-row justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-assinar"
            className="bg-purple-600 hover:bg-purple-700 text-white border-0"
          >
            <IconDraw className="text-sm mr-1" />
            Assinar checklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
