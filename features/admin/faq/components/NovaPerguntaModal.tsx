'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RiQuestionLine, RiUserLine, RiToolsLine, RiGroupLine } from 'react-icons/ri';
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
import { Button } from '@shared/components/ui/button';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { Switch } from '@shared/components/ui/switch';
import { cn } from '@shared/lib/utils';
import { ADMIN_FAQ_CATEGORIES } from '../constants';
import { useCriarFaq, useEditarFaq } from '../hooks/use-faq';
import type { AdminFAQItem, FAQVisao } from '../types';

const novaPerguntaSchema = z.object({
  question: z.string().min(10, 'Mínimo de 10 caracteres'),
  answer: z.string().min(20, 'Mínimo de 20 caracteres'),
  category: z.string().min(1, 'Selecione uma categoria'),
  visao: z.enum(['contratante', 'empreiteiro', 'ambos'] as const),
  ordem: z.number().int().min(1, 'Ordem deve ser pelo menos 1'),
  ativo: z.boolean(),
});

type NovaPerguntaFormData = z.infer<typeof novaPerguntaSchema>;

interface NovaPerguntaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: AdminFAQItem | null;
}

const VISAO_OPTIONS: { value: FAQVisao; label: string; description: string; icon: React.ElementType; color: string; selectedColor: string }[] = [
  {
    value: 'contratante',
    label: 'Contratante',
    description: 'Visível para contratantes',
    icon: RiUserLine,
    color: 'border-transparent bg-gray-100 dark:bg-gray-800 hover:border-amber-300/50',
    selectedColor: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
  },
  {
    value: 'empreiteiro',
    label: 'Empreiteiro',
    description: 'Visível para empreiteiros',
    icon: RiToolsLine,
    color: 'border-transparent bg-gray-100 dark:bg-gray-800 hover:border-green-300/50',
    selectedColor: 'border-green-400 bg-green-50 dark:bg-green-900/20',
  },
  {
    value: 'ambos',
    label: 'Ambas as visões',
    description: 'Visível para todos',
    icon: RiGroupLine,
    color: 'border-transparent bg-gray-100 dark:bg-gray-800 hover:border-purple-300/50',
    selectedColor: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
  },
];

export function NovaPerguntaModal({ open, onOpenChange, editItem }: NovaPerguntaModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditing = !!editItem;
  const criarFaq = useCriarFaq();
  const editarFaq = useEditarFaq();

  const form = useForm<NovaPerguntaFormData>({
    resolver: zodResolver(novaPerguntaSchema),
    defaultValues: {
      question: '',
      answer: '',
      category: '',
      visao: 'ambos',
      ordem: 1,
      ativo: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (editItem) {
        form.reset({
          question: editItem.question,
          answer: editItem.answer,
          category: editItem.category,
          visao: editItem.visao,
          ordem: editItem.ordem,
          ativo: editItem.ativo,
        });
      } else {
        form.reset({
          question: '',
          answer: '',
          category: '',
          visao: 'ambos',
          ordem: 1,
          ativo: true,
        });
      }
      setSubmitError(null);
    }
  }, [open, editItem, form]);

  const handleClose = () => {
    form.reset();
    setSubmitError(null);
    onOpenChange(false);
  };

  const onSubmit = async (data: NovaPerguntaFormData) => {
    setSubmitError(null);
    try {
      if (isEditing && editItem) {
        await editarFaq.mutateAsync({ id: editItem.id, ...data });
      } else {
        await criarFaq.mutateAsync(data);
      }
      handleClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao salvar pergunta. Tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-2xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden"
        data-testid="modal-nova-pergunta"
      >
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <RiQuestionLine className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Pergunta' : 'Nova Pergunta'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                {isEditing
                  ? 'Edite os dados da pergunta frequente'
                  : 'Preencha os dados para adicionar uma nova pergunta'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Form {...form}>
              <form
                id="form-nova-pergunta"
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
                data-testid="form-nova-pergunta"
              >
                {/* Pergunta */}
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Pergunta <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={3}
                          placeholder="Digite a pergunta..."
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                          data-testid="input-question"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resposta */}
                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Resposta <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={5}
                          placeholder="Digite a resposta completa..."
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                          data-testid="input-answer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categoria + Ordem */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Categoria <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ADMIN_FAQ_CATEGORIES).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ordem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Ordem
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-ordem"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Visão */}
                <FormField
                  control={form.control}
                  name="visao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Visão <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-3">
                          {VISAO_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const isSelected = field.value === opt.value;
                            return (
                              <label
                                key={opt.value}
                                className={cn(
                                  'flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer border-2 transition-all text-center',
                                  isSelected ? opt.selectedColor : opt.color
                                )}
                                data-testid={`radio-visao-${opt.value}`}
                              >
                                <input
                                  type="radio"
                                  value={opt.value}
                                  checked={isSelected}
                                  onChange={() => field.onChange(opt.value)}
                                  className="sr-only"
                                />
                                <Icon className={cn('w-5 h-5', isSelected ? 'opacity-100' : 'text-gray-400')} />
                                <span className={cn('text-xs font-semibold leading-tight', isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500')}>
                                  {opt.label}
                                </span>
                                <span className="text-xs text-gray-400 leading-tight">{opt.description}</span>
                              </label>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ativo */}
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
                        <div>
                          <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                            Pergunta ativa
                          </FormLabel>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Perguntas inativas não são exibidas aos usuários
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-ativo"
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />

                {submitError && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3">
                    {submitError}
                  </p>
                )}
              </form>
            </Form>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            data-testid="button-cancelar"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-nova-pergunta"
            disabled={form.formState.isSubmitting}
            data-testid="button-salvar"
          >
            {form.formState.isSubmitting
              ? isEditing ? 'Salvando...' : 'Adicionando...'
              : isEditing ? 'Salvar alterações' : 'Adicionar pergunta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
