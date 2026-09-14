'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { CapaObraEditor } from './CapaObraEditor';
import type { ObraEditavel } from '../hooks/use-editar-obra';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof body?.message === 'string' ? body.message : 'Não foi possível carregar a obra.',
    );
  }
  return body as T;
}

/**
 * XG12 — trocar a capa sem sair da obra.
 *
 * O botão vive sobre a própria capa, no hero: "na própria capa mesmo, coloca
 * um botão ali para alterar a capa".
 */
export function TrocarCapaModal({
  obraId,
  open,
  onOpenChange,
}: {
  obraId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const obraQuery = useQuery({
    queryKey: ['xgestao', 'obra-editavel', obraId],
    queryFn: () => getJson<ObraEditavel>(`/api/obras/${obraId}`),
    enabled: open,
  });

  const [cover, setCover] = useState<{ fileId: string | null; url: string | null }>({
    fileId: null,
    url: null,
  });

  // Recarrega ao abrir, como os modais irmãos: o preview tem que mostrar a
  // capa que está no banco, não a de uma abertura anterior.
  useEffect(() => {
    if (!open || !obraQuery.data) return;
    setCover({
      fileId: obraQuery.data.fotoCapaFileId,
      url: obraQuery.data.fotoCapaUrl,
    });
  }, [open, obraQuery.data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Imagem de capa</DialogTitle>
          <DialogDescription>
            Envie uma nova imagem ou escolha uma foto já registrada nesta obra. A capa também
            abre o link público.
          </DialogDescription>
        </DialogHeader>

        {obraQuery.isLoading ? (
          <div className="aspect-[16/7] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <CapaObraEditor
            obraId={obraId}
            cover={cover}
            onCoverChange={setCover}
            enabled={open}
            // Escolher a capa é a única ação deste modal: mantê-lo aberto depois
            // de trocar não oferece passo seguinte, só pede um clique a mais.
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
