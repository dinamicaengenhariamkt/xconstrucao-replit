'use client';

import { useRef, useState } from 'react';
import { RiUploadCloud2Line, RiCloseLine, RiLoader4Line } from 'react-icons/ri';
import { useUpload } from '@features/shared/hooks/use-uploads';
import { Button } from '@shared/components/ui/button';

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Proporção do thumb (ex.: "4/3", "16/9", "728/90"). */
  aspect?: string;
  help?: string;
}

/**
 * Campo de upload de criativo (J24) → Cloudflare R2 via pipeline existente
 * (presign → PUT → commit, kind `anuncio_criativo`). Mostra progresso, thumb e
 * remoção. O `publicUrl` retornado vira o `criativoUrl` do anúncio.
 */
export function CriativoUploadField({ value, onChange, aspect = '4/3', help }: Props) {
  const { upload, pending, progress } = useUpload();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleFile(file: File) {
    setErro(null);
    try {
      const res = await upload({ file, kind: 'anuncio_criativo' });
      if (res.publicUrl) onChange(res.publicUrl);
      else setErro('Upload concluído mas sem URL pública.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha no upload.');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700" style={{ aspectRatio: aspect }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Criativo" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            aria-label="Remover imagem"
            data-testid="button-remover-criativo"
          >
            <RiCloseLine className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 py-8 text-gray-400 hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-60"
          style={{ aspectRatio: aspect }}
          data-testid="dropzone-criativo"
        >
          {pending ? (
            <>
              <RiLoader4Line className="w-6 h-6 animate-spin" />
              <span className="text-xs">Enviando… {progress}%</span>
            </>
          ) : (
            <>
              <RiUploadCloud2Line className="w-7 h-7" />
              <span className="text-xs font-medium">Clique para enviar uma imagem</span>
              <span className="text-[11px] text-gray-400">JPG, PNG ou WebP · até 8 MB</span>
            </>
          )}
        </button>
      )}

      {value && !pending && (
        <Button type="button" variant="ghost" size="sm" className="self-start text-xs" onClick={() => inputRef.current?.click()}>
          Trocar imagem
        </Button>
      )}

      {help && <p className="text-xs text-gray-400">{help}</p>}
      {erro && <p className="text-xs text-red-500">{erro}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
