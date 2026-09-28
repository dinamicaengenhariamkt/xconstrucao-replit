'use client';

import { useMemo, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
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
  LANCAMENTO_CATEGORIAS,
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
import type { MembroEquipe, ObraFinanceiro } from '../types';

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

/** Chave do filtro "Para quem": o id do membro, ou o nome quando foi avulso. */
const FILTRO_PESSOA_TODAS = 'todas';

interface FinanceiroTabProps {
  obraId: string;
  metrics: ProfitMetrics;
  /** Obra de marketplace é read-only aqui: o dinheiro é do contratante. */
  podeLancar?: boolean;
  /**
   * XG29 — obra própria do xgestão. Distinto de `podeLancar`, que hoje carrega
   * o mesmo valor mas significa outra coisa (permissão de escrita): misturar os
   * dois faria "quem pode lançar" decidir "o que se exibe", e um dia que a
   * permissão mudasse a barra reapareceria sem ninguém relacionar as coisas.
   */
  isObraPropria?: boolean;
  /** XG20 — equipe da obra, para o modal oferecer quem recebeu a saída. */
  equipe?: MembroEquipe[];
  /**
   * XG12 — os valores de contrato (contratado, aditivos, total, saldo) e as
   * barras de recebido/executado, que viviam no "Resumo Financeiro" solto no
   * rodapé da obra. Opcional: outros consumidores da aba não passam nada e
   * seguem renderizando só os lançamentos.
   */
  financeiro?: ObraFinanceiro;
  /**
   * XG18 — acabamento luminous dos cards de resultado, o mesmo dos KPIs no topo
   * do console. O `StatsCard` e o `ProfitCard` já implementavam o padrão; a
   * flag simplesmente não chegava até aqui, então os cards caíam no ramo
   * "plain" — sem borda em gradiente e com a sombra de hover mais pesada. Era
   * isso que destoava dos cards de cima.
   */
  luminous?: boolean;
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
function ValoresDoContrato({
  financeiro,
  luminous = false,
  recalculando = false,
  isObraPropria = false,
}: {
  financeiro: ObraFinanceiro;
  luminous?: boolean;
  /** Detalhe da obra em refetch: os números abaixo ainda são os de antes. */
  recalculando?: boolean;
  /** XG29 — na obra própria a barra "Percentual executado" não é exibida. */
  isObraPropria?: boolean;
}) {
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Valores do contrato</CardTitle>
            <CardDescription>
              O combinado com o cliente, somado aos aditivos lançados abaixo.
            </CardDescription>
          </div>
          {/*
            O recálculo do saldo acontece no servidor e leva um instante. Sem
            este aviso o número antigo fica parado na tela logo depois de
            lançar, e a leitura natural é que o lançamento não entrou.
          */}
          {recalculando && (
            <span
              className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-500"
              data-testid="valores-contrato-recalculando"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Atualizando…
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            // XG18 — o mesmo acabamento dos demais cards do console, mas a
            // `border-l-4` colorida fica: ali a cor distingue contratado ×
            // aditivo × saldo, é informação e não decoração.
            <div
              key={kpi.label}
              className={cn(
                'rounded-xl border-l-4 bg-gray-50 p-4 transition-all dark:bg-gray-800/50',
                luminous && 'luminous-card hover:bg-gray-100/70 dark:hover:bg-gray-800/80',
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

        {/* XG29 — "Percentual executado" é `financeiro.percentualExecutado`, que
            no servidor é **literalmente** `progresso` (build-detalhe-server.ts).
            Ou seja: o mesmo número que o cliente mandou remover das telas do
            xgestão, sobrevivendo com outro rótulo numa aba que ele alcança. Sai
            na obra própria.

            "Percentual recebido" fica nos dois produtos — aquele é financeiro de
            verdade: quanto do contrato já foi pago. */}
        <div className={cn('grid grid-cols-1 gap-6', !isObraPropria && 'md:grid-cols-2')}>
          {[
            {
              label: 'Percentual recebido',
              valor: financeiro.percentualRecebido,
              cor: 'bg-success',
              texto: 'text-success',
            },
            ...(isObraPropria
              ? []
              : [
                  {
                    label: 'Percentual executado',
                    valor: financeiro.percentualExecutado,
                    cor: 'bg-primary',
                    texto: 'text-primary',
                  },
                ]),
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

/**
 * XG22 — a prévia de gasto da obra.
 *
 * Pedido do cliente: "esse valor de contrato o sistema tem que puxar e colocar
 * como prévia de gasto da obra (...) ele já vai conseguir mensurar meu custo de
 * obra, não vai ser 100%, mas vai misturar uma boa parte".
 *
 * Fica ao lado do custo realizado de propósito: sozinho, o previsto é só um
 * número; contra o que já saiu, vira "quanto ainda falta desembolsar".
 *
 * O rótulo diz de onde o número vem ("soma dos contratos"), pela mesma razão
 * que o lucro estimado foi retirado desta tela — o console não inventa projeção,
 * só soma o que foi combinado. Por isso o card some quando não há contrato: zero
 * aqui não significa "obra barata", significa "ninguém preencheu ainda".
 */
function CustoPrevistoEquipe({
  financeiro,
  luminous = false,
}: {
  financeiro: ObraFinanceiro;
  luminous?: boolean;
}) {
  const previsto = financeiro.custoPrevistoEquipe;
  const realizado = financeiro.custoTotal;
  const aDesembolsar = Math.max(0, previsto - realizado);
  const pctPago = previsto > 0 ? Math.min(100, Math.round((realizado / previsto) * 100)) : 0;

  return (
    <Card data-testid="custo-previsto-equipe">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Prévia de gasto com a equipe</CardTitle>
        <CardDescription>
          Soma dos contratos dos prestadores cadastrados na obra — não inclui material nem
          despesas avulsas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Custo previsto', valor: previsto, accent: 'border-amber-500', destaque: false },
            { label: 'Já pago à equipe', valor: realizado, accent: 'border-gray-400', destaque: false },
            { label: 'Ainda a desembolsar', valor: aDesembolsar, accent: 'border-primary', destaque: true },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={cn(
                'rounded-xl border-l-4 bg-gray-50 p-4 transition-all dark:bg-gray-800/50',
                luminous && 'luminous-card hover:bg-gray-100/70 dark:hover:bg-gray-800/80',
                kpi.accent,
              )}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {kpi.label}
              </p>
              <p
                className={cn(
                  'mt-2 text-2xl font-extrabold',
                  kpi.destaque ? 'text-primary' : 'text-gray-900 dark:text-white',
                )}
              >
                {formatCurrency(kpi.valor)}
              </p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-end justify-between">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pago do previsto
            </p>
            <p className="text-lg font-bold text-primary">{pctPago}%</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pctPago}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceiroTab({
  obraId,
  metrics,
  podeLancar = true,
  isObraPropria = false,
  financeiro,
  equipe = [],
  luminous = false,
}: FinanceiroTabProps) {
  const { toast } = useToast();
  const { data: lancamentos = [], isLoading } = useObraLancamentos(obraId);
  const excluir = useExcluirLancamento(obraId);

  /*
   * Receita, custo, margem e saldo a receber são derivados no servidor, então
   * depois de lançar eles só mudam quando o detalhe da obra volta. Observamos o
   * refetch pela própria queryKey em vez de descer uma prop desde a página: a
   * aba não é dona dessa query e não deveria passar a exigir que quem a renderiza
   * saiba disso.
   */
  const recalculando = useIsFetching({ queryKey: ['empreiteiro', 'minhas-obras', obraId] }) > 0;

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>('todas');
  const [filtroPessoa, setFiltroPessoa] = useState<string>(FILTRO_PESSOA_TODAS);
  const [modalTipo, setModalTipo] = useState<LancamentoTipo | null>(null);
  const [emEdicao, setEmEdicao] = useState<ObraLancamentoApi | null>(null);
  const [paraExcluir, setParaExcluir] = useState<ObraLancamentoApi | null>(null);

  /**
   * XG20 — as pessoas que de fato aparecem nos lançamentos, não a equipe
   * inteira: um filtro que oferece quem nunca recebeu nada só devolve lista
   * vazia. A chave é o `fornecedorId` quando existe (vínculo exato) e o nome
   * quando o pagamento foi avulso.
   */
  const pessoasComLancamento = useMemo(() => {
    const porChave = new Map<string, string>();
    for (const l of lancamentos) {
      if (!l.fornecedorNome) continue;
      porChave.set(l.fornecedorId ?? `nome:${l.fornecedorNome}`, l.fornecedorNome);
    }
    return [...porChave.entries()]
      .map(([chave, nome]) => ({ chave, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [lancamentos]);

  const filtrados = useMemo(() => {
    return lancamentos.filter((l) => {
      if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false;
      if (filtroCategoria !== 'todas' && l.categoria !== filtroCategoria) return false;
      if (filtroPessoa !== FILTRO_PESSOA_TODAS) {
        const chave = l.fornecedorId ?? (l.fornecedorNome ? `nome:${l.fornecedorNome}` : null);
        if (chave !== filtroPessoa) return false;
      }
      return true;
    });
  }, [lancamentos, filtroTipo, filtroCategoria, filtroPessoa]);

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
      {financeiro && (
        <ValoresDoContrato
          financeiro={financeiro}
          luminous={luminous}
          recalculando={recalculando}
          isObraPropria={isObraPropria}
        />
      )}

      <ProfitCard
        metrics={metrics}
        title="Resultado da obra"
        description={
          recalculando
            ? 'Atualizando com o lançamento…'
            : 'Receita e custo somam os lançamentos registrados abaixo.'
        }
        mostrarLucroEstimado={false}
        luminous={luminous}
      />

      {financeiro && financeiro.custoPrevistoEquipe > 0 && (
        <CustoPrevistoEquipe financeiro={financeiro} luminous={luminous} />
      )}

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
                  {/* Itera a constante, como o modal já faz: a lista escrita à
                      mão aqui divergiria na primeira categoria nova. */}
                  {LANCAMENTO_CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {LANCAMENTO_CATEGORIA_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* XG20 — "depois no filtro eu posso colocar lá Jefferson elétrica
                  e eu vejo quanto eu paguei só para ele". Só aparece quando há
                  alguém para filtrar. */}
              {pessoasComLancamento.length > 0 && (
                <Select value={filtroPessoa} onValueChange={setFiltroPessoa}>
                  <SelectTrigger className="w-[180px] h-9" data-testid="filtro-pessoa-lancamento">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTRO_PESSOA_TODAS}>Todas as pessoas</SelectItem>
                    {pessoasComLancamento.map((p) => (
                      <SelectItem key={p.chave} value={p.chave}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
                  <>
                    <p className="text-xs text-gray-400 mt-1">
                      Registre o que entrou e o que saiu para ver receita, custo e margem.
                    </p>
                    {/* XG15 — os botões ficavam só no cabeçalho, acima dos
                        filtros; quem chega na aba vazia não tinha ação à mão. */}
                    <div className="mt-4 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => abrirNovo('entrada')}
                        className="cursor-pointer rounded-lg bg-success px-4 py-2 text-sm font-bold text-white transition-all hover:shadow-md"
                        data-testid="btn-primeira-entrada"
                      >
                        Registrar entrada
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirNovo('saida')}
                        className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:border-primary/40 hover:text-primary dark:border-gray-700 dark:text-gray-200"
                        data-testid="btn-primeira-saida"
                      >
                        Registrar saída
                      </button>
                    </div>
                  </>
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
                            {l.fornecedorNome && (
                              <Badge
                                variant="outline"
                                className="max-w-[12rem] truncate text-[10px]"
                                data-testid={`fornecedor-${l.id}`}
                              >
                                {l.fornecedorNome}
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
                          {isObraPropria && l.actorName && (
                            <p
                              className="text-xs text-gray-500 mt-0.5"
                              data-testid={`lancamento-ator-${l.id}`}
                            >
                              Registrado por {l.actorName}
                            </p>
                          )}
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
          equipe={equipe}
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
