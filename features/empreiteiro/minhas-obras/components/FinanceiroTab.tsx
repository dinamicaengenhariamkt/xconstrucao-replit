'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
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
import { ProfitCard } from '@features/shared/profit';
import { formatCurrency } from '@shared/lib/formatters';
import { useToast } from '@shared/hooks/use-toast';
import { cn } from '@shared/lib/utils';
import {
  IconAdd,
  IconDelete,
  IconEdit,
  IconPayments,
} from '@shared/components/icons';
import {
  LANCAMENTO_CATEGORIA_LABELS,
  type LancamentoCategoria,
  type LancamentoTipo,
} from '@features/financeiro/lancamentos';
import {
  useExcluirLancamento,
  useObraLancamentos,
  type ObraLancamentoApi,
} from '@features/financeiro/hooks/use-obra-lancamentos';
import { LancamentoFinanceiroModal } from './LancamentoFinanceiroModal';
import { AditivosCard } from './AditivosCard';
import type { ProfitMetrics } from '@features/shared/profit';

/**
 * XG10 — aba Financeiro da obra (substitui a antiga "Lucro").
 *
 * Reúne o que o cliente pediu em 2026-09-12: lançar entrada e saída, separar
 * mão de obra de material, editar sem sair da aba e filtrar para responder
 * "quanto gastei de mão de obra?". O card "Lucro estimado" sai — "não tem como
 * estimar lucro, tem que esperar acabar".
 */

type FiltroTipo = 'todos' | LancamentoTipo;
type FiltroCategoria = 'todas' | LancamentoCategoria;

interface FinanceiroTabProps {
  obraId: string;
  metrics: ProfitMetrics;
  /** Obra de marketplace é read-only aqui: o dinheiro é do contratante. */
  podeLancar?: boolean;
}

function formatarDataBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function FinanceiroTab({ obraId, metrics, podeLancar = true }: FinanceiroTabProps) {
  const { toast } = useToast();
  const { data: lancamentos = [], isLoading } = useObraLancamentos(obraId);
  const excluir = useExcluirLancamento(obraId);

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>('todas');
  const [modalTipo, setModalTipo] = useState<LancamentoTipo | null>(null);
  const [emEdicao, setEmEdicao] = useState<ObraLancamentoApi | null>(null);
  const [paraExcluir, setParaExcluir] = useState<ObraLancamentoApi | null>(null);

  const filtrados = useMemo(() => {
    return lancamentos.filter((l) => {
      if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false;
      if (filtroCategoria !== 'todas' && l.categoria !== filtroCategoria) return false;
      return true;
    });
  }, [lancamentos, filtroTipo, filtroCategoria]);

  // Total do que está em tela: com filtro de mão de obra aplicado, responde
  // direto "quanto já gastei com isso".
  const totalFiltrado = useMemo(
    () =>
      filtrados.reduce(
        (acc, l) => acc + (l.tipo === 'entrada' ? Number(l.valor) : -Number(l.valor)),
        0,
      ),
    [filtrados],
  );

  const abrirNovo = (tipo: LancamentoTipo) => {
    setEmEdicao(null);
    setModalTipo(tipo);
  };

  const abrirEdicao = (l: ObraLancamentoApi) => {
    setEmEdicao(l);
    setModalTipo(l.tipo);
  };

  const confirmarExclusao = async () => {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast({ title: 'Lançamento excluído' });
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
    <div className="space-y-4">
      <ProfitCard
        metrics={metrics}
        title="Resultado da obra"
        description="Receita e custo somam os lançamentos registrados abaixo."
        mostrarLucroEstimado={false}
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <IconPayments className="w-5 h-5 text-primary" />
                  Lançamentos
                </CardTitle>
                <CardDescription>Tudo que entrou e saiu desta obra.</CardDescription>
              </div>
              {podeLancar && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => abrirNovo('entrada')} data-testid="button-nova-entrada">
                    <IconAdd className="w-4 h-4 mr-1" />
                    Entrada
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => abrirNovo('saida')}
                    data-testid="button-nova-saida"
                  >
                    <IconAdd className="w-4 h-4 mr-1" />
                    Saída
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as FiltroTipo)}>
                <SelectTrigger className="w-[150px] h-9" data-testid="filtro-tipo-lancamento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Tudo</SelectItem>
                  <SelectItem value="entrada">Só entradas</SelectItem>
                  <SelectItem value="saida">Só saídas</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtroCategoria}
                onValueChange={(v) => setFiltroCategoria(v as FiltroCategoria)}
              >
                <SelectTrigger className="w-[180px] h-9" data-testid="filtro-categoria-lancamento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  <SelectItem value="mao_de_obra">Mão de obra</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="outras_despesas">Outras despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <p className="text-sm text-gray-500 py-6 text-center">Carregando lançamentos…</p>
            ) : filtrados.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">
                  {lancamentos.length === 0
                    ? 'Nenhum lançamento ainda.'
                    : 'Nenhum lançamento com esses filtros.'}
                </p>
                {lancamentos.length === 0 && podeLancar && (
                  <p className="text-xs text-gray-400 mt-1">
                    Registre o que entrou e o que saiu para ver receita, custo e margem.
                  </p>
                )}
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtrados.map((l) => {
                    const entrada = l.tipo === 'entrada';
                    const automatico = Boolean(l.medicaoId || l.origemId);
                    return (
                      <li
                        key={l.id}
                        className="flex items-center justify-between gap-3 py-3"
                        data-testid={`lancamento-${l.id}`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm truncate">{l.descricao}</span>
                            {l.categoria && (
                              <Badge variant="secondary" className="text-[10px]">
                                {LANCAMENTO_CATEGORIA_LABELS[l.categoria]}
                              </Badge>
                            )}
                            {automatico && (
                              <Badge variant="outline" className="text-[10px]">
                                Automático
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{formatarDataBr(l.data)}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              'font-semibold text-sm tabular-nums',
                              entrada ? 'text-emerald-600' : 'text-amber-600',
                            )}
                          >
                            {entrada ? '+' : '−'} {formatCurrency(Number(l.valor))}
                          </span>
                          {podeLancar && !automatico && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => abrirEdicao(l)}
                                aria-label={`Editar ${l.descricao}`}
                              >
                                <IconEdit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => setParaExcluir(l)}
                                aria-label={`Excluir ${l.descricao}`}
                              >
                                <IconDelete className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-500">
                    {filtrados.length} {filtrados.length === 1 ? 'lançamento' : 'lançamentos'}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      totalFiltrado >= 0 ? 'text-emerald-600' : 'text-amber-600',
                    )}
                    data-testid="total-filtrado"
                  >
                    {formatCurrency(totalFiltrado)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <AditivosCard obraId={obraId} podeLancar={podeLancar} />

      {modalTipo && (
        <LancamentoFinanceiroModal
          open
          onOpenChange={(aberto) => {
            if (!aberto) {
              setModalTipo(null);
              setEmEdicao(null);
            }
          }}
          obraId={obraId}
          tipo={modalTipo}
          lancamento={emEdicao}
        />
      )}

      <AlertDialog open={Boolean(paraExcluir)} onOpenChange={(o) => !o && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {paraExcluir?.descricao} — {paraExcluir && formatCurrency(Number(paraExcluir.valor))}.
              A receita e o custo da obra serão recalculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
