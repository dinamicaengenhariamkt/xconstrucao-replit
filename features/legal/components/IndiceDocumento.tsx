'use client';

/**
 * Site público (12/11/2026) — índice "Nesta página" dos documentos legais.
 * Montado no cliente a partir dos <h2> renderizados dentro do container (o
 * documento chega do banco depois do primeiro render, por isso há um
 * MutationObserver). Cria ids slug quando o h2 não tem e destaca a seção
 * visível com IntersectionObserver.
 *
 * - `lateral`: lista fixa (sticky) para a coluna da esquerda em telas lg+.
 * - `recolhido`: <details> fechado, para celular e tablet.
 */
import { useEffect, useState, type RefObject } from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';

interface ItemIndice {
  id: string;
  texto: string;
}

const FOCO =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40';

function slug(texto: string) {
  return (
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'secao'
  );
}

function useIndice(alvo: RefObject<HTMLElement | null>) {
  const [itens, setItens] = useState<ItemIndice[]>([]);
  const [ativo, setAtivo] = useState<string | null>(null);

  // Lê os h2 e acompanha mudanças (o documento carrega depois).
  useEffect(() => {
    const raiz = alvo.current;
    if (!raiz) return;

    const ler = () => {
      const usados = new Set<string>();
      const novos: ItemIndice[] = [];
      raiz.querySelectorAll<HTMLHeadingElement>('h2').forEach((h) => {
        const texto = (h.textContent ?? '').trim();
        if (!texto) return;
        let id = h.id;
        if (!id) {
          const base = slug(texto);
          id = base;
          let n = 2;
          while (usados.has(id) || (document.getElementById(id) && document.getElementById(id) !== h)) {
            id = `${base}-${n++}`;
          }
          h.id = id;
        }
        usados.add(id);
        novos.push({ id, texto });
      });
      setItens((atuais) =>
        atuais.length === novos.length && atuais.every((a, i) => a.id === novos[i].id && a.texto === novos[i].texto)
          ? atuais
          : novos,
      );
    };

    ler();
    const mo = new MutationObserver(ler);
    mo.observe(raiz, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [alvo]);

  // Destaca o h2 visível (o primeiro, em ordem do documento).
  useEffect(() => {
    if (itens.length === 0) return;
    const visiveis = new Set<string>();
    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) visiveis.add(e.target.id);
          else visiveis.delete(e.target.id);
        });
        const primeiro = itens.find((i) => visiveis.has(i.id));
        if (primeiro) setAtivo(primeiro.id);
      },
      { rootMargin: '-112px 0px -55% 0px' },
    );
    itens.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [itens]);

  return { itens, ativo };
}

export function IndiceDocumento({
  alvo,
  variante = 'lateral',
  className = '',
}: {
  alvo: RefObject<HTMLElement | null>;
  variante?: 'lateral' | 'recolhido';
  className?: string;
}) {
  const { itens, ativo } = useIndice(alvo);
  const [aberto, setAberto] = useState(false);

  if (itens.length < 2) return null;

  const lista = (aoClicar?: () => void) => (
    <ol className="space-y-1 border-l border-black/10 dark:border-white/10">
      {itens.map((item) => {
        const atual = item.id === ativo;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={aoClicar}
              aria-current={atual ? 'location' : undefined}
              className={`-ml-px block break-words border-l-2 py-1.5 pl-4 pr-2 text-sm leading-snug transition-colors ${FOCO} ${
                atual
                  ? 'border-[#333333] font-bold text-[#101819] dark:border-white dark:text-white'
                  : 'border-transparent text-slate-500 hover:border-black/20 hover:text-[#333333] dark:text-slate-400 dark:hover:border-white/30 dark:hover:text-white'
              }`}
            >
              {item.texto}
            </a>
          </li>
        );
      })}
    </ol>
  );

  if (variante === 'recolhido') {
    return (
      <details
        open={aberto}
        onToggle={(e) => setAberto((e.currentTarget as HTMLDetailsElement).open)}
        className={`group rounded-2xl border border-black/5 bg-[#F4F5F5] dark:border-white/10 dark:bg-[#2A2D30] ${className}`}
        data-testid="indice-documento-recolhido"
      >
        <summary
          className={`flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-[#101819] dark:text-white [&::-webkit-details-marker]:hidden ${FOCO}`}
        >
          Nesta página
          <RiArrowDownSLine className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <nav aria-label="Nesta página" className="max-h-[60vh] overflow-y-auto px-5 pb-5">
          {lista(() => setAberto(false))}
        </nav>
      </details>
    );
  }

  return (
    <nav
      aria-label="Nesta página"
      className={`sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pb-4 ${className}`}
      data-testid="indice-documento"
    >
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        Nesta página
      </p>
      {lista()}
    </nav>
  );
}
