'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiEdit2Line, RiBuilding2Line, RiCloseLine } from 'react-icons/ri';
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
import { Badge } from '@shared/components/ui/badge';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { editarEmpreiteiraSchema, useUpdateEmpreiteira } from '../hooks/use-empreiteiras';
import type { EditarEmpreiteiraFormData } from '../hooks/use-empreiteiras';
import type { AdminEmpreiteira } from '../types';

const ESPECIALIDADES_OPTIONS = [
  'Fundações',
  'Estrutura',
  'Acabamento',
  'Elétrica',
  'Hidráulica',
  'Alvenaria',
  'Pintura',
  'Impermeabilização',
];

const PROFISSAO_OPTIONS = [
  'Engenheiro Civil',
  'Arquiteto e Urbanista',
  'Engenheiro de Produção',
  'Técnico em Edificações',
  'Outro',
];

const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];

interface EditarEmpreiteiraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreiteira: AdminEmpreiteira;
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {icon}
      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
        {title}
      </h3>
    </div>
  );
}

export function EditarEmpreiteiraModal({ open, onOpenChange, empreiteira }: EditarEmpreiteiraModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useUpdateEmpreiteira(empreiteira.id);

  const form = useForm<EditarEmpreiteiraFormData>({
    resolver: zodResolver(editarEmpreiteiraSchema),
    defaultValues: {
      razaoSocial: empreiteira.razaoSocial,
      nomeFantasia: empreiteira.nomeFantasia ?? '',
      cnpj: empreiteira.cnpj,
      inscricaoEstadual: empreiteira.inscricaoEstadual ?? '',
      bairro: empreiteira.bairro ?? '',
      cep: empreiteira.cep ?? '',
      endereco: empreiteira.endereco ?? '',
      cidade: empreiteira.cidade ?? '',
      estado: empreiteira.estado ?? '',
      responsavel: empreiteira.responsavel,
      responsavelProfissao: empreiteira.responsavelProfissao ?? '',
      responsavelRegistro: empreiteira.responsavelRegistro ?? '',
      responsavelEmail: empreiteira.responsavelEmail ?? '',
      responsavelTelefone: empreiteira.responsavelTelefone ?? '',
      email: empreiteira.email,
      telefone: empreiteira.telefone,
      site: empreiteira.site ?? '',
      especialidades: empreiteira.especialidades,
    },
  });

  const handleClose = () => {
    form.reset();
    setSubmitError(null);
    onOpenChange(false);
  };

  const onSubmit = async (data: EditarEmpreiteiraFormData) => {
    setSubmitError(null);
    try {
      await mutateAsync(data);
      handleClose();
    } catch {
      setSubmitError('Erro ao salvar dados. Verifique as informações e tente novamente.');
    }
  };

  const toggleEspecialidade = (esp: string) => {
    const current = form.getValues('especialidades');
    const updated = current.includes(esp)
      ? current.filter((e) => e !== esp)
      : [...current, esp];
    form.setValue('especialidades', updated, { shouldValidate: true });
  };

  const selectedEspecialidades = form.watch('especialidades');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-4xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden"
        data-testid="modal-editar-empreiteira"
      >
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <RiEdit2Line className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Editar Dados da Empreiteira
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Atualize as informações de {empreiteira.razaoSocial}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Form {...form}>
              <form
                id="form-editar-empreiteira"
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-8"
                data-testid="form-editar-empreiteira"
              >
                {/* ── BLOCO 1: Dados da empresa ── */}
                <div>
                  <SectionHeader
                    icon={<RiBuilding2Line className="w-5 h-5 text-primary" />}
                    title="Dados da empresa"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-5">
                      <FormField
                        control={form.control}
                        name="razaoSocial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Razão Social <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex.: Construtora Alfa Engenharia Ltda"
                                {...field}
                                data-testid="input-editar-razao-social"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nomeFantasia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Fantasia</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex.: Construtora Alfa"
                                {...field}
                                data-testid="input-editar-nome-fantasia"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              CNPJ <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="00.000.000/0000-00"
                                {...field}
                                data-testid="input-editar-cnpj"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-col gap-5">
                      <FormField
                        control={form.control}
                        name="inscricaoEstadual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inscrição Estadual</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="000.000.000.000"
                                {...field}
                                data-testid="input-editar-inscricao-estadual"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="00000-000"
                                {...field}
                                data-testid="input-editar-cep"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                      <FormField
                        control={form.control}
                        name="bairro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Bairro"
                                {...field}
                                data-testid="input-editar-bairro"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-editar-estado">
                                    <SelectValue placeholder="UF" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {UF_OPTIONS.map((uf) => (
                                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── BLOCO 2: Responsável Técnico ── */}
                <div>
                  <SectionHeader
                    icon={
                      <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                    }
                    title="Responsável Técnico"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-5">
                      <FormField
                        control={form.control}
                        name="responsavel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Nome Completo <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex.: Carlos Alberto Mendes"
                                {...field}
                                data-testid="input-editar-responsavel"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="responsavelEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail do Responsável</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="responsavel@empresa.com.br"
                                {...field}
                                data-testid="input-editar-responsavel-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="responsavelTelefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone do Responsável</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="(00) 00000-0000"
                                {...field}
                                data-testid="input-editar-responsavel-telefone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-col gap-5">
                      <FormField
                        control={form.control}
                        name="responsavelProfissao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Profissão <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger data-testid="select-editar-profissao">
                                  <SelectValue placeholder="Selecione a profissão" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PROFISSAO_OPTIONS.map((p) => (
                                  <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="responsavelRegistro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Registro Profissional (CREA/CAU) <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex.: CREA-SP 5061234567"
                                {...field}
                                data-testid="input-editar-responsavel-registro"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* ── BLOCO 3: Contato ── */}
                <div>
                  <SectionHeader
                    icon={
                      <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a19.79 19.79 0 01-3.07-8.69A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
                      </svg>
                    }
                    title="Contato da Empresa"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-5">
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
                                data-testid="input-editar-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                    </div>

                    <div className="flex flex-col gap-5">
                      <FormField
                        control={form.control}
                        name="site"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://www.empresa.com.br"
                                {...field}
                                data-testid="input-editar-site"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Especialidades ── */}
                <FormField
                  control={form.control}
                  name="especialidades"
                  render={() => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                          Especialidades
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ESPECIALIDADES_OPTIONS.map((esp) => {
                          const isSelected = selectedEspecialidades.includes(esp);
                          return (
                            <Badge
                              key={esp}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer rounded-full text-xs px-3 py-1 transition-colors"
                              onClick={() => toggleEspecialidade(esp)}
                              data-testid={`badge-editar-especialidade-${esp}`}
                            >
                              {esp}
                              {isSelected && <RiCloseLine className="w-3 h-3 ml-1" />}
                            </Badge>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
            data-testid="button-cancelar-editar-empreiteira"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-editar-empreiteira"
            disabled={isPending}
            data-testid="button-submit-editar-empreiteira"
          >
            <RiEdit2Line className="w-4 h-4 mr-2" />
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
