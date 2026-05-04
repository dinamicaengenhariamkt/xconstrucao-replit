'use client';

import { cn } from '@shared/lib/utils';
import {
  IconHealthAndSafety,
  IconFactCheck,
  IconDomain,
  IconDraw,
  IconCheckCircle,
} from '@shared/components/icons';
import type { ComponentType } from 'react';
import type { MinhaObraChecklist } from '../types';

const CHECKLIST_CONFIG: Record<
  MinhaObraChecklist['tipo'],
  {
    bgWrapper: string;
    borderColor: string;
    iconBg: string;
    itemCheckedBg: string;
    footerBorder: string;
  }
> = {
  seguranca: {
    bgWrapper: 'bg-red-50/50 dark:bg-red-900/10',
    borderColor: 'border-red-100 dark:border-red-800',
    iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600',
    itemCheckedBg: 'bg-success/10',
    footerBorder: 'border-red-200 dark:border-red-800',
  },
  diario: {
    bgWrapper: 'bg-blue-50/50 dark:bg-blue-900/10',
    borderColor: 'border-blue-100 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    itemCheckedBg: 'bg-success/10',
    footerBorder: 'border-blue-200 dark:border-blue-800',
  },
  etapa: {
    bgWrapper: 'bg-purple-50/50 dark:bg-purple-900/10',
    borderColor: 'border-purple-100 dark:border-purple-800',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    itemCheckedBg: 'bg-success/10',
    footerBorder: 'border-purple-200 dark:border-purple-800',
  },
};

const TIPO_ICON: Record<MinhaObraChecklist['tipo'], ComponentType<{ className?: string }>> = {
  seguranca: IconHealthAndSafety,
  diario: IconFactCheck,
  etapa: IconDomain,
};

const STATUS_BADGE: Record<MinhaObraChecklist['status'], { label: string; classes: string }> = {
  pendente: { label: 'Pendente', classes: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  completo: { label: 'Completo', classes: 'text-success bg-success/20' },
  em_andamento: { label: 'Em andamento', classes: 'text-primary bg-primary/10' },
};

function calcularProgresso(itens: MinhaObraChecklist['itens']): number {
  if (itens.length === 0) return 0;
  return Math.round((itens.filter((i) => i.concluida).length / itens.length) * 100);
}

function ChecklistCardReadOnly({ checklist }: { checklist: MinhaObraChecklist }) {
  const config = CHECKLIST_CONFIG[checklist.tipo];
  const badge = STATUS_BADGE[checklist.status];
  const TipoIcon = TIPO_ICON[checklist.tipo];
  const isCompleto = checklist.status === 'completo';
  const concluidos = checklist.itens.filter((i) => i.concluida).length;
  const total = checklist.itens.length;

  return (
    <div
      className={cn('p-5 rounded-xl border', config.bgWrapper, config.borderColor)}
      data-testid={`contratante-checklist-${checklist.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg flex-shrink-0', config.iconBg)}>
            <TipoIcon className="" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{checklist.nome}</h4>
            <p className="text-xs text-gray-500">{checklist.descricao}</p>
          </div>
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-1 rounded shrink-0', badge.classes)}>
          {checklist.tipo === 'etapa' && !isCompleto
            ? `${calcularProgresso(checklist.itens)}%`
            : badge.label}
        </span>
      </div>

      {checklist.tipo === 'etapa' && total > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-purple-200 dark:bg-purple-800/50 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isCompleto ? 'bg-success' : 'bg-purple-600',
              )}
              style={{ width: `${calcularProgresso(checklist.itens)}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5 mb-4">
        {checklist.itens.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg',
              item.concluida && config.itemCheckedBg,
            )}
          >
            <input
              type="checkbox"
              checked={item.concluida}
              disabled
              readOnly
              className="w-4 h-4 rounded flex-shrink-0 cursor-default"
            />
            <span
              className={cn(
                'text-xs',
                item.concluida
                  ? 'line-through text-gray-400'
                  : 'text-gray-700 dark:text-gray-300',
              )}
            >
              {item.titulo}
            </span>
          </div>
        ))}
      </div>

      <div className={cn('flex items-center justify-between pt-4 border-t', config.footerBorder)}>
        {isCompleto && checklist.assinadoPor ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-success font-medium flex items-center gap-1">
              <IconDraw className="text-sm" />
              Assinado por {checklist.assinadoPor}
            </span>
            {checklist.registroProfissional && (
              <span className="text-[10px] text-gray-400 ml-5">
                {checklist.registroProfissional} · {checklist.assinadoEm}
              </span>
            )}
          </div>
        ) : isCompleto && checklist.completadoEm ? (
          <span className="text-xs text-success font-medium flex items-center gap-1">
            <IconCheckCircle className="text-sm" />
            Concluído às {checklist.completadoEm}
          </span>
        ) : (
          <span className="text-xs text-gray-500">
            {concluidos}/{total} {total === 1 ? 'item' : 'itens'}
          </span>
        )}
      </div>
    </div>
  );
}

interface TabChecklistsProps {
  checklists?: MinhaObraChecklist[];
}

export function TabChecklists({ checklists = [] }: TabChecklistsProps) {
  return (
    <div
      className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm"
      data-testid="contratante-tab-checklists"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Checklists</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Segurança, registro diário e validação técnica das etapas — preenchido pelo empreiteiro.
        </p>
      </div>

      {checklists.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-4 text-center">
          <IconFactCheck className="text-5xl text-gray-200 dark:text-gray-700" />
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Nenhum checklist registrado
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Quando o empreiteiro registrar checklists de segurança, diário ou etapa, eles
              aparecerão aqui.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checklists.map((c) => (
            <ChecklistCardReadOnly key={c.id} checklist={c} />
          ))}
        </div>
      )}
    </div>
  );
}
