'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { RiImageLine } from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import { FileUploader } from '@features/shared/components/FileUploader';
import { useToast } from '@shared/hooks/use-toast';
import { cn } from '@shared/lib/utils';
import { patchObra, useInvalidarObra } from '../hooks/use-editar-obra';

/**
 * XG12 — a capa da obra, editável de onde o usuário estiver.
 *
 * Extraído da seção "#capa" da tela de edição para servir também ao modal do
 * hero: uma capa, um componente. Duplicar a grade de seleção significaria
 * corrigir o anti-IDOR do `fotoCapaFileId` em dois lugares.
 */

type FotoDaObra = {
  id: string;
  fileId: string;
  url: string;
  tag: string | null;
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof body?.message === 'string' ? body.message : 'Não foi possível carregar.',
    );
  }
  return body as T;
}

export function CapaObraEditor({
  obraId,
  cover,
  onCoverChange,
  onSaved,
  enabled = true,
}: {
  obraId: string;
  cover: { fileId: string | null; url: string | null };
  onCoverChange: (cover: { fileId: string | null; url: string | null }) => void;
  /** Chamado depois de persistir — o modal usa para fechar. */
  onSaved?: () => void;
  /** `false` enquanto o container está fechado, para não buscar fotos à toa. */
  enabled?: boolean;
}) {
  const { toast } = useToast();
  const invalidarObra = useInvalidarObra(obraId);

  const fotosQuery = useQuery({
    queryKey: ['obras', obraId, 'fotos'],
    queryFn: () =>
      getJson<{ rows: FotoDaObra[] }>(`/api/obras/${obraId}/fotos`).then((data) => data.rows),
    enabled,
  });

  const coverMutation = useMutation({
    mutationFn: async ({ fileId, url }: { fileId: string | null; url: string | null }) => {
      await patchObra(obraId, { fotoCapaFileId: fileId });
      return { fileId, url };
    },
    onSuccess: async (nextCover) => {
      onCoverChange(nextCover);
      await invalidarObra();
      toast({ title: nextCover.fileId ? 'Capa atualizada' : 'Capa removida' });
      onSaved?.();
    },
    onError: (error) => {
      toast({
        title: 'Não foi possível atualizar a capa',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-950">
        <div className="aspect-[16/7]">
          {cover.url ? (
            <img
              src={cover.url}
              alt="Capa atual da obra"
              className="size-full object-cover"
              data-testid="xgestao-cover-preview"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-gray-400">
              <RiImageLine className="size-8" />
              <span className="text-sm">Nenhuma capa definida</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <FileUploader
          kind="obra_capa"
          accept="image/jpeg,image/png,image/webp"
          label="Enviar nova capa"
          helper="PNG, JPG ou WebP, até 8 MB. Prefira imagens horizontais."
          testId="xgestao-upload-capa"
          disabled={coverMutation.isPending}
          onUploaded={async (file) => {
            await coverMutation.mutateAsync({
              fileId: file.id,
              url: file.publicUrl ?? file.signedUrl,
            });
          }}
        />
        {cover.fileId && (
          <Button
            type="button"
            variant="outline"
            disabled={coverMutation.isPending}
            onClick={() => coverMutation.mutate({ fileId: null, url: null })}
          >
            Remover capa
          </Button>
        )}
      </div>

      {fotosQuery.data && fotosQuery.data.length > 0 && (
        <div className="mt-7">
          <p className="mb-3 text-sm font-semibold">Fotos desta obra</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {fotosQuery.data.map((foto) => {
              const selected = cover.fileId === foto.fileId;
              return (
                <button
                  key={foto.id}
                  type="button"
                  disabled={coverMutation.isPending || !foto.url}
                  onClick={() => coverMutation.mutate({ fileId: foto.fileId, url: foto.url })}
                  className={cn(
                    'group relative aspect-[4/3] overflow-hidden rounded-xl border-2 bg-gray-100 transition-all',
                    selected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-primary/50',
                  )}
                  data-testid={`xgestao-cover-option-${foto.id}`}
                >
                  <img
                    src={foto.url}
                    alt={foto.tag || 'Foto da obra'}
                    className="size-full object-cover"
                  />
                  <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/65 px-2 py-1 text-xs font-semibold text-white">
                    {selected ? 'Capa atual' : 'Usar como capa'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
