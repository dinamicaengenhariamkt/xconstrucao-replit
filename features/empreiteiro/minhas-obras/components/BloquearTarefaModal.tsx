'use client';

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
import type { MinhaObraTarefa } from '../types';
import { IconBlock } from '@shared/components/icons';

// ─── Schema ───────────────────────────────────────────────────────────────────

const bloquearSchema = z.object({
  motivo: z.string().min(3, 'Informe o motivo do bloqueio'),
  info: z.string().optional(),
});

type BloquearFormData = z.infer<typeof bloquearSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface BloquearTarefaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarefa: MinhaObraTarefa | null;
  onConfirmar: (motivo: string, info?: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BloquearTarefaModal({
  open,
  onOpenChange,
  tarefa,
  onConfirmar,
}: BloquearTarefaModalProps) {
  const form = useForm<BloquearFormData>({
    resolver: zodResolver(bloquearSchema),
    defaultValues: { motivo: tarefa?.bloqueioMotivo ?? '', info: tarefa?.bloqueioInfo ?? '' },
  });

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: BloquearFormData) => {
    onConfirmar(data.motivo, data.info || undefined);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <IconBlock className="text-amber-600 text-xl" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Bloquear tarefa
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {tarefa?.titulo}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          <Form {...form}>
            <form id="form-bloquear-tarefa" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Motivo do bloqueio <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Aguardando material" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Informação adicional <span className="text-xs text-gray-400 font-normal">(opcional)</span></FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        placeholder="Ex: Fornecedor confirmou entrega para 28/06"
                        rows={3}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="p-6 pt-0 flex flex-row justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-bloquear-tarefa"
            className="bg-amber-500 hover:bg-amber-600 text-white border-0"
          >
            <IconBlock className="text-sm mr-1" />
            Bloquear tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
