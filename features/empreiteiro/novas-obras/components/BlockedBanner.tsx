'use client';

import { cn } from '@shared/lib/utils';
import { ProgressBar } from '@features/shared/components/ProgressBar';
import type { BlockedBannerProps, MotivoBloqueio } from '../types';
import { IconSchedule, IconLock, IconArrowDownward, IconDomain, IconStarHalf, IconShield, IconSupportAgent } from '@shared/components/icons';

function MotivoCard({ motivo }: { motivo: MotivoBloqueio }) {
  if (motivo.tipo === 'volume_obras') {
    const pct = Math.min(100, Math.round((motivo.atual / motivo.limite) * 100));
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-800/40 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <IconDomain className="text-xl text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">Volume de Obras</p>
            <p className="text-xs text-red-500 font-semibold">Acima do limite</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Obras em andamento</span>
            <span className="text-sm font-bold text-red-600">{motivo.atual} / {motivo.limite}</span>
          </div>
          <ProgressBar value={pct} color="error" size="sm" />
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Você atingiu o limite máximo de obras simultâneas. Conclua ao menos {motivo.atual - motivo.limite} {motivo.atual - motivo.limite === 1 ? 'obra' : 'obras'} para liberar novas candidaturas.
        </p>
      </div>
    );
  }

  if (motivo.tipo === 'atrasos') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-800/40 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <IconSchedule className="text-xl text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">Atrasos em Obras</p>
            <p className="text-xs text-red-500 font-semibold">
              {motivo.obras.length} {motivo.obras.length === 1 ? 'obra com atraso' : 'obras com atraso'}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {motivo.obras.map((obra) => (
            <div key={obra.nome} className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-600 dark:text-gray-300">{obra.nome}</span>
              <span className="text-[11px] font-bold text-red-500">+{obra.diasAtraso} dias</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Atrasos significativos foram identificados. Regularize os prazos das obras atuais para habilitar novas candidaturas.
        </p>
      </div>
    );
  }

  if (motivo.tipo === 'score') {
    const pct = Math.min(100, Math.round((motivo.atual / 100) * 100));
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-800/40 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <IconStarHalf className="text-xl text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">Score xconstrução</p>
            <p className="text-xs text-amber-600 font-semibold">Abaixo do mínimo</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Seu score atual</span>
            <span className="text-sm font-bold text-amber-600">
              {motivo.atual} <span className="text-gray-400 font-normal">/ 100</span>
            </span>
          </div>
          <ProgressBar value={pct} color="warning" size="sm" />
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-400">0</span>
            <span className="text-[10px] text-red-400 font-semibold">Mínimo: {motivo.minimo}</span>
            <span className="text-[10px] text-gray-400">100</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Seu score está abaixo do padrão mínimo de {motivo.minimo} pontos. Melhore a qualidade e pontualidade das obras para elevar seu score.
        </p>
      </div>
    );
  }

  return null;
}

export function BlockedBanner({ perfilStatus }: BlockedBannerProps) {
  const motivos = perfilStatus.motivosBloqueio ?? [];

  return (
    <div className="flex flex-col gap-6" data-testid="blocked-banner">
      {/* Alerta principal */}
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-2xl p-6 flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
          <IconLock className="text-2xl text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-red-700 dark:text-red-400 mb-1">
            {perfilStatus.motivoBloqueio || 'Você não pode se candidatar a novas obras no momento.'}
          </h3>
          <p className="text-sm text-red-600/70 dark:text-red-400/70">
            Identificamos algumas pendências que impedem a candidatura a novos projetos. Consulte os detalhes abaixo para entender os motivos e como regularizar sua situação.
          </p>
          {motivos.length > 0 && (
            <a
              href="#motivos-bloqueio"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-700 transition-colors"
            >
              <span>Entenda o motivo</span>
              <IconArrowDownward className="text-base" />
            </a>
          )}
        </div>
      </div>

      {/* Motivos detalhados */}
      {motivos.length > 0 && (
        <div id="motivos-bloqueio" className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <IconShield className="text-2xl text-gray-400 dark:text-gray-500" />
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Motivos do Bloqueio
              </h2>
              <p className="text-sm text-gray-500">
                Veja abaixo os critérios que estão impedindo sua candidatura a novas obras.
              </p>
            </div>
          </div>

          <div className={cn('grid gap-6', motivos.length === 1 ? 'grid-cols-1 max-w-sm' : motivos.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3')}>
            {motivos.map((motivo, i) => (
              <MotivoCard key={i} motivo={motivo} />
            ))}
          </div>

          {/* Card de suporte */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0">
                <IconSupportAgent className="text-xl text-info" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-white">Precisa de ajuda?</p>
                <p className="text-xs text-gray-500">
                  Nossa equipe pode ajudar a entender sua situação e orientar ações corretivas.
                </p>
              </div>
            </div>
            <button className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-sm whitespace-nowrap hover:bg-primary/90 transition-colors">
              Falar com a equipe xconstrução
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
