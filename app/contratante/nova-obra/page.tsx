'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiFileUploadLine, RiSendPlaneLine } from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { useToast } from '@shared/hooks/use-toast';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { cn } from '@shared/lib/utils';
import { novaObraSchema, TIPOS_OBRA, COMPLEXIDADES } from '@features/contratante/nova-obra/types';
import type { NovaObraFormData } from '@features/contratante/nova-obra/types';

const ESTADOS_BR = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

export default function NovaObraPage() {
  const { toast } = useToast();

  const form = useForm<NovaObraFormData>({
    resolver: zodResolver(novaObraSchema),
    defaultValues: {
      nome: '',
      tipo: '',
      complexidade: undefined,
      descricao: '',
      cep: '',
      endereco: '',
      cidade: '',
      estado: '',
      dataInicio: '',
      dataPrevisaoFim: '',
      orcamento: '',
      observacoes: '',
    },
  });

  function onPublicar(values: NovaObraFormData) {
    toast({
      title: 'Obra publicada com sucesso!',
      description: 'Sua obra foi publicada e está disponível para empreiteiros.',
    });
  }

  function handleCancelar() {
    form.reset();
  }

  const inputClass = 'rounded-xl border-gray-200 dark:border-gray-700 focus:ring-primary/20';
  const cardClass = 'bg-white dark:bg-gray-900 rounded-2xl p-6 overflow-hidden luminous-section';

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="nova-obra-page">
      <PageHeader
        title="Nova Obra"
        subtitle="Cadastre uma nova obra para encontrar empreiteiros qualificados."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onPublicar)} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={cardClass}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Informações Gerais</h2>
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nome da Obra</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Residencial Vila Nova" className={inputClass} data-testid="input-nome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo de Obra</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputClass} data-testid="select-tipo">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPOS_OBRA.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="complexidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Complexidade</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-3">
                          {COMPLEXIDADES.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => field.onChange(c.value)}
                              data-testid={`btn-complexidade-${c.value}`}
                              className={cn(
                                'rounded-xl border-2 p-3 text-left transition-all cursor-pointer',
                                field.value === c.value
                                  ? c.selectedClass
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              )}
                            >
                              <p className="text-sm font-bold">{c.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{c.descricao}</p>
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descreva os detalhes da obra..." rows={4} className={cn(inputClass, 'resize-none')} data-testid="input-descricao" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className={cardClass}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Localização</h2>
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">CEP</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="00000-000" className={inputClass} data-testid="input-cep" />
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
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Rua, número, complemento" className={inputClass} data-testid="input-endereco" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome da cidade" className={inputClass} data-testid="input-cidade" />
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
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputClass} data-testid="select-estado">
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ESTADOS_BR.map((uf) => (
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

            <div className={cardClass}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Prazos e Orçamento</h2>
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="dataInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Data de Início</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className={inputClass} data-testid="input-data-inicio" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataPrevisaoFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Data de Previsão de Término</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className={inputClass} data-testid="input-data-previsao-fim" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orcamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Orçamento</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">R$</span>
                          <Input {...field} placeholder="0,00" className={cn(inputClass, 'pl-10')} data-testid="input-orcamento" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className={cardClass}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Documentos</h2>
              <div
                data-testid="dropzone-documentos"
                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-10 cursor-pointer transition-colors hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <RiFileUploadLine className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Arraste arquivos ou clique para selecionar
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  PDF, JPG, PNG ou DWG (máx. 10MB por arquivo)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="outline" data-testid="button-cancelar" onClick={handleCancelar}>
              Cancelar
            </Button>
            <Button type="submit" data-testid="button-publicar">
              <RiSendPlaneLine className="mr-2 h-4 w-4" />
              Publicar Obra
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
