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
import { IconLabel } from '@shared/components/icons';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  tag: z.string().max(30, 'Máximo 30 caracteres'),
});

type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditarEtiquetaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagAtual?: string;
  onSalvar: (tag: string | undefined) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditarEtiquetaModal({
  open,
  onOpenChange,
  tagAtual,
  onSalvar,
}: EditarEtiquetaModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tag: tagAtual ?? '' },
  });

  useEffect(() => {
    if (open) form.reset({ tag: tagAtual ?? '' });
  }, [open, tagAtual]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: FormData) => {
    onSalvar(data.tag.trim() || undefined);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-xs p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <IconLabel className="text-primary text-xl" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Editar etiqueta
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Altere ou remova a etiqueta desta foto
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5">
          <Form {...form}>
            <form id="form-etiqueta" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etiqueta</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Estrutura, Fundação, Acabamento..."
                        {...field}
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="p-5 pt-0 flex flex-row justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-etiqueta" size="sm">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
