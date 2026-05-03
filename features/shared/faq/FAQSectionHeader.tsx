'use client';

import type { IconType } from 'react-icons';
import { cn } from '@shared/lib/utils';

interface FAQSectionHeaderProps {
  label: string;
  iconBg?: string;
  iconColor?: string;
  Icon: IconType;
}

export function FAQSectionHeader({ label, iconBg, iconColor, Icon }: FAQSectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('p-2 rounded-lg', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{label}</h2>
    </div>
  );
}
