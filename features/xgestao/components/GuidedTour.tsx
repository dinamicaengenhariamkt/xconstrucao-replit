'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export type TourStep = {
  /** Seletor do elemento a destacar. Passo sem alvo é centralizado na tela. */
  target?: string;
  title: string;
  description: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const PADDING = 8;
const BALLOON_WIDTH = 320;
const BALLOON_GAP = 14;

function rectOf(element: Element): Rect {
  const box = element.getBoundingClientRect();
  return {
    top: box.top - PADDING,
    left: box.left - PADDING,
    width: box.width + PADDING * 2,
    height: box.height + PADDING * 2,
  };
}

/**
 * Posiciona o balão abaixo do alvo, ou acima quando não há espaço, sempre
 * dentro da viewport. Sem alvo, centraliza.
 */
function balloonPosition(rect: Rect | null): { top: number; left: number; width: number } {
  if (typeof window === 'undefined') return { top: 0, left: 0, width: BALLOON_WIDTH };
  const { innerWidth: vw, innerHeight: vh } = window;
  // Em telas estreitas o balão encolhe em vez de vazar para fora da viewport.
  const width = Math.min(BALLOON_WIDTH, vw - 32);

  if (!rect) {
    return { top: Math.max(16, vh / 2 - 120), left: Math.max(16, (vw - width) / 2), width };
  }

  const below = rect.top + rect.height + BALLOON_GAP;
  const cabeAbaixo = below + 200 < vh;
  const top = cabeAbaixo ? below : Math.max(16, rect.top - 200 - BALLOON_GAP);
  const left = Math.min(
    Math.max(16, rect.left + rect.width / 2 - width / 2),
    Math.max(16, vw - width - 16),
  );
  return { top, left, width };
}

/**
 * Tour guiado com spotlight: escurece a tela e mantém apenas o elemento da vez
 * legível, com um balão explicando para que ele serve.
 *
 * O recorte usa `box-shadow` espalhado em vez de máscara SVG — assim o brilho
 * acompanha o `border-radius` do recorte e o overlay continua clicável para
 * fechar sem bloquear a rolagem que reposiciona o alvo.
 */
export function GuidedTour({
  steps,
  open,
  onClose,
  labelConcluir = 'Entendi',
}: {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
  labelConcluir?: string;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);
  const balloonRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const step = steps[index];
  const ultimo = index === steps.length - 1;

  // Mede o alvo e o mantém visível. `useLayoutEffect` evita o flash de um
  // spotlight na posição antiga antes da primeira pintura.
  useLayoutEffect(() => {
    if (!open || !step) return;

    const medir = () => {
      if (!step.target) return setRect(null);
      const element = document.querySelector(step.target);
      if (!element) return setRect(null);
      setRect(rectOf(element));
    };

    const element = step.target ? document.querySelector(step.target) : null;
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    medir();
    // A rolagem suave leva alguns frames; remede enquanto ela acontece.
    const timer = window.setTimeout(medir, 320);
    window.addEventListener('resize', medir);
    window.addEventListener('scroll', medir, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', medir);
      window.removeEventListener('scroll', medir, true);
    };
  }, [open, step]);

  const avancar = useCallback(() => {
    if (ultimo) return onClose();
    setIndex((atual) => atual + 1);
  }, [onClose, ultimo]);

  const voltar = useCallback(() => setIndex((atual) => Math.max(0, atual - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') avancar();
      if (event.key === 'ArrowLeft') voltar();
    };
    window.addEventListener('keydown', onKey);
    // Trava a rolagem do fundo enquanto o tour conduz a navegação.
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowAnterior;
    };
  }, [avancar, onClose, open, voltar]);

  useEffect(() => {
    if (open) balloonRef.current?.focus();
  }, [index, open]);

  if (!mounted || !open || !step) return null;

  const { top, left, width } = balloonPosition(rect);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        data-testid="guided-tour"
      >
        {/* Overlay escuro. Com alvo, o recorte é uma janela transparente com
            sombra espalhada; sem alvo, escurece a tela inteira. */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={onClose}
          style={
            rect
              ? {
                  background: 'transparent',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                  borderRadius: 14,
                  position: 'fixed',
                  transition: 'all 220ms ease',
                }
              : { background: 'rgba(0,0,0,0.72)' }
          }
          aria-hidden
        />

        {rect && (
          <div
            className="pointer-events-none fixed rounded-[14px] ring-2 ring-primary"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              transition: 'all 220ms ease',
            }}
            aria-hidden
          />
        )}

        <motion.div
          key={index}
          ref={balloonRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guided-tour-title"
          aria-describedby="guided-tour-description"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed rounded-2xl bg-white p-5 shadow-2xl outline-none dark:bg-gray-900"
          style={{ top, left, width }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Passo {index + 1} de {steps.length}
          </p>
          <h2
            id="guided-tour-title"
            className="mt-1 text-base font-extrabold text-gray-950 dark:text-white"
          >
            {step.title}
          </h2>
          <p
            id="guided-tour-description"
            className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300"
            aria-live="polite"
          >
            {step.description}
          </p>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Pular
            </button>
            <div className="flex items-center gap-2">
              {index > 0 && (
                <button
                  type="button"
                  onClick={voltar}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Anterior
                </button>
              )}
              <button
                type="button"
                onClick={avancar}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                data-testid="guided-tour-next"
              >
                {ultimo ? labelConcluir : 'Próximo'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
