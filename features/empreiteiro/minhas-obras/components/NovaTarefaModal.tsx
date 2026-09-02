'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import type { MinhaObraDetalhe, MinhaObraTarefa } from '../types';
import { IconEdit, IconAddTask, IconSave } from '@shared/components/icons';
import { novaTarefaSchema, type NovaTarefaFormData, PRIORIDADE_OPTIONS, TAREFA_STATUS_OPTIONS } from '../schemas/nova-tarefa.schema';

// ─── Props ────────────────────────────────────────────────────────────────────

interface NovaTarefaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obra: MinhaObraDetalhe;
  tarefaParaEditar?: MinhaObraTarefa | null;
  onSalvar: (tarefa: MinhaObraTarefa) => Promise<void>;
}

function gerarId() {
  return `tk${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NovaTarefaModal({
  open,
  onOpenChange,
  obra,
  tarefaParaEditar,
  onSalvar,
}: NovaTarefaModalProps) {
  const isEdicao = Boolean(tarefaParaEditar);
  const titulo = isEdicao ? 'Editar Tarefa' : 'Nova Tarefa';

  // A tarefa deve apontar para uma etapa real. Quando a obra ainda não tem
  // etapas, "Geral" permite registrar a tarefa sem fingir que "+ Nova etapa"
  // é uma ação implementada neste modal.
  const etapasDisponiveis = obra.etapas.length > 0
    ? obra.etapas.map((e) => ({ id: e.id, nome: e.nome }))
    : [{ id: null, nome: 'Geral' }];
  const etapasLegadas = obra.tarefas
    .filter((t) => t.etapa && !etapasDisponiveis.some((e) => e.nome === t.etapa))
    .map((t) => ({ id: t.etapaId ?? null, nome: t.etapa }));
  const etapasDoSelect = [...etapasDisponiveis, ...etapasLegadas];

  // Membros da equipe disponíveis
  const responsaveisDisponiveis = obra.equipe.map((m) => m.nome);

  const form = useForm<NovaTarefaFormData>({
    resolver: zodResolver(novaTarefaSchema),
    defaultValues: {
      titulo: '',
      etapa: etapasDoSelect[0]?.nome ?? '',
      responsavel: '',
      prazo: '',
      prioridade: 'media',
      status: 'pendente',
      progresso: undefined,
      bloqueioMotivo: '',
      bloqueioInfo: '',
      descricao: '',
    },
  });

  // Preenche o form quando abrindo em modo edição
  useEffect(() => {
    if (open && tarefaParaEditar) {
      form.reset({
        titulo: tarefaParaEditar.titulo,
        etapa: tarefaParaEditar.etapa,
        responsavel: tarefaParaEditar.responsavel,
        prazo: tarefaParaEditar.prazo,
        prioridade: tarefaParaEditar.prioridade,
        status: tarefaParaEditar.status,
        progresso: tarefaParaEditar.progresso,
        bloqueioMotivo: tarefaParaEditar.bloqueioMotivo ?? '',
        bloqueioInfo: tarefaParaEditar.bloqueioInfo ?? '',
        descricao: tarefaParaEditar.descricao ?? '',
      });
    } else if (open && !tarefaParaEditar) {
      form.reset({
        titulo: '',
         etapa: etapasDoSelect[0]?.nome ?? '',
        responsavel: '',
        prazo: '',
        prioridade: 'media',
        status: 'pendente',
        progresso: undefined,
        bloqueioMotivo: '',
        bloqueioInfo: '',
        descricao: '',
      });
    }
  }, [open, tarefaParaEditar]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusAtual = form.watch('status');
  const isEmAndamento = statusAtual === 'em_andamento';
  const isBloqueado = statusAtual === 'bloqueado';

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: NovaTarefaFormData) => {
    const tarefa: MinhaObraTarefa = {
      id: tarefaParaEditar?.id ?? gerarId(),
      titulo: data.titulo,
      etapa: data.etapa,
      etapaId: etapasDoSelect.find((e) => e.nome === data.etapa)?.id ?? null,
      responsavel: data.responsavel,
      prazo: data.prazo,
      prioridade: data.prioridade,
      status: data.status,
      progresso: isEmAndamento ? (data.progresso ?? 0) : undefined,
      bloqueioMotivo: isBloqueado ? data.bloqueioMotivo : undefined,
      bloqueioInfo: isBloqueado ? data.bloqueioInfo : undefined,
      anexos: tarefaParaEditar?.anexos,
      descricao: data.descricao || undefined,
    };
    try {
      await onSalvar(tarefa);
      handleClose();
    } catch {
      // O mutation hook já mostra a mensagem retornada pelo servidor. O modal
      // permanece aberto para o usuário corrigir os campos sem perder o que digitou.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              {isEdicao ? <IconEdit className="text-primary text-xl" /> : <IconAddTask className="text-primary text-xl" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {titulo}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                {isEdicao ? 'Altere os dados da tarefa abaixo' : 'Preencha os dados para criar a tarefa'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Form {...form}>
              <form
                id="form-nova-tarefa"
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
              >
                {/* Título */}
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Título <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Concretagem laje 3º pavimento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Etapa + Responsável */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="etapa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Etapa <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                             {etapasDoSelect.map((e) => (
                               <option key={`${e.id ?? 'sem-id'}-${e.nome}`} value={e.nome}>
                                 {e.nome}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                         <p className="text-[11px] text-gray-400 mt-1">
                           {obra.etapas.length > 0
                             ? 'A tarefa ficará vinculada à etapa selecionada.'
                             : 'Nenhuma etapa foi criada ainda. A tarefa será registrada em Geral; crie etapas pelo Cronograma quando quiser organizar a obra.'}
                         </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Responsável <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="">Selecione...</option>
                            {responsaveisDisponiveis.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                            <option value="A designar">A designar</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Prazo + Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="prazo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Prazo <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status inicial</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {TAREFA_STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Prioridade — radio cards */}
                <FormField
                  control={form.control}
                  name="prioridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Prioridade <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-3">
                          {PRIORIDADE_OPTIONS.map((opt) => (
                            <label
                              key={opt.value}
                              className={cn(
                                'flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer border-2 transition-all flex-1 justify-center text-sm font-semibold',
                                field.value === opt.value
                                  ? opt.color + ' border-current'
                                  : 'border-transparent bg-gray-100 dark:bg-gray-800 text-gray-500 hover:border-gray-300'
                              )}
                            >
                              <input
                                type="radio"
                                value={opt.value}
                                checked={field.value === opt.value}
                                onChange={() => field.onChange(opt.value)}
                                className="sr-only"
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Condicional: progresso (apenas Em Andamento) */}
                {isEmAndamento && (
                  <FormField
                    control={form.control}
                    name="progresso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Progresso atual (%)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={field.value ?? 0}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="flex-1 h-2 rounded-full accent-primary"
                            />
                            <span className="text-sm font-bold text-primary w-10 text-right">
                              {field.value ?? 0}%
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Condicional: motivo de bloqueio */}
                {isBloqueado && (
                  <div className="flex flex-col gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200">
                    <FormField
                      control={form.control}
                      name="bloqueioMotivo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Motivo do bloqueio <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Aguardando material" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bloqueioInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Informação adicional</FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              placeholder="Ex: Fornecedor confirmou entrega para 28/06"
                              rows={2}
                              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Descrição (opcional) */}
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição <span className="text-xs text-gray-400 font-normal">(opcional)</span></FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          placeholder="Detalhes, instruções ou observações sobre a tarefa..."
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
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex flex-row justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-nova-tarefa" disabled={form.formState.isSubmitting}>
            {isEdicao ? <IconSave className="text-sm mr-1" /> : <IconAddTask className="text-sm mr-1" />}
            {form.formState.isSubmitting ? 'Salvando...' : isEdicao ? 'Salvar alterações' : 'Criar tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
