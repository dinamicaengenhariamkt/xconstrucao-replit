import Link from 'next/link';
import {
  RiErrorWarningLine,
  RiAlertLine,
  RiInformationLine,
} from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { PendenciaPriority } from '../types';
import type { PendenciasCardProps } from '../types';

const priorityConfig: Record<
  PendenciaPriority,
  { icon: React.ElementType; bg: string; text: string; badge: string; label: string }
> = {
  alta: {
    icon: RiErrorWarningLine,
    bg: 'bg-red-50',
    text: 'text-red-600',
    badge: 'text-red-600 bg-red-50',
    label: 'Alta',
  },
  media: {
    icon: RiAlertLine,
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    badge: 'text-amber-600 bg-amber-50',
    label: 'Média',
  },
  baixa: {
    icon: RiInformationLine,
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    badge: 'text-blue-600 bg-blue-50',
    label: 'Baixa',
  },
};

interface PendenciasCardExtendedProps extends PendenciasCardProps {
  luminous?: boolean;
}

export function PendenciasCard({ pendencias, luminous = false }: PendenciasCardExtendedProps) {
  const total = pendencias.length + 4;

  return (
    <Card
      className={cn(
        'border-border-light dark:border-gray-800',
        luminous && 'luminous-section border-transparent shadow-none',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
          Pendências & Conformidades
        </CardTitle>
        <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
          {total} itens
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendencias.map((item) => {
          const config = priorityConfig[item.priority];
          const Icon = config.icon;
          return (
            <Link
              key={item.id}
              href={`/contratante/minhas-obras/${item.obraId}`}
              className="flex gap-3 cursor-pointer rounded-lg px-2 py-1.5 -mx-2 -my-1.5 transition-colors hover:bg-accent/60 dark:hover:bg-accent/30"
              data-testid={`pendencia-link-${item.id}`}
            >
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  config.bg,
                  config.text
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {item.title}
                  </p>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                      config.badge
                    )}
                  >
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {item.obraNome}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {item.prazo}
                </p>
              </div>
            </Link>
          );
        })}

        <div className="pt-4 border-t border-border-light dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Total de pendências</span>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
              {total}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
