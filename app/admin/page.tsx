'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { cn } from '@shared/lib/utils';
import { formatCurrency } from '@shared/lib/formatters';
import { useDashboardStats, useDashboardAlertas } from '@features/admin/dashboard/hooks/use-dashboard';
import { ADMIN_NAV_ITEMS, ADMIN_BOTTOM_NAV_ITEMS } from '@features/admin/constants';
import {
  RiGroupLine,
  RiBuilding2Line,
  RiHammerLine,
  RiMoneyDollarCircleLine,
  RiAlertLine,
  RiArrowRightLine,
  RiShieldLine,
} from 'react-icons/ri';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const ALERTA_COLORS: Record<string, string> = {
  obra_atraso: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800',
  inadimplencia: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800',
  receita_pendente: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800',
  sistema: 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700',
};

const ALL_MODULES = [...ADMIN_NAV_ITEMS, ...ADMIN_BOTTOM_NAV_ITEMS];

const MODULE_COLORS: Record<string, string> = {
  '/admin/clientes': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
  '/admin/empreiteiras': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20',
  '/admin/obras': 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
  '/admin/financeiro': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
  '/admin/caixa': 'bg-teal-50 text-teal-600 dark:bg-teal-900/20',
  '/admin/entradas': 'bg-green-50 text-green-600 dark:bg-green-900/20',
  '/admin/saidas': 'bg-red-50 text-red-600 dark:bg-red-900/20',
  '/admin/anuncios': 'bg-orange-50 text-orange-600 dark:bg-orange-900/20',
  '/admin/planos': 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
  '/admin/faq': 'bg-sky-50 text-sky-600 dark:bg-sky-900/20',
  '/admin/auditoria': 'bg-slate-50 text-slate-600 dark:bg-slate-800',
  '/admin/configuracoes': 'bg-gray-50 text-gray-600 dark:bg-gray-800',
};

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: alertas } = useDashboardAlertas();

  const kpis = [
    {
      label: 'Total Clientes',
      value: statsLoading ? '—' : String(stats?.totalClientes ?? 0),
      icon: RiGroupLine,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    },
    {
      label: 'Total Empreiteiras',
      value: statsLoading ? '—' : String(stats?.totalEmpreiteiras ?? 0),
      icon: RiBuilding2Line,
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20',
    },
    {
      label: 'Obras Ativas',
      value: statsLoading ? '—' : String(stats?.obrasAtivas ?? 0),
      icon: RiHammerLine,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    },
    {
      label: 'Volume da Plataforma',
      value: statsLoading ? '—' : formatCurrency(stats?.volumePlataforma ?? 0),
      icon: RiMoneyDollarCircleLine,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
    },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          {getGreeting()}, Admin!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral da plataforma xConstrução
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <motion.div
            key={kpi.label}
            className="rounded-2xl overflow-visible"
            whileHover={{
              scale: 1.01,
              boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.06)',
            }}
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
                {statsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{kpi.value}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Module Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Módulos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {ALL_MODULES.map((mod) => {
            const Icon = mod.icon;
            const colorClass = MODULE_COLORS[mod.url] ?? 'bg-gray-50 text-gray-600 dark:bg-gray-800';
            return (
              <Link key={mod.url} href={mod.url}>
                <motion.div
                  className="group"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card className="h-full rounded-2xl cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className={cn('p-3 rounded-xl', colorClass)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                        {mod.title}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Alertas */}
      {alertas && alertas.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <RiAlertLine className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Alertas ({alertas.length})
            </h2>
          </div>
          <div className="space-y-2">
            {alertas.map((alerta) => {
              const colorClass = ALERTA_COLORS[alerta.tipo] ?? ALERTA_COLORS.sistema;
              const inner = (
                <div
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 rounded-xl border text-sm',
                    colorClass,
                    alerta.url && 'hover:opacity-80 transition-opacity cursor-pointer',
                  )}
                >
                  <RiShieldLine className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{alerta.titulo}</p>
                    <p className="text-xs opacity-75 mt-0.5">{alerta.descricao}</p>
                  </div>
                  {alerta.url && <RiArrowRightLine className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-60" />}
                </div>
              );
              return alerta.url ? (
                <Link key={alerta.id} href={alerta.url}>
                  {inner}
                </Link>
              ) : (
                <div key={alerta.id}>{inner}</div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats banner */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Obras Concluídas</p>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats.obrasFinalizadas}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Obras com Atraso</p>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats.obrasComAtraso}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-800">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Inadimplência</p>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats.inadimplencia.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
