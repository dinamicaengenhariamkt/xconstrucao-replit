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
import type { ObraDocumento } from '../types';
import { IconEditDocument } from '@shared/components/icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIAS: { value: ObraDocumento['categoria']; label: string }[] = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'art_rrt', label: 'ART / RRT' },
  { value: 'planta', label: 'Planta / Projeto' },
  { value: 'relatorio', label: 'Relatório' },
  { value: 'alvara', label: 'Alvará' },
  { value: 'laudo', label: 'Laudo Técnico' },
];

const STATUS_OPTIONS: { value: NonNullable<ObraDocumento['status']> | 'none'; label: string }[] = [
  { value: 'none', label: '— Sem status' },
  { value: 'assinado', label: 'Assinado' },
  { value: 'valido', label: 'Válido' },
  { value: 'vencendo', label: 'Vencendo' },
  { value: 'novo', label: 'Novo' },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(100, 'Máximo 100 caracteres'),
  categoria: z.enum(['contrato', 'art_rrt', 'planta', 'relatorio', 'alvara', 'laudo', 'foto', 'outros']),
  status: z.enum(['none', 'assinado', 'valido', 'vencendo', 'novo']),
  observacoes: z.string().max(200, 'Máximo 200 caracteres').optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditarDocumentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: ObraDocumento | null;
  onSalvar: (updates: Partial<ObraDocumento>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditarDocumentoModal({
  open,
  onOpenChange,
  doc,
  onSalvar,
}: EditarDocumentoModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      categoria: 'contrato',
      status: 'none',
      observacoes: '',
    },
  });

  useEffect(() => {
    if (open && doc) {
      form.reset({
        nome: doc.nome,
        categoria: doc.categoria,
        status: doc.status ?? 'none',
        observacoes: doc.observacoes ?? '',
      });
    }
  }, [open, doc]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: FormData) => {
    onSalvar({
      nome: data.nome.trim(),
      categoria: data.categoria,
      status: data.status === 'none' ? undefined : data.status,
      observacoes: data.observacoes?.trim() || undefined,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-sm p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <IconEditDocument className="text-primary text-xl" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Editar documento
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Altere os dados do documento
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-5">
          <Form {...form}>
            <form id="form-editar-doc" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do documento" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Categoria */}
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIAS.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Observações{' '}
                      <span className="text-gray-400 font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Registro, vigência, notas..."
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
          <Button type="submit" form="form-editar-doc" size="sm">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
