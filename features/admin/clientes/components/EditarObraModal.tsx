'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RiEdit2Line } from 'react-icons/ri';
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
import { useToast } from '@shared/hooks/use-toast';
import type { AdminClienteObra } from '../types';

const editarObraSchema = z.object({
  status: z.enum(['em_andamento', 'concluida', 'pausada', 'planejamento']),
  previsaoFim: z.string().min(1, 'Informe a data de previsão de término'),
});

type EditarObraFormData = z.infer<typeof editarObraSchema>;

// Espelha `obraStatusEnum` do schema — 'cancelada' não existe no banco.
const STATUS_OPTIONS: { value: AdminClienteObra['status']; label: string }[] = [
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'pausada', label: 'Pausada' },
];

interface EditarObraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obra: AdminClienteObra;
  /** Persiste via PATCH /api/admin/clientes/[id]/obras. */
  onSave: (data: { obraId: string; status: AdminClienteObra['status']; previsaoFim: string | null }) => Promise<void>;
}

export function EditarObraModal({ open, onOpenChange, obra, onSave }: EditarObraModalProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<EditarObraFormData>({
    resolver: zodResolver(editarObraSchema),
    defaultValues: {
      status: obra.status,
      previsaoFim: obra.previsaoFim,
    },
  });

  const handleClose = () => {
    form.reset({
      status: obra.status,
      previsaoFim: obra.previsaoFim,
    });
    onOpenChange(false);
  };

  const onSubmit = async (data: EditarObraFormData) => {
    setIsPending(true);
    try {
      await onSave({ obraId: obra.id, status: data.status, previsaoFim: data.previsaoFim || null });
      toast({
        title: 'Obra atualizada',
        description: `Dados de "${obra.nome}" salvos com sucesso.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Não foi possível salvar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-lg p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <RiEdit2Line className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Editar Obra
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5 truncate max-w-[320px]">
                {obra.nome} · {obra.codigo}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6">
          <Form {...form}>
            <form
              id="form-editar-obra"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer border-2 transition-all ${
                              field.value === opt.value
                                ? 'border-primary bg-primary/5'
                                : 'border-transparent bg-gray-100 dark:bg-gray-800 hover:border-primary/30'
                            }`}
                          >
                            <input
                              type="radio"
                              value={opt.value}
                              checked={field.value === opt.value}
                              onChange={() => field.onChange(opt.value)}
                              className="w-4 h-4 text-primary focus:ring-primary/20"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {opt.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/*
                Empreiteira é somente-leitura: vem da FK `obras.empreiteiraId`,
                atribuída pelo aceite de candidatura (J05). Editá-la como texto
                livre aqui não teria onde persistir.
              */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Empreiteira responsável
                </p>
                <p
                  className="mt-1 px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400"
                  data-testid="text-empreiteira-obra"
                >
                  {obra.empreiteira}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Definida quando o contratante aceita uma candidatura.
                </p>
              </div>

              {/* Previsão de Término */}
              <FormField
                control={form.control}
                name="previsaoFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Previsão de término <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex flex-row justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-editar-obra"
            disabled={isPending}
          >
            <RiEdit2Line className="w-4 h-4 mr-2" />
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
