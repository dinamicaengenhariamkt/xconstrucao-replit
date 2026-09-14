'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export type TourStep = {
  /** Seletor do elemento a destacar. Passo sem alvo é centralizado na tela. */
  target?: string;
  title: string;
  description: string;
  /**
   * XG12 — preparo do passo, executado antes de procurar o alvo. Serve para
   * abrir a aba onde o elemento vive: sem isso o `querySelector` roda contra
   * um painel que ainda não montou, `rect` cai em `null` e o passo perde o
   * spotlight sem erro visível.
   */
  onEnter?: () => void;
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

/** Margem mínima entre o balão e a borda da viewport. */
const BALLOON_MARGIN = 16;
/** Palpite só para o primeiro frame, antes de o balão existir para ser medido. */
const BALLOON_HEIGHT_FALLBACK = 200;

/**
 * Posiciona o balão abaixo do alvo, ou acima quando não há espaço, sempre
 * dentro da viewport. Sem alvo, centraliza.
 *
 * `altura` é a altura REAL do balão, medida no DOM. Antes isto era um `200`
 * fixo, e o balão de um passo com texto mais longo (267px de altura) terminava
 * fora da tela no celular — com a rolagem do body travada pelo tour, o botão
 * "Próximo" ficava inalcançável e o usuário não conseguia concluir o roteiro.
 * O `clamp` final garante que nenhum passo ultrapasse a borda, em qualquer
 * tela: é a diferença entre estimar e medir.
 */
function balloonPosition(
  rect: Rect | null,
  altura = BALLOON_HEIGHT_FALLBACK,
): { top: number; left: number; width: number } {
  if (typeof window === 'undefined') return { top: 0, left: 0, width: BALLOON_WIDTH };
  const { innerWidth: vw, innerHeight: vh } = window;
  // Em telas estreitas o balão encolhe em vez de vazar para fora da viewport.
  const width = Math.min(BALLOON_WIDTH, vw - 32);
  // Topo máximo que ainda deixa o balão inteiro visível. Nunca negativo: numa
  // tela mais baixa que o balão, o `max-height` do elemento assume e o conteúdo
  // rola dentro do próprio balão.
  const topMaximo = Math.max(BALLOON_MARGIN, vh - altura - BALLOON_MARGIN);
  const prender = (valor: number) =>
    Math.min(Math.max(BALLOON_MARGIN, valor), topMaximo);

  if (!rect) {
    return { top: prender(vh / 2 - altura / 2), left: Math.max(16, (vw - width) / 2), width };
  }

  const below = rect.top + rect.height + BALLOON_GAP;
  const cabeAbaixo = below + altura + BALLOON_MARGIN <= vh;
  const top = prender(cabeAbaixo ? below : rect.top - altura - BALLOON_GAP);
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
  onDismiss,
  labelConcluir = 'Entendi',
}: {
  steps: TourStep[];
  open: boolean;
  /** Saída deliberada (Pular / concluir): marca como visto para sempre. */
  onClose: () => void;
  /**
   * Saída acidental (Esc / clique no fundo): fecha só desta vez. Sem isto,
   * cai em `onClose` e o comportamento antigo é preservado.
   */
  onDismiss?: () => void;
  labelConcluir?: string;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);
  /** Altura real do balão. Ver `balloonPosition`: estimar isto era o bug. */
  const [balloonHeight, setBalloonHeight] = useState(BALLOON_HEIGHT_FALLBACK);
  const balloonRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // O texto muda a cada passo e a altura junto. `ResizeObserver` cobre tanto a
  // troca de passo quanto a rotação da tela e o zoom de fonte do sistema.
  useLayoutEffect(() => {
    const elemento = balloonRef.current;
    if (!open || !elemento) return;
    const medirBalao = () => setBalloonHeight(elemento.offsetHeight);
    medirBalao();
    const observer = new ResizeObserver(medirBalao);
    observer.observe(elemento);
    return () => observer.disconnect();
  }, [open, index, mounted]);
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const step = steps[index];
  const ultimo = index === steps.length - 1;

  // Mede o alvo e o mantém visível. `useLayoutEffect` evita o flash de um
  // spotlight na posição antiga antes da primeira pintura.
  useLayoutEffect(() => {
    if (!open || !step) return;

    // Prepara a tela antes de procurar o alvo (trocar de aba, por exemplo).
    step.onEnter?.();

    // Só mede. Rolar daqui seria realimentação: este mesmo callback está
    // registrado em `scroll`, e cada frame da rolagem suave pediria outra.
    const medir = () => {
      if (!step.target) return setRect(null);
      const element = document.querySelector(step.target);
      setRect(element ? rectOf(element) : null);
    };

    // O painel aberto por `onEnter` só existe no próximo frame — procurar o
    // alvo agora encontraria o DOM anterior. Daí rolar uma única vez.
    const frame = window.requestAnimationFrame(() => {
      if (step.target) {
        document
          .querySelector(step.target)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      medir();
    });
    // A rolagem suave leva alguns frames; remede quando ela termina.
    const timer = window.setTimeout(medir, 320);
    window.addEventListener('resize', medir);
    window.addEventListener('scroll', medir, true);
    return () => {
      window.cancelAnimationFrame(frame);
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

  /** Saída acidental cai em `onClose` quando o chamador não distingue as duas. */
  const dispensar = useCallback(() => (onDismiss ?? onClose)(), [onDismiss, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispensar();
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
  }, [avancar, dispensar, open, voltar]);

  useEffect(() => {
    if (open) balloonRef.current?.focus();
  }, [index, open]);

  if (!mounted || !open || !step) return null;

  const { top, left, width } = balloonPosition(rect, balloonHeight);

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
          onClick={dispensar}
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
          className="fixed overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl outline-none dark:bg-gray-900"
          // Rede de segurança para o caso extremo (tela muito baixa, fonte
          // ampliada): o balão nunca passa da viewport e o excesso rola DENTRO
          // dele — o `body` segue travado, como o tour precisa.
          style={{ top, left, width, maxHeight: `calc(100vh - ${BALLOON_MARGIN * 2}px)` }}
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
