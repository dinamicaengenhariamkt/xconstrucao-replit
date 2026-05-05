'use client';

import { forwardRef } from 'react';
import { Card } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';

export interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  luminous?: boolean;
}

export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  ({ luminous = false, className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          luminous && 'luminous-section border-transparent shadow-none',
          className,
        )}
        {...props}
      />
    );
  },
);

SectionCard.displayName = 'SectionCard';
