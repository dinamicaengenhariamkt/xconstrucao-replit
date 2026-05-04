'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RiEditLine,
  RiSave3Line,
  RiArrowLeftLine,
  RiUserLine,
  RiBarChartLine,
  RiPhoneLine,
  RiMailLine,
  RiAddLine,
} from 'react-icons/ri';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { cn } from '@shared/lib/utils';
import { editarAnuncianteSchema } from '../schemas';
import type { EditarAnuncianteFormData } from '../schemas';
import type { Anunciante } from '../types';

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface AnuncianteModalProps {
  anunciante: Anunciante | null;
  initialMode?: 'view' | 'edit';
  onOpenChange: (open: boolean) => void;
  isNew?: boolean;
  onSave?: (data: EditarAnuncianteFormData) => void;
}

export function AnuncianteModal({
  anunciante,
  initialMode = 'view',
  onOpenChange,
  isNew = false,
  onSave,
}: AnuncianteModalProps) {
  const isOpen = anunciante !== null || isNew;
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);

  const form = useForm<EditarAnuncianteFormData>({
    resolver: zodResolver(editarAnuncianteSchema),
    defaultValues: {
      nome:     '',
      sigla:    '',
      contato:  '',
      email:    '',
      telefone: '',
      status:   'ativo',
    },
  });

  useEffect(() => {
    if (isNew) {
      setMode('edit');
      form.reset({ nome: '', sigla: '', contato: '', email: '', telefone: '', status: 'ativo' });
    } else {
      setMode(initialMode);
      if (anunciante) {
        form.reset({
          nome:     anunciante.nome,
          sigla:    anunciante.sigla,
          contato:  anunciante.contato,
          email:    anunciante.email,
          telefone: anunciante.telefone,
          status:   anunciante.status,
        });
      }
    }
  }, [anunciante, initialMode, isNew, form]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: EditarAnuncianteFormData) => {
    onSave?.(data);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-lg max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden"
        data-testid="modal-anunciante"
      >
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                  isNew
                    ? 'bg-primary/5'
                    : mode === 'edit'
                    ? 'bg-primary/5'
                    : anunciante?.corBg ?? 'bg-gray-100'
                )}
              >
                {isNew ? (
                  <RiAddLine className="w-6 h-6 text-primary" />
                ) : mode === 'edit' ? (
                  <RiEditLine className="w-6 h-6 text-primary" />
                ) : (
                  <span className={cn('text-sm font-bold', anunciante?.corTexto)}>
                    {anunciante?.sigla}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {isNew
                    ? 'Novo anunciante'
                    : mode === 'edit'
                    ? 'Editar anunciante'
                    : anunciante?.nome ?? ''}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-0.5">
                  {isNew ? (
                    'Preencha os dados do novo anunciante'
                  ) : mode === 'edit' ? (
                    anunciante?.nome
                  ) : (
                    <span className={cn(
                      'inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold',
                      anunciante?.status === 'ativo'
                        ? 'bg-[#22846D]/10 text-[#22846D]'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    )}>
                      {anunciante?.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-6">
            {mode === 'view' && anunciante ? (
              <>
                {/* Contato */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <RiUserLine className="w-3.5 h-3.5" />
                    Contato
                  </p>
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {anunciante.contato}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <RiMailLine className="w-4 h-4 shrink-0 text-gray-400" />
                      {anunciante.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <RiPhoneLine className="w-4 h-4 shrink-0 text-gray-400" />
                      {anunciante.telefone}
                    </div>
                  </div>
                </div>

                {/* Estatísticas */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <RiBarChartLine className="w-3.5 h-3.5" />
                    Estatísticas
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-center">
                      <p className="text-xs text-gray-400 mb-1">Campanhas ativas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {anunciante.campanhasAtivas}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-center">
                      <p className="text-xs text-gray-400 mb-1">Receita total</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {fmtCurrency(anunciante.receitaTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Edit / Create form */
              <Form {...form}>
                <form
                  id="form-editar-anunciante"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-5"
                >
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
                            placeholder="Ex: Parceiro A"
                            {...field}
                            data-testid="input-anunciante-nome"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sigla */}
                  <FormField
                    control={form.control}
                    name="sigla"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Sigla <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: PA"
                            maxLength={4}
                            {...field}
                            data-testid="input-anunciante-sigla"
                          />
                        </FormControl>
                        <p className="text-xs text-gray-400 mt-1">
                          Máximo 4 caracteres · Exibido no avatar
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contato */}
                  <FormField
                    control={form.control}
                    name="contato"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nome do contato <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: João Silva"
                            {...field}
                            data-testid="input-anunciante-contato"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* E-mail */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          E-mail <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contato@empresa.com.br"
                            {...field}
                            data-testid="input-anunciante-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Telefone */}
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Telefone <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="(00) 00000-0000"
                            {...field}
                            data-testid="input-anunciante-telefone"
                          />
                        </FormControl>
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
                            <SelectTrigger data-testid="select-anunciante-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex flex-row justify-end gap-3">
          {isNew ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                data-testid="button-cancelar-anunciante"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="form-editar-anunciante"
                data-testid="button-criar-anunciante"
              >
                <RiAddLine className="w-4 h-4 mr-2" />
                Criar anunciante
              </Button>
            </>
          ) : mode === 'view' ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                data-testid="button-fechar-anunciante"
              >
                Fechar
              </Button>
              <Button
                type="button"
                onClick={() => setMode('edit')}
                data-testid="button-editar-anunciante"
              >
                <RiEditLine className="w-4 h-4 mr-2" />
                Editar anunciante
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode('view')}
                data-testid="button-voltar-anunciante"
              >
                <RiArrowLeftLine className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                type="submit"
                form="form-editar-anunciante"
                data-testid="button-salvar-anunciante"
              >
                <RiSave3Line className="w-4 h-4 mr-2" />
                Salvar alterações
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
