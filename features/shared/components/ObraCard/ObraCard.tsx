'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { RiMapPinLine, RiCalendarLine } from 'react-icons/ri';
import { cn } from '@shared/lib/utils';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';
import { ProgressBar } from '@features/shared/components/ProgressBar';
import {
  STATUS_BORDER_COLORS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  PROGRESS_COLORS,
} from '@shared/constants/status';
import { HealthBadge } from '@features/shared/health';
import {
  VISIBILIDADE_LABELS,
  VISIBILIDADE_BADGE_CLASSES,
} from '@features/obras/adapters';
import type { ObraCardProps } from './types';

export function ObraCard({
  obraId,
  titulo,
  endereco,
  imagemUrl,
  status,
  progresso,
  orcamento,
  dataInicio,
  dataPrevisaoFim,
  tipo,
  parteContraria,
  parteContrariaRole,
  basePath,
  dateMode,
  candidaturas,
  visibilidade,
  statusModeracao,
  motivoModeracao,
  healthStatus,
}: ObraCardProps) {
  // Só faz sentido sinalizar moderação em obras publicadas (Task #86).
  // Aprovadas não recebem badge extra (o status "publicada" já comunica isso).
  const showModBadge =
    visibilidade === 'publicada' &&
    (statusModeracao === 'pendente' || statusModeracao === 'rejeitada');
  const modBadgeLabel =
    statusModeracao === 'pendente' ? 'Em revisão' : 'Rejeitada';
  const modBadgeClass =
    statusModeracao === 'pendente'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
  const borderColor = STATUS_BORDER_COLORS[status] || 'border-l-gray-300';
  const progressColor = (PROGRESS_COLORS[status] || 'primary') as
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'primary';
  const showCandidaturas = typeof candidaturas === 'number' && candidaturas > 0;

  return (
    <Link href={`${basePath}/${obraId}`} data-testid={`obra-card-${obraId}`}>
      <motion.div
        whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.10)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={cn(
          'group bg-white dark:bg-gray-900 rounded-3xl',
          'shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-gray-50 dark:border-gray-800',
          'border-l-4',
          borderColor,
        )}
      >
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-3xl">
          <div
            className="w-full h-full bg-cover bg-center grayscale contrast-[1.1] group-hover:grayscale-0 group-hover:contrast-100 transition-[filter] duration-300"
            style={{ backgroundImage: `url('${imagemUrl}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center font-bold rounded-full uppercase tracking-wider text-[10px] px-2.5 py-1 backdrop-blur-sm',
                STATUS_BADGE_CLASSES[status] || 'bg-gray-800/80 text-white',
              )}
            >
              {STATUS_LABELS[status] || status}
            </span>
            {healthStatus && (
              <HealthBadge
                status={healthStatus}
                size="sm"
                variant="solid"
                className="backdrop-blur-sm"
              />
            )}
            {visibilidade && (
              <span
                className={cn(
                  'inline-flex items-center font-bold rounded-full uppercase tracking-wider text-[10px] px-2.5 py-1 backdrop-blur-sm',
                  VISIBILIDADE_BADGE_CLASSES[visibilidade] || 'bg-gray-200 text-gray-700',
                )}
                data-testid={`badge-visibilidade-${obraId}`}
              >
                {VISIBILIDADE_LABELS[visibilidade] || visibilidade}
              </span>
            )}
            {showModBadge && (
              <span
                className={cn(
                  'inline-flex items-center font-bold rounded-full uppercase tracking-wider text-[10px] px-2.5 py-1 backdrop-blur-sm',
                  modBadgeClass,
                )}
                title={statusModeracao === 'rejeitada' && motivoModeracao ? `Motivo: ${motivoModeracao}` : undefined}
                data-testid={`badge-moderacao-${obraId}`}
              >
                {modBadgeLabel}
              </span>
            )}
          </div>
          {showCandidaturas && (
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-[10px] font-bold text-primary">
                {candidaturas} candidaturas
              </span>
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {tipo}
            </p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {titulo}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <RiMapPinLine className="w-3.5 h-3.5 text-gray-400" />
              {endereco}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">Progresso</span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {progresso}%
              </span>
            </div>
            <ProgressBar value={progresso} color={progressColor} size="sm" />
          </div>

          <div className="flex items-center justify-between gap-2 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Orçamento</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {formatCurrency(orcamento)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">
                {dateMode === 'range' ? 'Prazo' : 'Entrega'}
              </p>
              {dateMode === 'range' ? (
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-xs">
                  {dataInicio} - {dataPrevisaoFim}
                </p>
              ) : (
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-xs flex items-center gap-1 justify-end">
                  <RiCalendarLine className="w-3 h-3" />
                  {dataPrevisaoFim}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex items-center gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
                parteContraria.cor,
              )}
            >
              {parteContraria.iniciais}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {parteContraria.nome}
              </p>
              <p className="text-[10px] text-gray-400">{parteContrariaRole}</p>
            </div>
          </div>

          <span className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-colors bg-primary/10 text-primary hover:bg-primary/20">
            Ver detalhes
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
