'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { cn } from '@shared/lib/utils';
import { ActivityItem } from './ActivityItem';
import { EmptyState } from './EmptyState';
import { RiTimeLine } from 'react-icons/ri';
import type { RecentActivitiesProps } from '../types';

interface RecentActivitiesExtendedProps extends RecentActivitiesProps {
  /** Aplica a borda luminosa de seção. */
  luminous?: boolean;
}

export function RecentActivities({
  activities,
  luminous = false,
}: RecentActivitiesExtendedProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card className={cn(luminous && 'luminous-section border-transparent shadow-none')}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={RiTimeLine}
            title="Nenhuma atividade recente"
            description="As atividades aparecerão aqui conforme você trabalha"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'h-full flex flex-col',
        luminous && 'luminous-section border-transparent shadow-none',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Atividades Recentes
        </CardTitle>
        <Link
          href="/empreiteiro/dashboard/atividades-recentes"
          className="text-xs font-bold text-primary hover:underline"
        >
          Ver todas
        </Link>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-4">
          <div className="flex flex-col gap-6">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
