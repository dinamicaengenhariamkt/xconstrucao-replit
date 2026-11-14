'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { PAGINA_INSTALAR } from '../lib/plataforma';

/** QR code que abre a página de instalação no celular. Gerado no navegador. */
export function InstalarAppQrCode({ tamanho = 168 }: { tamanho?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const destino = `${window.location.origin}${PAGINA_INSTALAR}`;
    setUrl(destino);
    let ativo = true;
    QRCode.toDataURL(destino, { margin: 1, width: tamanho * 2, color: { dark: '#101819', light: '#ffffff' } })
      .then((dados) => { if (ativo) setSrc(dados); })
      .catch(() => { if (ativo) setSrc(null); });
    return () => { ativo = false; };
  }, [tamanho]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5 dark:bg-card dark:ring-border"
        style={{ width: tamanho + 16, height: tamanho + 16 }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL gerada aqui, sem otimização a fazer
          <img src={src} alt="QR code para instalar o app xgestão no celular" width={tamanho} height={tamanho} data-testid="instalar-app-qrcode" />
        ) : (
          <div className="size-full animate-pulse rounded-lg bg-slate-100 dark:bg-muted" role="status" aria-label="Gerando QR code" />
        )}
      </div>
      {url && <span className="text-[11px] text-slate-500 dark:text-muted-foreground">{url.replace(/^https?:\/\//, '')}</span>}
    </div>
  );
}
