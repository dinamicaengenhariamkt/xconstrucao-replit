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
        'group relative flex gap-4 px-2 py-1.5 rounded-lg transition-colors duration-200',
        isClickable
          ? 'cursor-pointer hover:bg-primary/[0.04] dark:hover:bg-primary/[0.08]'
          : 'cursor-default',
      )}
      whileHover={isClickable ? { x: 4 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {isClickable && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 bg-primary rounded-r opacity-0 group-hover:opacity-100 group-hover:h-[60%] transition-all duration-300"
        />
      )}
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
