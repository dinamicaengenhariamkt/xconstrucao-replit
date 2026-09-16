'use client';

import { useEffect, useMemo, useState } from 'react';
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
  FormDescription,
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
import { BrDateInput } from '@features/shared/components/BrDateInput';
import { FileUploader } from '@features/shared/components/FileUploader';
import { IconAttachFile } from '@shared/components/icons';
import { isDateBrValid } from '@shared/lib/masks';
import { useToast } from '@shared/hooks/use-toast';
import {
  LANCAMENTO_CATEGORIA_LABELS,
  LANCAMENTO_CATEGORIAS,
  type LancamentoCategoria,
  type LancamentoTipo,
} from '@features/financeiro/lancamentos';
import {
  useCriarLancamento,
  useEditarLancamento,
  type ObraLancamentoApi,
} from '@features/financeiro/hooks/use-obra-lancamentos';
import { isVirtualMembroId } from '../hooks/use-obra-operacao';
import type { MembroEquipe } from '../types';

/**
 * XG10 — lançamento de entrada e saída da obra.
 *
 * Entrada: descrição livre + valor ("30% referente à entrada").
 * Saída: categoria obrigatória + descrição + valor ("Pagamento para o Jefferson
 * Hidráulica"). A categoria é o que permite responder depois "quanto gastei de
 * mão de obra?" — pedido explícito na reunião de 2026-09-12.
 */

/**
 * Valor sentinela do select "Para quem". Um `SelectItem` não aceita `value=""`
 * (o Radix reserva a string vazia para "sem seleção"), e usar o id de um membro
 * confundiria com uma escolha real.
 */
const FORNECEDOR_OUTRO = '__outro__';

const schema = z.object({
  categoria: z.string().optional(),
  fornecedorId: z.string().optional(),
  fornecedorNome: z.string().max(80, 'Máximo 80 caracteres').optional(),
  descricao: z
    .string()
    .min(2, 'Descreva o lançamento')
    .max(500, 'Máximo 500 caracteres'),
  // Texto no form (aceita "1.250,50"); convertido para número no submit.
  valor: z.string().min(1, 'Informe o valor'),
  data: z
    .string()
    .min(1, 'Data obrigatória')
    .refine(isDateBrValid, 'Informe uma data válida (DD/MM/AAAA)'),
});

type FormData = z.infer<typeof schema>;

/** "1.250,50" → 1250.5. Aceita também o que o usuário digitar com ponto. */
function parseValorBr(raw: string): number {
  const limpo = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? n : NaN;
}

function toIsoDate(dataBr: string): string {
  const [dia, mes, ano] = dataBr.split('/');
  return `${ano}-${mes}-${dia}`;
}

function toBrDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

function hojeBr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

interface LancamentoFinanceiroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  tipo: LancamentoTipo;
  /** Quando presente, o modal edita em vez de criar. */
  lancamento?: ObraLancamentoApi | null;
  /** XG20 — equipe da obra, para escolher quem recebeu a saída. */
  equipe?: MembroEquipe[];
}

export function LancamentoFinanceiroModal({
  open,
  onOpenChange,
  obraId,
  tipo,
  lancamento = null,
  equipe = [],
}: LancamentoFinanceiroModalProps) {
  const { toast } = useToast();
  const criar = useCriarLancamento(obraId);
  const editar = useEditarLancamento(obraId);
  const editando = Boolean(lancamento);
  const isSaida = tipo === 'saida';

  // O anexo vive fora do `react-hook-form`: o upload já aconteceu quando o
  // usuário escolhe o arquivo, e o que guardamos é só a referência.
  const [comprovante, setComprovante] = useState<{ fileId: string; nome: string } | null>(null);

  /**
   * Quem pode receber uma saída: membro ativo com linha própria em
   * `obra_equipe`. Os ids virtuais (`contratante-*`, `empreiteira-*`) são
   * derivados e não existem no banco — se entrassem aqui, o FK falharia no
   * insert.
   */
  const membrosElegiveis = useMemo(() => {
    const ativos = equipe.filter((m) => !isVirtualMembroId(m.id) && m.ativo !== false);
    // Ao editar, o beneficiário gravado pode não estar mais entre os ativos
    // (desativado desde então). Sem reinseri-lo, o select abriria vazio e um
    // simples "salvar" apagaria o vínculo sem o usuário perceber.
    const gravado = lancamento?.fornecedorId;
    if (gravado && !ativos.some((m) => m.id === gravado)) {
      const inativo = equipe.find((m) => m.id === gravado);
      if (inativo) return [...ativos, inativo];
    }
    return ativos;
  }, [equipe, lancamento]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoria: '',
      fornecedorId: '',
      fornecedorNome: '',
      descricao: '',
      valor: '',
      data: hojeBr(),
    },
  });

  // Controla o input de nome livre: aparece com "Outro", some com um membro.
  const fornecedorSelecionado = form.watch('fornecedorId');
  const usandoNomeLivre = fornecedorSelecionado === FORNECEDOR_OUTRO;

  // Reidrata a cada abertura: o modal é reusado para criar e para editar.
  useEffect(() => {
    if (!open) return;
    setComprovante(
      lancamento?.comprovanteFileId
        ? { fileId: lancamento.comprovanteFileId, nome: 'Comprovante anexado' }
        : null,
    );
    form.reset(
      lancamento
        ? {
            categoria: lancamento.categoria ?? '',
            // Saída gravada com nome mas sem membro (texto livre, ou membro que
            // saiu da equipe e teve o vínculo zerado) reabre em "Outro", com o
            // nome preservado no input.
            fornecedorId: lancamento.fornecedorId
              ? lancamento.fornecedorId
              : lancamento.fornecedorNome
                ? FORNECEDOR_OUTRO
                : '',
            fornecedorNome: lancamento.fornecedorId ? '' : (lancamento.fornecedorNome ?? ''),
            descricao: lancamento.descricao,
            valor: String(lancamento.valor).replace('.', ','),
            data: toBrDate(lancamento.data),
          }
        : {
            categoria: '',
            fornecedorId: '',
            fornecedorNome: '',
            descricao: '',
            valor: '',
            data: hojeBr(),
          },
    );
  }, [open, lancamento, form]);

  const onSubmit = async (data: FormData) => {
    const valor = parseValorBr(data.valor);
    if (!Number.isFinite(valor) || valor <= 0) {
      form.setError('valor', { message: 'Informe um valor maior que zero' });
      return;
    }
    if (isSaida && !data.categoria) {
      form.setError('categoria', { message: 'Escolha a categoria da saída' });
      return;
    }

    // "Outro" sem nome digitado é escolha pela metade — grava beneficiário vazio
    // e o filtro não teria por onde pegar.
    const nomeLivre = data.fornecedorNome?.trim() ?? '';
    if (isSaida && data.fornecedorId === FORNECEDOR_OUTRO && !nomeLivre) {
      form.setError('fornecedorNome', { message: 'Digite o nome de quem recebeu' });
      return;
    }

    // A API aceita um OU outro: id quando veio da equipe, nome quando é avulso.
    const membroEscolhido =
      isSaida && data.fornecedorId && data.fornecedorId !== FORNECEDOR_OUTRO
        ? data.fornecedorId
        : null;
    const nomeEscolhido = isSaida && data.fornecedorId === FORNECEDOR_OUTRO ? nomeLivre : null;

    try {
      if (lancamento) {
        await editar.mutateAsync({
          lancamentoId: lancamento.id,
          categoria: isSaida ? (data.categoria as LancamentoCategoria) : undefined,
          descricao: data.descricao,
          valor,
          data: toIsoDate(data.data),
          comprovanteFileId: comprovante?.fileId ?? null,
          fornecedorId: membroEscolhido,
          fornecedorNome: nomeEscolhido,
        });
      } else {
        await criar.mutateAsync({
          tipo,
          categoria: isSaida ? (data.categoria as LancamentoCategoria) : null,
          descricao: data.descricao,
          valor,
          data: toIsoDate(data.data),
          comprovanteFileId: comprovante?.fileId ?? null,
          fornecedorId: membroEscolhido,
          fornecedorNome: nomeEscolhido,
        });
      }
      toast({
        title: editando ? 'Lançamento atualizado' : 'Lançamento registrado',
        description: `${isSaida ? 'Saída' : 'Entrada'} de R$ ${data.valor}.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const salvando = criar.isPending || editar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:w-full sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editando ? 'Editar' : isSaida ? 'Lançar saída' : 'Lançar entrada'}
          </DialogTitle>
          <DialogDescription>
            {isSaida
              ? 'Dinheiro que saiu da obra — mão de obra, material ou outras despesas.'
              : 'Dinheiro que entrou na obra — pagamento recebido do cliente.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isSaida && (
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-categoria-lancamento">
                          <SelectValue placeholder="Escolha a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LANCAMENTO_CATEGORIAS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {LANCAMENTO_CATEGORIA_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Separar aqui é o que permite filtrar depois quanto foi para mão de obra.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* XG20 — "é bom eu ter um card para colocar qual que é a pessoa
                que vai receber... depois no filtro eu posso colocar lá Jefferson
                elétrica e eu vejo quanto eu paguei só para ele". A lista é a
                equipe da obra, onde ele já cadastra essas pessoas. */}
            {isSaida && (
              <FormField
                control={form.control}
                name="fornecedorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Para quem <span className="font-normal text-gray-400">(opcional)</span>
                    </FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        // Trocar para um membro descarta o nome livre digitado
                        // antes; deixá-lo faria a API recusar os dois juntos.
                        if (v !== FORNECEDOR_OUTRO) form.setValue('fornecedorNome', '');
                      }}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-fornecedor-lancamento">
                          <SelectValue placeholder="Quem recebeu este pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {membrosElegiveis.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.papel ? `${m.nome} — ${m.papel}` : m.nome}
                          </SelectItem>
                        ))}
                        <SelectItem value={FORNECEDOR_OUTRO}>Outro (digitar nome)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {membrosElegiveis.length === 0
                        ? 'A obra ainda não tem equipe cadastrada — use "Outro" para digitar o nome.'
                        : 'Depois dá para filtrar os lançamentos por pessoa e ver quanto já foi pago a ela.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isSaida && usandoNomeLivre && (
              <FormField
                control={form.control}
                name="fornecedorNome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de quem recebeu</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={80}
                        placeholder="Ex.: Jefferson Elétrica"
                        data-testid="input-fornecedor-nome"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      maxLength={500}
                      placeholder={
                        isSaida
                          ? 'Ex.: Pagamento para o Jefferson (hidráulica)'
                          : 'Ex.: 30% referente à entrada'
                      }
                      data-testid="input-descricao-lancamento"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="decimal"
                        placeholder="0,00"
                        data-testid="input-valor-lancamento"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <BrDateInput
                        value={field.value}
                        onChange={field.onChange}
                        data-testid="input-data-lancamento"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* XG10/XG12 — "E poder anexar nota fiscal também, se for o caso"
                (06:02). A API já aceitava `comprovanteFileId`; faltava o
                upload aqui. Opcional: nem toda saída tem documento. */}
            <div className="space-y-2">
              <FormLabel>Nota fiscal ou comprovante <span className="font-normal text-gray-400">(opcional)</span></FormLabel>
              {comprovante ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <IconAttachFile className="shrink-0 text-gray-500" />
                    <span className="truncate">{comprovante.nome}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setComprovante(null)}
                    disabled={salvando}
                    data-testid="remover-comprovante-lancamento"
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <FileUploader
                  kind="comprovante_pagamento"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  label="Anexar comprovante"
                  helper="JPG, PNG ou PDF."
                  buttonVariant="outline"
                  testId="upload-comprovante-lancamento"
                  disabled={salvando}
                  obraId={obraId}
                  onUploaded={(file) =>
                    setComprovante({ fileId: file.id, nome: file.originalName })
                  }
                />
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando} data-testid="button-salvar-lancamento">
                {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Lançar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
