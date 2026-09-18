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
 * XG24 — quanto esperar pelo alvo antes de desistir do passo.
 *
 * O teto cobre a soma do pior caso: a saída da aba anterior sob
 * `AnimatePresence mode="wait"` (150ms), a montagem do painel novo e a query
 * que ele dispara. Antes disto a espera era um `setTimeout` de 320ms, calibrado
 * para a rolagem suave e não para o carregamento de uma aba — abas com fetch
 * (Cronograma, Diário, Financeiro) estouravam o prazo e o passo perdia o
 * spotlight para sempre, porque nada remedia depois.
 */
const ALVO_TIMEOUT_MS = 1500;

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
  /**
   * Sentido da navegação, para o pulo de passo sem alvo saber para onde ir.
   * Num ref, e não em estado: o efeito de medição não deve re-rodar por causa
   * dele — trocaria de aba e reiniciaria a busca do alvo a cada clique.
   */
  const direcaoRef = useRef<1 | -1>(1);
  const setDirecao = useCallback((valor: 1 | -1) => {
    direcaoRef.current = valor;
  }, []);
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
    if (!open) return;
    setIndex(0);
    // Reabrir pelo botão de ajuda recomeça do zero, inclusive o sentido: sem
    // isto, quem fechou o tour após clicar "Anterior" o reabriria pulando para
    // trás no primeiro passo sem alvo.
    setDirecao(1);
  }, [open, setDirecao]);

  const step = steps[index];
  const ultimo = index === steps.length - 1;

  const avancar = useCallback(() => {
    setDirecao(1);
    if (ultimo) return onClose();
    setIndex((atual) => atual + 1);
  }, [onClose, setDirecao, ultimo]);

  const voltar = useCallback(() => {
    setDirecao(-1);
    setIndex((atual) => Math.max(0, atual - 1));
  }, [setDirecao]);

  /**
   * Pula um passo cujo alvo não apareceu, seguindo a direção em que o usuário
   * navegava.
   *
   * A direção importa: pular sempre para frente prenderia quem clicou
   * "Anterior" num passo sem alvo — ele voltaria e seria empurrado de novo para
   * o passo de onde saiu, sem entender por quê. E no primeiro ou no último
   * passo não há para onde pular: aí o balão centralizado é a saída honesta,
   * porque fechar o tour sozinho o marcaria como visto sem ter sido.
   */
  const pularPasso = useCallback(() => {
    setIndex((atual) => {
      const proximo = atual + direcaoRef.current;
      return proximo >= 0 && proximo < steps.length ? proximo : atual;
    });
  }, [steps.length]);

  // Mede o alvo e o mantém visível. `useLayoutEffect` evita o flash de um
  // spotlight na posição antiga antes da primeira pintura.
  //
  // XG24 — o efeito ganhou duas responsabilidades além de medir: esperar o alvo
  // aparecer e desistir do passo quando ele não aparece. Com o roteiro curto e
  // síncrono de antes, um alvo ausente virava um balão solto no centro da tela
  // e ninguém reparava; num roteiro que atravessa nove abas, o mesmo silêncio
  // esconderia passos quebrados em obra recém-criada, que é justamente quem vê
  // o tour.
  useLayoutEffect(() => {
    if (!open || !step) return;

    // Prepara a tela antes de procurar o alvo (trocar de aba, por exemplo).
    step.onEnter?.();

    // Passo sem alvo declarado é legítimo: centraliza e não espera nada.
    if (!step.target) {
      setRect(null);
      return;
    }

    const alvo = step.target;
    let encontrado = false;
    let timerRolagem = 0;

    // Só mede. Rolar daqui seria realimentação: este mesmo callback está
    // registrado em `scroll`, e cada frame da rolagem suave pediria outra.
    const medir = () => {
      const element = document.querySelector(alvo);
      setRect(element ? rectOf(element) : null);
    };

    /**
     * Primeira aparição do alvo: rola até ele, mede, e passa a acompanhar
     * rolagem e redimensionamento. O `scrollIntoView` acontece uma única vez —
     * repeti-lo a cada remedição brigaria com a rolagem do usuário.
     */
    const fixar = (element: Element) => {
      encontrado = true;
      pararDeEsperar();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setRect(rectOf(element));
      // A rolagem suave leva alguns frames; remede quando ela termina.
      timerRolagem = window.setTimeout(medir, 320);
      window.addEventListener('resize', medir);
      window.addEventListener('scroll', medir, true);
    };

    const procurar = () => {
      const element = document.querySelector(alvo);
      if (element) fixar(element);
      return Boolean(element);
    };

    // O painel aberto por `onEnter` não existe ainda; o observer avisa no
    // instante em que ele montar, em vez de apostar num prazo fixo.
    const observer = new MutationObserver(() => procurar());
    const desistir = window.setTimeout(() => {
      if (encontrado) return;
      pararDeEsperar();
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[GuidedTour] passo ${index + 1} ("${step.title}") pulado: nenhum elemento casa com "${alvo}".`,
        );
      }
      // Sem alvo não há o que explicar: segue em frente em vez de exibir um
      // balão órfão. Nas pontas do roteiro o passo fica, centralizado.
      pularPasso();
    }, ALVO_TIMEOUT_MS);

    function pararDeEsperar() {
      observer.disconnect();
      window.clearTimeout(desistir);
    }

    if (!procurar()) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      pararDeEsperar();
      // Sem isto, um passo trocado durante a rolagem suave mediria o alvo
      // anterior e o spotlight pousaria no elemento errado.
      window.clearTimeout(timerRolagem);
      window.removeEventListener('resize', medir);
      window.removeEventListener('scroll', medir, true);
    };
  }, [open, step, index, pularPasso]);

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
          {/* XG24 — o contador sozinho bastava para 6 passos. Num roteiro que
              cobre a obra inteira, "Passo 9 de 15" não diz se vale continuar;
              o traço preenchido responde isso de relance. */}
          <div className="flex items-center gap-3">
            <p className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-primary">
              Passo {index + 1} de {steps.length}
            </p>
            <div
              className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
              role="progressbar"
              aria-valuenow={index + 1}
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-label="Progresso do tour"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${((index + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
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
