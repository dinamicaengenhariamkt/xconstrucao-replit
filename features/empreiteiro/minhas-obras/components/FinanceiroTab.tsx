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
  IconAttachFile,
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
import type { ObraFinanceiro } from '../types';

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
  /**
   * XG12 — os valores de contrato (contratado, aditivos, total, saldo) e as
   * barras de recebido/executado, que viviam no "Resumo Financeiro" solto no
   * rodapé da obra. Opcional: outros consumidores da aba não passam nada e
   * seguem renderizando só os lançamentos.
   */
  financeiro?: ObraFinanceiro;
}

function formatarDataBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/**
 * XG12 — os valores de contrato, herdados do "Resumo Financeiro".
 *
 * A lista "Medições Realizadas" do bloco antigo **não** veio junto: ela
 * mapeava linhas de `financeiro` com o rótulo de medição (o `numero` era o
 * índice do array). Os lançamentos já aparecem logo abaixo, com o nome certo;
 * as atualizações de verdade têm aba própria.
 */
function ValoresDoContrato({ financeiro }: { financeiro: ObraFinanceiro }) {
  const percentualAditivo =
    financeiro.valorContratado > 0
      ? Math.round((financeiro.aditivos / financeiro.valorContratado) * 100)
      : 0;

  const kpis = [
    { label: 'Valor contratado', valor: financeiro.valorContratado, accent: 'border-blue-500' },
    {
      label: 'Aditivos',
      valor: financeiro.aditivos,
      accent: 'border-purple-500',
      nota: financeiro.aditivos > 0 ? `+${percentualAditivo}% do original` : null,
    },
    { label: 'Valor total', valor: financeiro.valorTotal, accent: 'border-primary' },
    {
      label: 'Saldo a receber',
      valor: financeiro.saldoReceber,
      accent: 'border-success',
      destaque: true,
    },
  ];

  return (
    <Card data-testid="valores-do-contrato">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Valores do contrato</CardTitle>
        <CardDescription>
          O combinado com o cliente, somado aos aditivos lançados abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className={cn(
                'rounded-xl border-l-4 bg-gray-50 p-4 dark:bg-gray-800/50',
                kpi.accent,
              )}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {kpi.label}
              </p>
              <p
                className={cn(
                  'mt-2 text-2xl font-extrabold',
                  kpi.destaque ? 'text-success' : 'text-gray-900 dark:text-white',
                )}
              >
                {formatCurrency(kpi.valor)}
              </p>
              {kpi.nota && (
                <p className="mt-1 text-xs font-medium text-purple-600">{kpi.nota}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            {
              label: 'Percentual recebido',
              valor: financeiro.percentualRecebido,
              cor: 'bg-success',
              texto: 'text-success',
            },
            {
              label: 'Percentual executado',
              valor: financeiro.percentualExecutado,
              cor: 'bg-primary',
              texto: 'text-primary',
            },
          ].map((barra) => (
            <div key={barra.label}>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {barra.label}
                </span>
                <span className={cn('text-lg font-extrabold', barra.texto)}>{barra.valor}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={cn('h-full rounded-full', barra.cor)}
                  style={{ width: `${Math.min(100, Math.max(0, barra.valor))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceiroTab({
  obraId,
  metrics,
  podeLancar = true,
  financeiro,
}: FinanceiroTabProps) {
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

  /**
   * O comprovante é privado no R2: a URL precisa ser assinada na hora. A rota
   * só assina para o dono do arquivo, então o link não vaza se alguém copiar
   * o `fileId`.
   */
  const abrirComprovante = async (fileId: string) => {
    try {
      const response = await fetch(`/api/uploads/sign?id=${encodeURIComponent(fileId)}`, {
        credentials: 'include',
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.url) throw new Error(body?.message ?? 'Falhou');
      window.open(body.url as string, '_blank', 'noopener,noreferrer');
    } catch {
      toast({
        title: 'Não foi possível abrir o comprovante',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    }
  };

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
      {financeiro && <ValoresDoContrato financeiro={financeiro} />}

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
                            {l.comprovanteFileId && (
                              <button
                                type="button"
                                onClick={() => abrirComprovante(l.comprovanteFileId!)}
                                className="inline-flex cursor-pointer items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                                data-testid={`comprovante-${l.id}`}
                              >
                                <IconAttachFile className="text-xs" />
                                Nota fiscal
                              </button>
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
