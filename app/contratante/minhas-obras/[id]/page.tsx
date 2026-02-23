'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { useObraContratanteDetalhe } from '@features/contratante/minhas-obras/hooks/use-minhas-obras';
import { StatusBadge } from '@features/shared/components/StatusBadge';
import { ProgressBar } from '@features/shared/components/ProgressBar';
import { STATUS_LABELS, STATUS_BADGE_VARIANTS, PROGRESS_COLORS } from '@features/contratante/minhas-obras/constants';
import { Skeleton } from '@shared/components/ui/skeleton';
import { RiArrowLeftLine, RiMapPinLine, RiCalendarLine, RiMoneyDollarCircleLine, RiCheckboxCircleLine, RiTimeLine, RiTeamLine, RiPhoneLine, RiImageLine } from 'react-icons/ri';

const TABS = [
  { id: 'visao-geral', label: 'Visão Geral' },
  { id: 'etapas', label: 'Etapas' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'fotos', label: 'Fotos' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

export default function ObraDetalhePage() {
  const params = useParams();
  const id = params.id as string;
  const { data: obra, isLoading } = useObraContratanteDetalhe(id);
  const [activeTab, setActiveTab] = useState('visao-geral');

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="w-full aspect-[16/7] rounded-none" />
        <div className="px-10 space-y-6">
          <Skeleton className="h-10 w-[300px]" />
          <div className="grid grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Obra não encontrada.</p>
      </div>
    );
  }

  const badgeVariant = (STATUS_BADGE_VARIANTS[obra.status] || 'neutral') as 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral';
  const progressColor = (PROGRESS_COLORS[obra.status] || 'primary') as 'success' | 'warning' | 'error' | 'info' | 'primary';

  return (
    <div className="flex flex-col" data-testid="obra-detalhe-page">
      <div className="relative w-full aspect-[16/7] overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url('${obra.imagemUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-6 left-6">
          <Link
            href="/contratante/minhas-obras"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
            data-testid="btn-back"
          >
            <RiArrowLeftLine className="w-5 h-5" />
            Voltar para Minhas Obras
          </Link>
        </div>
        <div className="absolute bottom-8 left-10 right-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <StatusBadge label={STATUS_LABELS[obra.status] || obra.status} variant={badgeVariant} size="md" />
              <h1 className="text-4xl font-extrabold text-white mt-3 tracking-tight">{obra.titulo}</h1>
              <div className="flex items-center gap-4 mt-2 text-white/70 text-sm">
                <span className="flex items-center gap-1"><RiMapPinLine className="w-4 h-4" />{obra.endereco}</span>
                <span className="flex items-center gap-1"><RiCalendarLine className="w-4 h-4" />{obra.dataInicio} - {obra.dataPrevisaoFim}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">Orçamento Total</p>
              <p className="text-2xl font-extrabold text-white">{formatCurrency(obra.orcamento)}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/70 text-xs">Progresso geral</span>
              <span className="text-white font-bold text-sm">{obra.progresso}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${obra.progresso}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-10 py-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard icon={RiMoneyDollarCircleLine} label="Valor Pago" value={formatCurrency(obra.valorPago)} color="text-success" bgColor="bg-success/10" />
          <KPICard icon={RiMoneyDollarCircleLine} label="Valor Restante" value={formatCurrency(obra.valorRestante)} color="text-warning" bgColor="bg-warning/10" />
          <KPICard icon={RiCheckboxCircleLine} label="Tarefas" value={`${obra.tarefasConcluidas}/${obra.tarefasTotal}`} color="text-info" bgColor="bg-info/10" />
          <KPICard icon={RiTimeLine} label="Dias Restantes" value={`${obra.diasRestantes}`} color="text-primary" bgColor="bg-primary/10" />
        </div>

        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-5 py-3 text-sm font-semibold transition-colors relative',
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'visao-geral' && <TabVisaoGeral obra={obra} progressColor={progressColor} />}
        {activeTab === 'etapas' && <TabEtapas obra={obra} progressColor={progressColor} />}
        {activeTab === 'financeiro' && <TabFinanceiro obra={obra} />}
        {activeTab === 'equipe' && <TabEquipe obra={obra} />}
        {activeTab === 'fotos' && <TabFotos obra={obra} />}
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color, bgColor }: { icon: React.ElementType; label: string; value: string; color: string; bgColor: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 flex items-center gap-4" data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bgColor)}>
        <Icon className={cn('w-6 h-6', color)} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-extrabold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function TabVisaoGeral({ obra, progressColor }: { obra: any; progressColor: 'success' | 'warning' | 'error' | 'info' | 'primary' }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-testid="tab-content-visao-geral">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Sobre a Obra</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{obra.descricao}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Progresso por Etapas</h3>
          <div className="space-y-4">
            {obra.etapas.map((etapa: any) => (
              <div key={etapa.id} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 shrink-0">{etapa.nome}</span>
                <div className="flex-1">
                  <ProgressBar value={etapa.progresso} color={progressColor} size="sm" />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 w-10 text-right">{etapa.progresso}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Empreiteiro</h3>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold', obra.empreiteiro.cor)}>
              {obra.empreiteiro.iniciais}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{obra.empreiteiro.nome}</p>
              <p className="text-[10px] text-gray-400">Responsável</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Informações</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Tipo</span><span className="font-semibold text-gray-700 dark:text-gray-300">{obra.tipo}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Início</span><span className="font-semibold text-gray-700 dark:text-gray-300">{obra.dataInicio}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Previsão</span><span className="font-semibold text-gray-700 dark:text-gray-300">{obra.dataPrevisaoFim}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabEtapas({ obra, progressColor }: { obra: any; progressColor: 'success' | 'warning' | 'error' | 'info' | 'primary' }) {
  return (
    <div className="space-y-6" data-testid="tab-content-etapas">
      {obra.etapas.map((etapa: any) => (
        <div key={etapa.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{etapa.nome}</h3>
            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{etapa.progresso}%</span>
          </div>
          <ProgressBar value={etapa.progresso} color={progressColor} size="sm" />
          <div className="mt-4 space-y-2">
            {etapa.tarefas.map((tarefa: any) => (
              <label key={tarefa.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                  tarefa.concluida ? 'bg-success border-success' : 'border-gray-300 dark:border-gray-600'
                )}>
                  {tarefa.concluida && <RiCheckboxCircleLine className="w-3 h-3 text-white" />}
                </div>
                <span className={cn(
                  'text-sm',
                  tarefa.concluida ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'
                )}>{tarefa.titulo}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TabFinanceiro({ obra }: { obra: any }) {
  const statusColors: Record<string, string> = {
    pago: 'bg-success/10 text-success',
    pendente: 'bg-warning/10 text-warning',
    atrasado: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };
  const statusLabels: Record<string, string> = {
    pago: 'Pago',
    pendente: 'Pendente',
    atrasado: 'Atrasado',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden" data-testid="tab-content-financeiro">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Categoria</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Data</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Valor</th>
              <th className="text-center px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {obra.financeiro.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.descricao}</td>
                <td className="px-6 py-4 text-gray-500">{item.categoria}</td>
                <td className="px-6 py-4 text-gray-500">{item.data}</td>
                <td className={cn('px-6 py-4 text-right font-bold', item.tipo === 'entrada' ? 'text-success' : 'text-gray-900 dark:text-white')}>
                  {item.tipo === 'entrada' ? '+' : '-'} {formatCurrency(item.valor)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn('inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase', statusColors[item.status])}>
                    {statusLabels[item.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabEquipe({ obra }: { obra: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="tab-content-equipe">
      {obra.equipe.map((membro: any) => (
        <div key={membro.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center">
          <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-3', membro.cor)}>
            {membro.iniciais}
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white">{membro.nome}</h4>
          <p className="text-xs text-gray-500 mt-1">{membro.funcao}</p>
          <a href={`tel:${membro.telefone}`} className="flex items-center justify-center gap-1 text-xs text-primary mt-3 hover:underline">
            <RiPhoneLine className="w-3 h-3" />
            {membro.telefone}
          </a>
        </div>
      ))}
    </div>
  );
}

function TabFotos({ obra }: { obra: any }) {
  return (
    <div data-testid="tab-content-fotos">
      {obra.fotos.length === 0 ? (
        <div className="text-center py-16">
          <RiImageLine className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma foto disponível.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {obra.fotos.map((foto: any) => (
            <div key={foto.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              <div
                className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                style={{ backgroundImage: `url('${foto.url}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium">{foto.etapa}</p>
                <p className="text-white/70 text-[10px]">{foto.data}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
