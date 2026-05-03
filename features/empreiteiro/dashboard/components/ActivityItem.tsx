'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  RiCheckboxCircleLine,
  RiMoneyDollarCircleLine,
  RiArchiveLine,
  RiFileTextLine,
  RiAlertLine,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import { getRelativeTime } from '../utils';
import { cn } from '@shared/lib/utils';
import type { ActivityItemProps } from '../types';

const ACTIVITY_ICON_MAP: Record<string, IconType> = {
  CheckCircle2: RiCheckboxCircleLine,
  DollarSign: RiMoneyDollarCircleLine,
  Package: RiArchiveLine,
  FileText: RiFileTextLine,
  Alert: RiAlertLine,
};

const colorClasses = {
  success: 'bg-success/10 text-success',
  info: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
  primary: 'bg-primary/10 text-primary',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
};

export function ActivityItem({ activity }: ActivityItemProps) {
  const IconComponent = ACTIVITY_ICON_MAP[activity.icon];
  const isClickable = Boolean(activity.obraId);

  const content = (
    <>
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          colorClasses[activity.color],
        )}
      >
        {IconComponent && <IconComponent className="w-5 h-5" />}
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
          {activity.title}
        </p>
        <p className="text-xs text-gray-500 line-clamp-2">{activity.description}</p>
        {activity.obraNome && (
          <p className="text-[11px] text-primary font-semibold mt-1 truncate">
            {activity.obraNome}
          </p>
        )}
        <p className="text-[10px] text-gray-400 mt-1 font-medium">
          {getRelativeTime(activity.timestamp)}
        </p>
      </div>
    </>
  );

  return (
    <motion.div
      className={cn(
        'flex gap-4 px-3 py-2 -mx-3 -my-2 rounded-lg',
        isClickable ? 'cursor-pointer' : 'cursor-default',
      )}
      whileHover={
        isClickable
          ? { x: 4, backgroundColor: 'hsl(var(--accent))' }
          : undefined
      }
      transition={{ duration: 0.15 }}
    >
      {isClickable ? (
        <Link
          href={`/empreiteiro/minhas-obras/${activity.obraId}`}
          className="flex gap-4 flex-1 min-w-0"
        >
          {content}
        </Link>
      ) : (
        <div className="flex gap-4 flex-1 min-w-0">{content}</div>
      )}
    </motion.div>
  );
}
