'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { Card, CardContent } from '@shared/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs';
import {
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiBuilding2Line,
  RiMapPinLine,
  RiCalendarLine,
  RiUserLine,
  RiHammerLine,
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiWalletLine,
  RiBarChartLine,
  RiTimeLine,
  RiAlertLine,
  RiBankCardLine,
  RiFileListLine,
  RiInformationLine,
  RiAddCircleLine,
} from 'react-icons/ri';
import { useAdminObraDetalhe } from '@features/admin/financeiro/hooks/use-obra-detalhe';
import { SITUACAO_CONFIG } from '@features/admin/financeiro/constants';
import { formatCurrency } from '@features/admin/financeiro/utils';
import type { AdminMedicao, AdminHistoricoItem, MedicaoStatus } from '@features/admin/financeiro/types';

const KPI_HOVER = {
  whileHover: {
    scale: 1.01 as number,
    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.06)',
  },
  transition: { duration: 0.2 },
} as const;

const MEDICAO_STATUS_CONFIG: Record<MedicaoStatus, { label: string; className: string }> = {
  pago: {
    label: 'Pago',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  pendente: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  },
  atrasado: {
    label: 'Atrasado',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  },
  em_analise: {
    label: 'Em análise',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  aprovada_contratante: {
    label: 'Aprovada pelo contratante',
    className: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  },
  rejeitada_contratante: {
    label: 'Rejeitada pelo contratante',
    className: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  },
  em_disputa: {
    label: 'Em disputa',
    className: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  },
};

const HISTORICO_ICON: Record<AdminHistoricoItem['tipo'], React.ComponentType<{ className?: string }>> = {
  pagamento: RiBankCardLine,
  medicao: RiFileListLine,
  aditivo: RiAddCircleLine,
  alerta: RiAlertLine,
};

const HISTORICO_COLOR: Record<AdminHistoricoItem['tipo'], string> = {
  pagamento: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medicao: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  aditivo: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  alerta: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function ProgressBar({ percent }: { percent: number }) {
  const barColor =
    percent >= 70 ? 'bg-[#22846D]' : percent >= 40 ? 'bg-[#F5A623]' : 'bg-[#E53935]';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-10 text-right">
        {percent}%
      </span>
    </div>
  );
}

function MedicoesTab({ medicoes }: { medicoes: AdminMedicao[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-border-light dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              {['Nº', 'Período', 'Valor medição', 'Valor pago', 'Vencimento', 'Pagamento', 'Status'].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left py-3 px-5 text-xs font-bold uppercase text-gray-500 tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {medicoes.map((m, idx) => {
              const cfg = MEDICAO_STATUS_CONFIG[m.status];
              const isLast = idx === medicoes.length - 1;
              return (
                <tr
                  key={m.id}
                  className={cn(
                    'hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors',
                    !isLast && 'border-b border-gray-50 dark:border-gray-800'
                  )}
                >
                  <td className="py-3 px-5 text-sm font-bold text-gray-900 dark:text-gray-100">
                    {m.numero}
                  </td>
                  <td className="py-3 px-5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {m.periodo}
                  </td>
                  <td className="py-3 px-5 text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {formatCurrency(m.valorMedicao)}
                  </td>
                  <td className="py-3 px-5 text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {m.valorPago > 0 ? formatCurrency(m.valorPago) : '—'}
                  </td>
                  <td className="py-3 px-5 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {m.dataVencimento}
                  </td>
                  <td className="py-3 px-5 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {m.dataPagamento ?? '—'}
                  </td>
                  <td className="py-3 px-5">
                    <span
                      className={cn(
                        'inline-flex px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap',
                        cfg.className
                      )}
                    >
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoricoTab({ historico }: { historico: AdminHistoricoItem[] }) {
  return (
    <div className="space-y-0">
      {historico.map((item, idx) => {
        const Icon = HISTORICO_ICON[item.tipo];
        const colorClass = HISTORICO_COLOR[item.tipo];
        const isLast = idx === historico.length - 1;
        return (
          <div key={item.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', colorClass)}>
                <Icon className="w-4 h-4" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 my-1" />}
            </div>
            <div className={cn('pb-5 flex-1 min-w-0', isLast && 'pb-0')}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.titulo}</p>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{item.data}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{item.descricao}</p>
              {item.valor !== undefined && (
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {formatCurrency(item.valor)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminObraDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data: obra, isLoading } = useAdminObraDetalhe(id);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 md:p-10 animate-pulse">
        <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-36 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-10">
        <RiBuilding2Line className="w-16 h-16 text-gray-300 dark:text-gray-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Obra não encontrada</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
          Não encontramos nenhuma obra com o identificador informado.
        </p>
        <Link
          href="/admin/financeiro"
          className="flex items-center gap-2 text-sm font-bold text-[#1E88E5] hover:underline"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Voltar ao Financeiro
        </Link>
      </div>
    );
  }

  const situacaoCfg = SITUACAO_CONFIG[obra.situacao];
  const saldoPagar = obra.valorTotal - obra.valorPago;
  const percentPago = obra.valorTotal > 0 ? Math.round((obra.valorPago / obra.valorTotal) * 100) : 0;

  const kpis = [
    {
      label: 'Valor total',
      value: formatCurrency(obra.valorTotal),
      sub: obra.aditivos > 0 ? `+ ${formatCurrency(obra.aditivos)} em aditivos` : 'Sem aditivos',
      icon: RiMoneyDollarCircleLine,
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      label: 'Total pago',
      value: formatCurrency(obra.valorPago),
      sub: `${percentPago}% do valor total`,
      icon: RiCheckboxCircleLine,
      iconColor: 'bg-[#22846D]/10 text-[#22846D]',
    },
    {
      label: 'Saldo a pagar',
      value: formatCurrency(saldoPagar),
      sub: `${100 - percentPago}% restante`,
      icon: RiWalletLine,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    },
    {
      label: 'Progresso',
      value: `${obra.percentConcluido}%`,
      sub: 'Obra concluída',
      icon: RiBarChartLine,
      iconColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    },
  ];

  return (
    <div className="space-y-6 p-6 md:p-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        <Link
          href="/admin/financeiro"
          className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Financeiro
        </Link>
        <RiArrowRightSLine className="w-4 h-4 text-gray-300" />
        <span className="text-gray-400">Obras com atenção</span>
        <RiArrowRightSLine className="w-4 h-4 text-gray-300" />
        <span className="text-gray-900 dark:text-gray-100 font-semibold truncate max-w-[200px]">
          {obra.nome}
        </span>
      </nav>

      {/* Hero Card */}
      <Card className="rounded-2xl border border-border-light dark:border-gray-800 shadow-sm overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <RiBuilding2Line className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                    {obra.nome}
                  </h1>
                  <span
                    className={cn(
                      'inline-flex px-3 py-1 rounded-full text-xs font-bold',
                      situacaoCfg.className
                    )}
                  >
                    {situacaoCfg.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Cód. {obra.codigo} · {obra.tipo}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
              <RiUserLine className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Cliente</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{obra.cliente}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
              <RiHammerLine className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Empreiteira</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{obra.empreiteira}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
              <RiCalendarLine className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Período</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {obra.dataInicio} – {obra.dataPrevisaoFim}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
              <RiMapPinLine className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Endereço</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{obra.endereco}</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1.5">
              Progresso geral
            </p>
            <ProgressBar percent={obra.percentConcluido} />
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} {...KPI_HOVER}>
            <Card className="rounded-xl border border-border-light dark:border-gray-800 shadow-sm h-full">
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {kpi.label}
                  </span>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', kpi.iconColor)}>
                    <kpi.icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
                    {kpi.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="medicoes">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
          <TabsTrigger
            value="medicoes"
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
          >
            <RiFileListLine className="w-4 h-4" />
            Medições
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
          >
            <RiTimeLine className="w-4 h-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger
            value="dados"
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
          >
            <RiInformationLine className="w-4 h-4" />
            Dados Gerais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medicoes" className="mt-4">
          <MedicoesTab medicoes={obra.medicoes} />
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <Card className="rounded-xl border border-border-light dark:border-gray-800 shadow-sm">
            <CardContent className="p-6">
              <HistoricoTab historico={obra.historico} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-xl border border-border-light dark:border-gray-800 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Informações da Obra
                </h3>
                {[
                  { label: 'Código', value: obra.codigo },
                  { label: 'Tipo', value: obra.tipo },
                  { label: 'Início', value: obra.dataInicio },
                  { label: 'Previsão de término', value: obra.dataPrevisaoFim },
                  { label: 'Endereço', value: obra.endereco },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-start gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {row.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                      {row.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border-light dark:border-gray-800 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Resumo Financeiro
                </h3>
                {[
                  { label: 'Valor contratado', value: formatCurrency(obra.valorContratado) },
                  { label: 'Aditivos', value: obra.aditivos > 0 ? formatCurrency(obra.aditivos) : '—' },
                  { label: 'Valor total', value: formatCurrency(obra.valorTotal) },
                  { label: 'Total pago', value: formatCurrency(obra.valorPago) },
                  { label: 'Saldo a pagar', value: formatCurrency(saldoPagar) },
                  {
                    label: 'Medições cadastradas',
                    value: `${obra.medicoes.length} medição${obra.medicoes.length !== 1 ? 'ões' : ''}`,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-start gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {row.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                      {row.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border-light dark:border-gray-800 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Partes Envolvidas
                </h3>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <RiUserLine className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Cliente</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{obra.cliente}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#22846D]/10 flex items-center justify-center flex-shrink-0">
                    <RiHammerLine className="w-4 h-4 text-[#22846D]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Empreiteira</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{obra.empreiteira}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
