'use client';

import {
  RiExchangeDollarLine,
  RiMoneyDollarCircleLine,
  RiHandCoinLine,
  RiPercentLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiBankLine,
  RiWalletLine,
  RiRefreshLine,
} from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import { useToast } from '@shared/hooks/use-toast';
import { StatsCard } from './StatsCard';
import { formatCurrency } from '../utils';
import { useMarketplaceMetricas, useReconciliarSplit } from '../hooks/use-marketplace-metricas';
import type { StatsCardData } from '@features/shared/components/StatsCard';

/**
 * J50 — Seção "Marketplace / Split" do painel admin de financeiro. KPIs de
 * `pagamentos_split` + `saques` e botão de reconciliação manual. Self-contained:
 * busca as próprias métricas e é injetada no fim de app/admin/financeiro/page.tsx.
 * Funciona com o marketplace off (métricas vêm zeradas).
 */
export function MarketplaceSplitSection() {
  const { toast } = useToast();
  const { data: metricas } = useMarketplaceMetricas();
  const reconciliar = useReconciliarSplit();

  if (!metricas) return null;

  const totalTudo =
    metricas.totalConfirmado +
    metricas.totalRepassado +
    metricas.totalComissao +
    metricas.qtdPendentes +
    metricas.qtdConfirmados +
    metricas.qtdFalhos +
    metricas.valorPendente +
    metricas.totalSacado +
    metricas.qtdSaquesPendentes;
  const vazio = totalTudo === 0;

  async function onReconciliar() {
    try {
      const r = await reconciliar.mutateAsync();
      toast({
        title: 'Reconciliação concluída',
        description: `${r.recuperados} recuperado(s) de ${r.verificados} verificado(s)${
          r.falhas > 0 ? ` · ${r.falhas} falha(s)` : ''
        }.`,
      });
    } catch (e) {
      toast({
        title: 'Erro na reconciliação',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  const cards: (StatsCardData & { testId: string })[] = [
    {
      testId: 'card-split-confirmado',
      label: 'Total confirmado',
      value: formatCurrency(metricas.totalConfirmado),
      icon: RiMoneyDollarCircleLine,
      iconBgColor: 'bg-primary/10 text-primary',
      badge: { label: 'Split', variant: 'primary' },
      luminous: true,
    },
    {
      testId: 'card-split-repassado',
      label: 'Repassado a empreiteiros',
      value: formatCurrency(metricas.totalRepassado),
      icon: RiHandCoinLine,
      iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
      badge: { label: 'Repasse', variant: 'success' },
      luminous: true,
    },
    {
      testId: 'card-split-comissao',
      label: 'Comissão da plataforma',
      value: formatCurrency(metricas.totalComissao),
      icon: RiPercentLine,
      iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
      badge: { label: 'Receita XCon', variant: 'info' },
      luminous: true,
    },
    {
      testId: 'card-split-pendentes',
      label: 'Pendentes',
      value: `${metricas.qtdPendentes} · ${formatCurrency(metricas.valorPendente)}`,
      icon: RiTimeLine,
      iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
      badge: { label: 'Em aberto', variant: 'warning' },
      luminous: true,
    },
    {
      testId: 'card-split-confirmados',
      label: 'Confirmados',
      value: `${metricas.qtdConfirmados}`,
      icon: RiCheckboxCircleLine,
      iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
      badge: { label: 'Splits', variant: 'success' },
      luminous: true,
    },
    {
      testId: 'card-split-falhos',
      label: 'Falhos',
      value: `${metricas.qtdFalhos}`,
      icon: RiErrorWarningLine,
      iconBgColor: 'bg-red-50 text-red-600 dark:bg-red-900/20',
      badge: { label: 'Atenção', variant: 'error' },
      luminous: true,
    },
    {
      testId: 'card-split-sacado',
      label: 'Total sacado',
      value: formatCurrency(metricas.totalSacado),
      icon: RiBankLine,
      iconBgColor: 'bg-primary/10 text-primary',
      badge: { label: 'Saques', variant: 'primary' },
      luminous: true,
    },
    {
      testId: 'card-split-saques-pendentes',
      label: 'Saques pendentes',
      value: `${metricas.qtdSaquesPendentes}`,
      icon: RiWalletLine,
      iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
      badge: { label: 'Fila', variant: 'warning' },
      luminous: true,
    },
  ];

  return (
    <section className="mt-2" data-testid="text-split-metricas">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <RiExchangeDollarLine className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Marketplace / Split</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReconciliar}
          disabled={reconciliar.isPending}
          data-testid="button-reconciliar-split"
        >
          <RiRefreshLine className={reconciliar.isPending ? 'w-4 h-4 mr-2 animate-spin' : 'w-4 h-4 mr-2'} />
          {reconciliar.isPending ? 'Reconciliando…' : 'Reconciliar agora'}
        </Button>
      </div>

      {vazio ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Nenhuma transação de split ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(({ testId, ...card }) => (
            <div key={testId} data-testid={testId}>
              <StatsCard {...card} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
