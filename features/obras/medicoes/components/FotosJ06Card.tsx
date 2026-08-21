'use client';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { FileUploader } from '@features/shared/components/FileUploader';
import { RiDeleteBinLine } from 'react-icons/ri';
import { useToast } from '@shared/hooks/use-toast';
import { useObraFotos, useCreateFoto, useDeleteFoto } from '../hooks/use-obra-j06';
import type { FotoJ06Data, J06DataSource } from './types';

interface Props extends J06DataSource<FotoJ06Data> {
  obraId: string;
  canWrite: boolean;
  currentUserId?: string | null;
  currentUserRole?: string;
}

export function FotosJ06Card({ obraId, canWrite, currentUserId, currentUserRole, data, isLoading: isLoadingProp }: Props) {
  const injected = data !== undefined;
  const query = useObraFotos(obraId, !injected);
  const rows = injected ? data : query.data;
  const isLoading = injected ? (isLoadingProp ?? false) : query.isLoading;
  const createMut = useCreateFoto(obraId);
  const deleteMut = useDeleteFoto(obraId);
  const { toast } = useToast();

  const handleUpload = async (fileId: string) => {
    if (!canWrite) return;
    try {
      await createMut.mutateAsync({ fileId });
      toast({ title: 'Foto adicionada' });
    } catch (e) { toast({ title: 'Erro', description: e instanceof Error ? e.message : '', variant: 'destructive' }); }
  };

  const handleDelete = async (id: string) => {
    if (!canWrite) return;
    if (!confirm('Excluir esta foto?')) return;
    try { await deleteMut.mutateAsync(id); toast({ title: 'Foto removida' }); }
    catch (e) { toast({ title: 'Erro', description: e instanceof Error ? e.message : '', variant: 'destructive' }); }
  };

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'superadmin';

  return (
    <Card className="rounded-xl border shadow-sm" data-testid="card-fotos-j06">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Fotos da obra</h3>
          {canWrite && (
            <FileUploader
              kind="obra_foto"
              accept="image/jpeg,image/png,image/webp"
              label="Enviar foto"
              testId="upload-foto-obra"
              onUploaded={(r) => handleUpload(r.id)}
            />
          )}
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !rows || rows.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="empty-fotos">Nenhuma foto enviada ainda.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {rows.map((f) => {
               const canDelete = (canWrite && f.autorId === currentUserId) || isAdmin;
              return (
                <div key={f.id} className="relative group border rounded-lg overflow-hidden bg-muted" data-testid={`foto-${f.id}`}>
                  <a href={f.url} target="_blank" rel="noreferrer" className="block aspect-square">
                    <img src={f.url} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                  </a>
                  <div className="p-2 text-xs">
                     <p className="font-medium truncate">{f.autorNome ?? 'Equipe da obra'}</p>
                    <p className="text-muted-foreground">{formatDistanceToNow(new Date(f.createdAt), { addSuffix: true, locale: ptBR })}</p>
                  </div>
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(f.id)}
                      data-testid={`button-delete-foto-${f.id}`}
                    >
                      <RiDeleteBinLine className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
