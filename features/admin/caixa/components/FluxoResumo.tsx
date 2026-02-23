'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { ANIMATION_CONFIG } from '@features/admin/financeiro/constants';
import { mockFluxoResumo } from '../mocks';

export function FluxoResumo() {
  const items = mockFluxoResumo;

  return (
    <Card>
      <CardContent className="p-6">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: ANIMATION_CONFIG.stagger.children },
            },
          }}
          initial="hidden"
          animate="show"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                className={cn('flex items-center gap-3 p-4 rounded-xl', item.bgClass)}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <div className={cn('p-2 rounded-lg flex-shrink-0', item.iconBgClass, item.iconColorClass)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.label}</p>
                  <p className={cn('text-sm font-extrabold mt-0.5', item.valueClass)}>{item.value}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </CardContent>
    </Card>
  );
}
