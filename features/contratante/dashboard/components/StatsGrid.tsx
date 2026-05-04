'use client';

import { motion } from 'framer-motion';
import { StatsCard } from './StatsCard';
import type { StatsGridProps } from '../types';

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.1 },
        },
      }}
      initial="hidden"
      animate="show"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        >
          <StatsCard {...stat} />
        </motion.div>
      ))}
    </motion.div>
  );
}
