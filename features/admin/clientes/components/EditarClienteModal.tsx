'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { editarClienteSchema, useUpdateCliente } from '../hooks/use-clientes';
import type { EditarClienteFormData } from '../hooks/use-clientes';
import type { AdminCliente } from '../types';

const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];

interface EditarClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: AdminCliente;
}

export function EditarClienteModal({ open, onOpenChange, cliente }: EditarClienteModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useUpdateCliente(cliente.id);

  const form = useForm<EditarClienteFormData>({
    resolver: zodResolver(editarClienteSchema),
    defaultValues: {
      tipo: cliente.tipo,
      nome: cliente.nome,
      cpfCnpj: cliente.cpfCnpj,
      email: cliente.email,
      telefone: cliente.telefone,
      endereco: cliente.endereco ?? '',
      cidade: cliente.cidade ?? '',
      estado: cliente.estado ?? '',
    },
  });

  const tipoPessoa = form.watch('tipo');
  const isPF = tipoPessoa === 'pessoa_fisica';

  const handleClose = () => {
    form.reset();
    setSubmitError(null);
    onOpenChange(false);
  };

  const onSubmit = async (data: EditarClienteFormData) => {
    setSubmitError(null);
    try {
      await mutateAsync(data);
      handleClose();
    } catch {
      setSubmitError('Erro ao salvar dados. Verifique as informações e tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-4xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden"
        data-testid="modal-editar-cliente"
      >
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <RiEdit2Line className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Editar Dados do Cliente
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Atualize as informações de {cliente.nome}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Form {...form}>
              <form
                id="form-editar-cliente"
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                data-testid="form-editar-cliente"
              >
                {/* COLUNA 1 */}
                <div className="flex flex-col gap-5">
                  {/* Tipo de Pessoa */}
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Tipo de Pessoa <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-3">
                            <label
                              className={`flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer border-2 transition-all flex-1 ${
                                field.value === 'pessoa_fisica'
                                  ? 'border-primary bg-primary/5'
                                  : 'border-transparent bg-gray-100 dark:bg-gray-800 hover:border-primary/30'
                              }`}
                            >
                              <input
                                type="radio"
                                value="pessoa_fisica"
                                checked={field.value === 'pessoa_fisica'}
                                onChange={() => field.onChange('pessoa_fisica')}
                                className="w-4 h-4 text-primary focus:ring-primary/20"
                                data-testid="radio-editar-pessoa-fisica"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Pessoa Física
                              </span>
                            </label>
                            <label
                              className={`flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer border-2 transition-all flex-1 ${
                                field.value === 'pessoa_juridica'
                                  ? 'border-primary bg-primary/5'
                                  : 'border-transparent bg-gray-100 dark:bg-gray-800 hover:border-primary/30'
                              }`}
                            >
                              <input
                                type="radio"
                                value="pessoa_juridica"
                                checked={field.value === 'pessoa_juridica'}
                                onChange={() => field.onChange('pessoa_juridica')}
                                className="w-4 h-4 text-primary focus:ring-primary/20"
                                data-testid="radio-editar-pessoa-juridica"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Pessoa Jurídica
                              </span>
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Nome */}
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isPF ? 'Nome Completo' : 'Razão Social'}{' '}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={isPF ? 'Ex: João Silva Santos' : 'Ex: Construtora XYZ Ltda'}
                            {...field}
                            data-testid="input-editar-nome"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CPF / CNPJ */}
                  <FormField
                    control={form.control}
                    name="cpfCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isPF ? 'CPF' : 'CNPJ'}{' '}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={isPF ? '000.000.000-00' : '00.000.000/0000-00'}
                            {...field}
                            data-testid="input-editar-cpf-cnpj"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Endereço */}
                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Rua, número, complemento"
                            {...field}
                            data-testid="input-editar-endereco"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* COLUNA 2 */}
                <div className="flex flex-col gap-5">
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
                            placeholder="cliente@email.com"
                            {...field}
                            data-testid="input-editar-email"
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
                            data-testid="input-editar-telefone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cidade / Estado */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Cidade"
                              {...field}
                              data-testid="input-editar-cidade"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              data-testid="select-editar-estado"
                              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">UF</option>
                              {UF_OPTIONS.map((uf) => (
                                <option key={uf} value={uf}>
                                  {uf}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </form>
            </Form>

            {submitError && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400 font-medium">
                {submitError}
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex flex-row justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
            data-testid="button-cancelar-editar-cliente"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-editar-cliente"
            disabled={isPending}
            data-testid="button-submit-editar-cliente"
          >
            <RiEdit2Line className="w-4 h-4 mr-2" />
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
