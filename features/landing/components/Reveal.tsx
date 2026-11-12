'use client';

/**
 * Site público — o bloco aparece com um leve deslize quando entra na tela.
 * Uma vez só, curto (0,6 s), e desligado para quem pede menos movimento no
 * sistema (`prefers-reduced-motion`).
 */
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  /** Em segundos. Para cards em sequência: `i * 0.08`. */
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduzir = useReducedMotion();
  if (reduzir) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
