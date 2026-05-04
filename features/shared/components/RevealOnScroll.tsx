'use client';

import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealOnScrollProps {
  children: ReactNode;
  /** Atraso em segundos antes de iniciar a animação. */
  delay?: number;
  /** Duração total da animação em segundos. */
  duration?: number;
  /** Direção do deslocamento de entrada. */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Distância em px (default 24). */
  distance?: number;
  /** Aplica blur(8px) → blur(0). Default `true`. */
  blur?: boolean;
  /** Anima apenas uma vez (`true`) ou todas as vezes que entra na viewport. */
  once?: boolean;
  className?: string;
}

const OFFSETS: Record<string, { x: number; y: number }> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  none: { x: 0, y: 0 },
};

/**
 * Wrapper de scroll-reveal com framer-motion. Anima opacity + translate + blur
 * quando o elemento entra na viewport. Inspirado no `FadeIn` do template do user.
 */
export function RevealOnScroll({
  children,
  delay = 0,
  duration = 0.7,
  direction = 'up',
  distance = 24,
  blur = true,
  once = true,
  className,
}: RevealOnScrollProps) {
  const offset = OFFSETS[direction];

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: offset.x * distance,
      y: offset.y * distance,
      filter: blur ? 'blur(8px)' : 'blur(0px)',
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)',
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2, margin: '0px 0px -10% 0px' }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
