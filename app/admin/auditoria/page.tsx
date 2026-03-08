'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import { FilterChips } from '@features/shared/components/FilterChips';
import { useAuditoriaKpi, useAuditoriaEventos } from '@features/admin/auditoria/hooks/use-auditoria';
import type { AuditoriaEventTipo, AuditoriaModulo } from '@features/admin/auditoria/types';
import type { FilterChipOption } from '@features/shared/types';
import {
  RiLoginCircleLine,
  RiLogoutCircleLine,
  RiUserAddLine,
  RiEdit2Line,
  RiProhibitedLine,
  RiBuilding2Line,
  RiHammerLine,
  RiMoneyDollarCircleLine,
  RiVipCrownLine,
  RiSettings3Line,
  RiServerLine,
  RiHistoryLine,
  RiSearchLine,
  RiFlashlightLine,
  RiShieldUserLine,
  RiAlertLine,
  RiErrorWarningLine,
} from 'react-icons/ri';

type EventoConfig = { icon: React.ElementType; bgColor: string };

const EVENTO_CONFIG: Record<AuditoriaEventTipo, EventoConfig> = {
  login: { icon: RiLoginCircleLine, bgColor: 'bg-emerald-500' },
  logout: { icon: RiLogoutCircleLine, bgColor: 'bg-gray-400' },
  cliente_criado: { icon: RiUserAddLine, bgColor: 'bg-blue-500' },
  cliente_editado: { icon: RiEdit2Line, bgColor: 'bg-blue-400' },
  cliente_bloqueado: { icon: RiProhibitedLine, bgColor: 'bg-red-500' },
  empreiteira_criada: { icon: RiBuilding2Line, bgColor: 'bg-indigo-500' },
  empreiteira_bloqueada: { icon: RiProhibitedLine, bgColor: 'bg-red-600' },
  obra_criada: { icon: RiHammerLine, bgColor: 'bg-amber-500' },
  obra_atualizada: { icon: RiEdit2Line, bgColor: 'bg-amber-400' },
  pagamento_registrado: { icon: RiMoneyDollarCircleLine, bgColor: 'bg-emerald-600' },
  configuracao_alterada: { icon: RiSettings3Line, bgColor: 'bg-slate-500' },
  plano_alterado: { icon: RiVipCrownLine, bgColor: 'bg-purple-500' },
  sistema: { icon: RiServerLine, bgColor: 'bg-gray-600' },
};

const MODULO_LABEL: Record<AuditoriaModulo, string> = {
  clientes: 'Clientes',
  empreiteiras: 'Empreiteiras',
  obras: 'Obras',
  financeiro: 'Financeiro',
  planos: 'Planos',
  configuracoes: 'Configurações',
  sistema: 'Sistema',
};

function formatDataHora(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return `Hoje, ${timeStr}`;
  if (diffDays === 1) return `Ontem, ${timeStr}`;
  return `${date.toLocaleDateString('pt-BR')}, ${timeStr}`;
}

function getDateLabel(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const MODULOS_FILTER: { label: string; value: string }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Clientes', value: 'clientes' },
  { label: 'Empreiteiras', value: 'empreiteiras' },
  { label: 'Obras', value: 'obras' },
  { label: 'Financeiro', value: 'financeiro' },
  { label: 'Planos', value: 'planos' },
  { label: 'Sistema', value: 'sistema' },
];

export default function AdminAuditoriaPage() {
  const { data: kpi, isLoading: kpiLoading } = useAuditoriaKpi();
  const { data: eventos, isLoading: eventosLoading } = useAuditoriaEventos();
  const [activeModulo, setActiveModulo] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filterOptions: FilterChipOption[] = useMemo(
    () =>
      MODULOS_FILTER.map((m) => ({
        label: m.label,
        value: m.value,
        count:
          m.value === 'todos'
            ? (eventos?.length ?? 0)
            : (eventos?.filter((e) => e.modulo === m.value).length ?? 0),
      })),
    [eventos],
  );

  const filtered = useMemo(() => {
    if (!eventos) return [];
    let result = eventos;
    if (activeModulo !== 'todos') {
      result = result.filter((e) => e.modulo === activeModulo);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.titulo.toLowerCase().includes(q) ||
          e.descricao.toLowerCase().includes(q) ||
          e.usuario.toLowerCase().includes(q),
      );
    }
    return result;
  }, [eventos, activeModulo, searchQuery]);

  // Group events by date label
  const grouped = useMemo(() => {
    const groups: { dateLabel: string; eventos: typeof filtered }[] = [];
    let currentLabel = '';
    for (const evt of filtered) {
      const label = getDateLabel(evt.dataHora);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ dateLabel: label, eventos: [] });
      }
      groups[groups.length - 1].eventos.push(evt);
    }
    return groups;
  }, [filtered]);

  const kpis = [
    {
      label: 'Ações hoje',
      value: kpi?.acoesHoje ?? 0,
      icon: RiFlashlightLine,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    },
    {
      label: 'Logins hoje',
      value: kpi?.loginsHoje ?? 0,
      icon: RiShieldUserLine,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
    },
    {
      label: 'Alertas',
      value: kpi?.alertas ?? 0,
      icon: RiAlertLine,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    },
    {
      label: 'Erros',
      value: kpi?.erros ?? 0,
      icon: RiErrorWarningLine,
      iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-auditoria-page">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Auditoria
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro de todas as ações realizadas na plataforma
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <motion.div
            key={kpi.label}
            className="rounded-2xl overflow-visible"
            whileHover={{ scale: 1.01, boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.06)' }}
            transition={{ duration: 0.2 }}
          >
            <Card className="h-full rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <div className={cn('p-3 rounded-lg', kpi.iconBg)}>
                  <kpi.icon className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.label}</p>
                {kpiLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{kpi.value}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <FilterChips options={filterOptions} activeValue={activeModulo} onSelect={setActiveModulo} />
        <div className="relative w-full sm:w-72">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar eventos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Timeline */}
      {eventosLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-80" />
              </div>
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16">
          <RiHistoryLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhum evento encontrado</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente alterar os filtros ou a busca.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.dateLabel}>
              <div className="flex items-center gap-3 mb-4">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {group.dateLabel}
                </p>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>

              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800" />
                <div className="flex flex-col gap-5">
                  {group.eventos.map((evento) => {
                    const cfg = EVENTO_CONFIG[evento.tipo] ?? EVENTO_CONFIG.sistema;
                    const Icon = cfg.icon;
                    return (
                      <div key={evento.id} className="flex gap-4">
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                            cfg.bgColor,
                          )}
                        >
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{evento.titulo}</p>
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                              {MODULO_LABEL[evento.modulo]}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDataHora(evento.dataHora)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{evento.descricao}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{evento.usuario}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
