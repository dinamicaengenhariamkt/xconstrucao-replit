'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { ActivityItem } from './ActivityItem';
import { EfficiencyProgress } from './EfficiencyProgress';
import { EmptyState } from './EmptyState';
import { RiTimeLine } from 'react-icons/ri';
import type { RecentActivitiesProps } from '../types';

export function RecentActivities({ activities, efficiency }: RecentActivitiesProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card>
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
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Atividades Recentes
        </CardTitle>
        <button className="text-xs font-bold text-primary hover:underline">Ver todas</button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="h-full max-h-[500px] pr-4">
          <div className="flex flex-col gap-6">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </ScrollArea>

        <div className="mt-10 pt-8 border-t border-border-light dark:border-gray-800">
          <EfficiencyProgress percentage={efficiency.percentage} label={efficiency.label} />
        </div>
      </CardContent>
    </Card>
  );
}
