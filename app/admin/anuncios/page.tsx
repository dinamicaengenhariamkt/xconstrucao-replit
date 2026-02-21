'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RiMegaphoneLine,
  RiCheckLine,
  RiEyeLine,
  RiPercentLine,
  RiCalendarLine,
  RiGroupLine,
  RiCursorLine,
  RiAddLine,
} from 'react-icons/ri';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Skeleton } from '@shared/components/ui/skeleton';
import { cn } from '@shared/lib/utils';
import { FilterChips } from '@features/shared/components/FilterChips';
import { useAdminAnuncios, useAdminAnuncioResumo } from '@features/admin/anuncios/hooks/use-anuncios';
import type { Anuncio, AnuncioStatus, AnuncioTipo } from '@features/admin/anuncios/types';
import type { FilterChipOption } from '@features/shared/types';

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(value);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const tipoClasses: Record<AnuncioTipo, string> = {
  banner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  destaque: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  notificacao: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  popup: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

const tipoLabels: Record<AnuncioTipo, string> = {
  banner: 'Banner',
  destaque: 'Destaque',
  notificacao: 'Notificação',
  popup: 'Pop-up',
};

const statusClasses: Record<AnuncioStatus, string> = {
  ativo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pausado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expirado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  rascunho: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const statusLabels: Record<AnuncioStatus, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  expirado: 'Expirado',
  rascunho: 'Rascunho',
};

function AnunciosSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <Skeleton className="h-11 w-11 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-9 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function AdminAnunciosPage() {
  const { data: anuncios, isLoading: loadingAnuncios } = useAdminAnuncios();
  const { data: resumo, isLoading: loadingResumo } = useAdminAnuncioResumo();
  const [activeFilter, setActiveFilter] = useState('todos');

  const filterOptions: FilterChipOption[] = useMemo(() => {
    if (!anuncios) return [];
    return [
      { label: 'Todos', value: 'todos', count: anuncios.length },
      { label: 'Ativos', value: 'ativo', count: anuncios.filter((a) => a.status === 'ativo').length },
      { label: 'Pausados', value: 'pausado', count: anuncios.filter((a) => a.status === 'pausado').length },
      { label: 'Expirados', value: 'expirado', count: anuncios.filter((a) => a.status === 'expirado').length },
      { label: 'Rascunhos', value: 'rascunho', count: anuncios.filter((a) => a.status === 'rascunho').length },
    ];
  }, [anuncios]);

  const filteredAnuncios = useMemo(() => {
    if (!anuncios) return [];
    if (activeFilter === 'todos') return anuncios;
    return anuncios.filter((a) => a.status === activeFilter);
  }, [anuncios, activeFilter]);

  const kpiCards = useMemo(() => {
    if (!resumo) return [];
    return [
      {
        label: 'Total Anúncios',
        value: formatNumber(resumo.totalAnuncios),
        icon: RiMegaphoneLine,
        iconBg: 'bg-primary/10 text-primary',
      },
      {
        label: 'Ativos',
        value: formatNumber(resumo.ativos),
        icon: RiCheckLine,
        iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      },
      {
        label: 'Impressões Totais',
        value: formatNumber(resumo.impressoesTotais),
        icon: RiEyeLine,
        iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      },
      {
        label: 'CTR Médio',
        value: `${resumo.ctrMedio.toFixed(1)}%`,
        icon: RiPercentLine,
        iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      },
    ];
  }, [resumo]);

  if (loadingAnuncios || loadingResumo) {
    return <AnunciosSkeleton />;
  }

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-anuncios-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-page-title">
            Anúncios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os anúncios e campanhas da plataforma
          </p>
        </div>
        <Button data-testid="button-novo-anuncio">
          <RiAddLine className="w-4 h-4 mr-2" />
          Novo Anúncio
        </Button>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate="show"
      >
        {kpiCards.map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          >
            <Card className="h-full" data-testid={`card-kpi-${kpi.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <div className={cn('p-3 rounded-lg', kpi.iconBg)}>
                  <kpi.icon className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <FilterChips options={filterOptions} activeValue={activeFilter} onSelect={setActiveFilter} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnuncios.map((anuncio) => (
          <AnuncioCard key={anuncio.id} anuncio={anuncio} />
        ))}
      </div>

      {filteredAnuncios.length === 0 && (
        <div className="text-center py-16">
          <RiMegaphoneLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhum anúncio encontrado</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente alterar os filtros aplicados.</p>
        </div>
      )}
    </div>
  );
}

function AnuncioCard({ anuncio }: { anuncio: Anuncio }) {
  return (
    <motion.div
      className="rounded-2xl overflow-visible"
      whileHover={{
        scale: 1.01,
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full rounded-2xl" data-testid={`card-anuncio-${anuncio.id}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <Badge
            variant="secondary"
            className={cn('no-default-hover-elevate no-default-active-elevate rounded-full text-xs', tipoClasses[anuncio.tipo])}
            data-testid={`badge-tipo-${anuncio.id}`}
          >
            {tipoLabels[anuncio.tipo]}
          </Badge>
          <Badge
            variant="secondary"
            className={cn('no-default-hover-elevate no-default-active-elevate rounded-full text-xs', statusClasses[anuncio.status])}
            data-testid={`badge-status-${anuncio.id}`}
          >
            {statusLabels[anuncio.status]}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{anuncio.titulo}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{anuncio.descricao}</p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RiCalendarLine className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(anuncio.dataInicio)} - {formatDate(anuncio.dataFim)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-muted-foreground">Impressões</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100" data-testid={`text-impressoes-${anuncio.id}`}>
                {formatNumber(anuncio.impressoes)}
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-muted-foreground">Cliques</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100" data-testid={`text-cliques-${anuncio.id}`}>
                {formatNumber(anuncio.cliques)}
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-muted-foreground">CTR</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100" data-testid={`text-ctr-${anuncio.id}`}>
                {anuncio.ctr.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RiGroupLine className="w-3.5 h-3.5 shrink-0" />
            <span>{anuncio.publicoAlvo}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
