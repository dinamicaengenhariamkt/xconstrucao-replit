'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  RiCheckboxCircleLine,
  RiUploadLine,
  RiEditLine,
  RiBankCardLine,
} from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { ActivityColor } from '../types';
import type { RecentActivitiesCardProps } from '../types';

const iconMap = {
  check: RiCheckboxCircleLine,
  upload: RiUploadLine,
  edit: RiEditLine,
  payment: RiBankCardLine,
};

const colorMap: Record<ActivityColor, string> = {
  success: 'bg-[#22846D]/10 text-[#22846D]',
  info: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
};

export function RecentActivitiesCard({ activities }: RecentActivitiesCardProps) {
  return (
    <Card className="border-border-light dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
          Atividades Recentes
        </CardTitle>
        <Link
          href="/contratante/atividades"
          className="text-xs font-bold text-primary hover:underline cursor-pointer"
          data-testid="link-ver-todas-atividades"
        >
          Ver todas
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {activities.map((activity) => {
            const Icon = iconMap[activity.icon as keyof typeof iconMap] ?? RiCheckboxCircleLine;
            return (
              <Link
                key={activity.id}
                href={`/contratante/minhas-obras/${activity.obraId}`}
                data-testid={`atividade-link-${activity.id}`}
              >
                <motion.div
                  className="flex gap-4 cursor-pointer px-3 py-2 -mx-3 -my-2 rounded-lg"
                  whileHover={{
                    x: 4,
                    backgroundColor: 'hsl(var(--accent))',
                  }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                      colorMap[activity.color]
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.obraNome}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                      {activity.timestamp}
                    </p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
