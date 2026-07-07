'use client';

import { useEffect, useState } from 'react';
import { RiImageLine } from 'react-icons/ri';

interface Props {
  src: string | null;
  alt: string;
  className?: string;
  /** No preview, mostra mensagem explícita se a imagem falhar (hotlink/CORS). */
  variant?: 'preview' | 'live';
}

/**
 * <img> com fallback gracioso de carregamento (J24). A URL colada pelo
 * anunciante pode bloquear hotlink/CORS — em vez de quebrar o card, mostra um
 * placeholder. No `preview` o texto é explícito para orientar o admin.
 */
export function CreativeImage({ src, alt, className, variant = 'live' }: Props) {
  const [failed, setFailed] = useState(false);

  // Reseta o estado de erro quando a URL muda (preview ao vivo).
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-400 ${className ?? ''}`}
      >
        <RiImageLine className="w-6 h-6" />
        {variant === 'preview' && (
          <span className="text-[11px] px-3 text-center">
            {src ? 'Imagem não carregou — verifique a URL' : 'Adicione uma imagem'}
          </span>
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
  );
}
