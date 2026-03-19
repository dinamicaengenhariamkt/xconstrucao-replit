'use client';

import { useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { cn } from '@shared/lib/utils';
import type { MinhaObraChecklist } from '../types';
import { IconClose, IconAdd, IconTaskAlt, IconEdit, IconPlaylistAdd, IconDragIndicator, IconSave } from '@shared/components/icons';
import { checklistSchema, type ChecklistFormData, TIPO_OPTIONS } from '../schemas/checklist-form.schema';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChecklistFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklistParaEditar?: MinhaObraChecklist | null;
  onSalvar: (checklist: MinhaObraChecklist) => void;
}

function gerarId() {
  return `cl${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function gerarItemId() {
  return `cli${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChecklistFormModal({
  open,
  onOpenChange,
  checklistParaEditar,
  onSalvar,
}: ChecklistFormModalProps) {
  const isEdicao = Boolean(checklistParaEditar);
  const isCompleto = checklistParaEditar?.status === 'completo';
  const novoItemRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      nome: '',
      tipo: 'seguranca',
      descricao: '',
      itens: [{ titulo: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens',
  });

  // Preenche ao abrir em modo edição
  useEffect(() => {
    if (open && checklistParaEditar) {
      form.reset({
        nome: checklistParaEditar.nome,
        tipo: checklistParaEditar.tipo,
        descricao: checklistParaEditar.descricao ?? '',
        itens: checklistParaEditar.itens.map((i) => ({ titulo: i.titulo })),
      });
    } else if (open && !checklistParaEditar) {
      form.reset({ nome: '', tipo: 'seguranca', descricao: '', itens: [{ titulo: '' }] });
    }
  }, [open, checklistParaEditar]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: ChecklistFormData) => {
    if (isEdicao && checklistParaEditar) {
      // Preserva estado dos itens existentes (concluida) ao editar
      const itensAtualizados = data.itens.map((item, idx) => {
        const original = checklistParaEditar.itens[idx];
        return {
          id: original?.id ?? gerarItemId(),
          titulo: item.titulo,
          concluida: original?.concluida ?? false,
        };
      });
      onSalvar({ ...checklistParaEditar, nome: data.nome, tipo: data.tipo, descricao: data.descricao ?? '', itens: itensAtualizados });
    } else {
      const novoChecklist: MinhaObraChecklist = {
        id: gerarId(),
        nome: data.nome,
        tipo: data.tipo,
        descricao: data.descricao ?? '',
        status: 'pendente',
        itens: data.itens.map((item) => ({ id: gerarItemId(), titulo: item.titulo, concluida: false })),
      };
      onSalvar(novoChecklist);
    }
    handleClose();
  };

  const tituloModal = isCompleto ? 'Ver checklist' : isEdicao ? 'Editar Checklist' : 'Novo Checklist';
  const descricaoModal = isCompleto
    ? 'Este checklist já foi finalizado e está em modo somente leitura'
    : isEdicao
      ? 'Altere os dados do checklist abaixo'
      : 'Configure o checklist e seus itens de verificação';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              {isCompleto ? (
                <IconTaskAlt className="text-primary text-xl" />
              ) : isEdicao ? (
                <IconEdit className="text-primary text-xl" />
              ) : (
                <IconPlaylistAdd className="text-primary text-xl" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {tituloModal}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                {descricaoModal}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Form {...form}>
              <form id="form-checklist" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Nome */}
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nome <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Segurança Diária, Etapa: Fundação..."
                          {...field}
                          disabled={isCompleto}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo — radio cards */}
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tipo <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          {TIPO_OPTIONS.map((opt) => (
                            <label
                              key={opt.value}
                              className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border-2 transition-all',
                                field.value === opt.value
                                  ? opt.color + ' border-current'
                                  : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:border-gray-200',
                                isCompleto && 'cursor-default pointer-events-none'
                              )}
                            >
                              <input
                                type="radio"
                                value={opt.value}
                                checked={field.value === opt.value}
                                onChange={() => !isCompleto && field.onChange(opt.value)}
                                className="sr-only"
                              />
                              <opt.Icon className="text-lg" />
                              <div>
                                <p className="text-sm font-semibold">{opt.label}</p>
                                <p className="text-xs text-gray-400">{opt.descricao}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </FormControl>
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
                        <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Obrigatório todo dia, Validação técnica..."
                          {...field}
                          disabled={isCompleto}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Itens */}
                <div>
                  <FormLabel className="mb-3 block">
                    Itens de verificação <span className="text-red-500">*</span>
                  </FormLabel>
                  <div className="flex flex-col gap-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <IconDragIndicator className="text-sm text-gray-400" />
                        <FormField
                          control={form.control}
                          name={`itens.${index}.titulo`}
                          render={({ field: f }) => (
                            <FormItem className="flex-1 mb-0">
                              <FormControl>
                                <Input
                                  placeholder={`Item ${index + 1}...`}
                                  {...f}
                                  disabled={isCompleto}
                                  ref={index === fields.length - 1 ? novoItemRef : undefined}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isCompleto) {
                                      e.preventDefault();
                                      append({ titulo: '' });
                                      setTimeout(() => novoItemRef.current?.focus(), 50);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {!isCompleto && fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer rounded"
                            aria-label="Remover item"
                          >
                            <IconClose className="text-lg" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.itens?.root && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.itens.root.message}
                    </p>
                  )}
                  {!isCompleto && (
                    <button
                      type="button"
                      onClick={() => {
                        append({ titulo: '' });
                        setTimeout(() => novoItemRef.current?.focus(), 50);
                      }}
                      className="mt-3 w-full py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-500 hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <IconAdd className="text-sm" />
                      Adicionar item
                    </button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex flex-row justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            {isCompleto ? 'Fechar' : 'Cancelar'}
          </Button>
          {!isCompleto && (
            <Button type="submit" form="form-checklist">
              {isEdicao ? (
                <IconSave className="text-sm mr-1" />
              ) : (
                <IconPlaylistAdd className="text-sm mr-1" />
              )}
              {isEdicao ? 'Salvar alterações' : 'Criar checklist'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
