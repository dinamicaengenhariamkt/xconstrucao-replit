'use client';

import { motion } from 'framer-motion';
import {
  RiCheckboxCircleLine,
  RiMoneyDollarCircleLine,
  RiArchiveLine,
  RiFileTextLine,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import { getRelativeTime, getActivityColor } from '../utils';
import type { Activity } from '../types';
import { cn } from '@shared/lib/utils';

interface ActivityItemProps {
  activity: Activity;
}

const ACTIVITY_ICON_MAP: Record<string, IconType> = {
  CheckCircle2: RiCheckboxCircleLine,
  DollarSign: RiMoneyDollarCircleLine,
  Package: RiArchiveLine,
  FileText: RiFileTextLine,
};

export function ActivityItem({ activity }: ActivityItemProps) {
  const IconComponent = ACTIVITY_ICON_MAP[activity.icon];

  const colorClasses = {
    success: 'bg-success/10 text-success',
    info: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
  };

  return (
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
          colorClasses[activity.color]
        )}
      >
        {IconComponent && <IconComponent className="w-5 h-5" />}
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
          {activity.title}
        </p>
        <p className="text-xs text-gray-500 line-clamp-2">{activity.description}</p>
        <p className="text-[10px] text-gray-400 mt-1 font-medium">
          {getRelativeTime(activity.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}
