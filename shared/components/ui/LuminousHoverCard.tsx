'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Card } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';

/**
 * Sombra do hover. Mais sutil em cards luminous (não compete com a borda branca);
 * mais marcada em cards sem a borda luminous.
 */
const HOVER_SHADOW_LUMINOUS =
  '0 2px 8px -2px rgba(0, 0, 0, 0.06), 0 1px 3px -1px rgba(0, 0, 0, 0.03)';
const HOVER_SHADOW_PLAIN =
  '0 4px 12px -2px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.06)';

interface LuminousHoverCardProps {
  children: ReactNode;
  /** Quando informado, o card vira um link. */
  href?: string;
  /** Classe extra para o `motion.div` externo (ex.: arredondamento). */
  className?: string;
  /** Classe extra para o `Card` interno. */
  cardClassName?: string;
  /** Aplica a borda/realce luminous + linha-topo + escurecimento no hover. Default: true. */
  luminous?: boolean;
  testId?: string;
}

/**
 * Wrapper padrão dos cards menores de valor/KPI: hover com sombra + scale,
 * linha primary fina no topo e escurecimento sutil do fundo (efeito luminous).
 * Centraliza o padrão antes duplicado em StatsCard e IndicadorCard.
 *
 * Cards de seção grandes NÃO usam este wrapper — usam `luminous-section` (sem hover).
 */
export function LuminousHoverCard({
  children,
  href,
  className,
  cardClassName,
  luminous = true,
  testId,
}: LuminousHoverCardProps) {
  const inner = (
    <Card
      className={cn(
        'h-full transition-colors',
        luminous &&
          'luminous-card group overflow-hidden hover:bg-gray-50/60 dark:hover:bg-gray-800/40',
        cardClassName,
      )}
    >
      {luminous && (
        <>
          {/* Linha primary fina no topo do card — aparece no hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[2]"
          />
          {/* Gradiente de fundo sutil — aparece no hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
          />
        </>
      )}
      {children}
    </Card>
  );

  return (
    <motion.div
      className={cn('rounded-xl', className)}
      whileHover={{
        scale: 1.01,
        boxShadow: luminous ? HOVER_SHADOW_LUMINOUS : HOVER_SHADOW_PLAIN,
      }}
      transition={{ duration: 0.2 }}
    >
      {href ? (
        <Link href={href} data-testid={testId}>
          {inner}
        </Link>
      ) : (
        inner
      )}
    </motion.div>
  );
}
