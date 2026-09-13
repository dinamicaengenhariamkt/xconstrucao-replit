'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { BrDateInput } from '@features/shared/components/BrDateInput';
import { isDateBrValid } from '@shared/lib/masks';
import { formatCurrency } from '@shared/lib/formatters';
import { useToast } from '@shared/hooks/use-toast';
import { cn } from '@shared/lib/utils';
import { IconAdd, IconDelete, IconDescription } from '@shared/components/icons';
import {
  useCriarAditivo,
  useExcluirAditivo,
  useObraAditivos,
  type ObraAditivoApi,
} from '@features/financeiro/hooks/use-obra-aditivos';

/**
 * XG10 — aditivos de contrato.
 *
 * O card "Aditivos" já existia no resumo financeiro lendo um zero fixo; o
 * cliente procurou onde lançar e não achou. Este é o lugar: soma ao valor
 * contratado e move o saldo a receber.
 */

const schema = z.object({
  descricao: z.string().min(2, 'Descreva o aditivo').max(500, 'Máximo 500 caracteres'),
  valor: z.string().min(1, 'Informe o valor'),
  data: z
    .string()
    .min(1, 'Data obrigatória')
    .refine(isDateBrValid, 'Informe uma data válida (DD/MM/AAAA)'),
});

type FormData = z.infer<typeof schema>;

/** "1.250,50" → 1250.5. Aceita negativo para aditivo de supressão. */
function parseValorBr(raw: string): number {
  const limpo = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? n : NaN;
}

function toIsoDate(dataBr: string): string {
  const [dia, mes, ano] = dataBr.split('/');
  return `${ano}-${mes}-${dia}`;
}

function formatarDataBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function hojeBr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

interface AditivosCardProps {
  obraId: string;
  podeLancar?: boolean;
}

export function AditivosCard({ obraId, podeLancar = true }: AditivosCardProps) {
  const { toast } = useToast();
  const { data: aditivos = [], isLoading } = useObraAditivos(obraId);
  const criar = useCriarAditivo(obraId);
  const excluir = useExcluirAditivo(obraId);

  const [modalAberto, setModalAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<ObraAditivoApi | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { descricao: '', valor: '', data: hojeBr() },
  });

  useEffect(() => {
    if (modalAberto) form.reset({ descricao: '', valor: '', data: hojeBr() });
  }, [modalAberto, form]);

  const total = aditivos.reduce((acc, a) => acc + Number(a.valor), 0);

  const onSubmit = async (data: FormData) => {
    const valor = parseValorBr(data.valor);
    if (!Number.isFinite(valor) || valor === 0) {
      form.setError('valor', { message: 'Informe um valor diferente de zero' });
      return;
    }
    try {
      await criar.mutateAsync({
        descricao: data.descricao,
        valor,
        data: toIsoDate(data.data),
      });
      toast({ title: 'Aditivo lançado', description: `${formatCurrency(valor)} somado ao contrato.` });
      setModalAberto(false);
    } catch (error) {
      toast({
        title: 'Não foi possível lançar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const confirmarExclusao = async () => {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast({ title: 'Aditivo excluído' });
    } catch (error) {
      toast({
        title: 'Não foi possível excluir',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setParaExcluir(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <IconDescription className="w-5 h-5 text-primary" />
                Aditivos de contrato
              </CardTitle>
              <CardDescription>
                Acréscimos ou supressões ao escopo contratado. Somam ao valor total da obra.
              </CardDescription>
            </div>
            {podeLancar && (
              <Button size="sm" variant="outline" onClick={() => setModalAberto(true)} data-testid="button-novo-aditivo">
                <IconAdd className="w-4 h-4 mr-1" />
                Aditivo
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500 py-4 text-center">Carregando…</p>
          ) : aditivos.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Nenhum aditivo lançado.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {aditivos.map((a) => {
                  const valor = Number(a.valor);
                  const supressao = valor < 0;
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 py-3"
                      data-testid={`aditivo-${a.id}`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{a.descricao}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatarDataBr(a.data)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            'font-semibold text-sm tabular-nums',
                            supressao ? 'text-amber-600' : 'text-purple-600',
                          )}
                        >
                          {supressao ? '−' : '+'} {formatCurrency(Math.abs(valor))}
                        </span>
                        {podeLancar && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => setParaExcluir(a)}
                            aria-label={`Excluir ${a.descricao}`}
                          >
                            <IconDelete className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-500">
                  {aditivos.length} {aditivos.length === 1 ? 'aditivo' : 'aditivos'}
                </span>
                <span className="text-sm font-bold tabular-nums text-purple-600" data-testid="total-aditivos">
                  {formatCurrency(total)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Lançar aditivo</DialogTitle>
            <DialogDescription>
              Alteração de escopo acordada com o cliente. Entra no valor total da obra.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        placeholder="Ex.: Acréscimo de churrasqueira na área gourmet"
                        data-testid="input-descricao-aditivo"
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
                        <Input {...field} inputMode="decimal" placeholder="0,00" data-testid="input-valor-aditivo" />
                      </FormControl>
                      <FormDescription>Use valor negativo para supressão de escopo.</FormDescription>
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
                        <BrDateInput value={field.value} onChange={field.onChange} data-testid="input-data-aditivo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)} disabled={criar.isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={criar.isPending} data-testid="button-salvar-aditivo">
                  {criar.isPending ? 'Salvando…' : 'Lançar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(paraExcluir)} onOpenChange={(o) => !o && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aditivo?</AlertDialogTitle>
            <AlertDialogDescription>
              {paraExcluir?.descricao} — {paraExcluir && formatCurrency(Number(paraExcluir.valor))}.
              O valor total da obra será recalculado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
