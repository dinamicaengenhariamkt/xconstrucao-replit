'use client';

import { motion } from 'framer-motion';
import { getCurrentDateFormatted } from '../utils';

export function WelcomeSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
        Painel de Visão Geral
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">{getCurrentDateFormatted()}</p>
    </motion.div>
  );
}
