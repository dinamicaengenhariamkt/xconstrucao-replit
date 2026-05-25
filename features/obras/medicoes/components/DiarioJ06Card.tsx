'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Textarea } from '@shared/components/ui/textarea';
import { FileUploader } from '@features/shared/components/FileUploader';
import { RiDeleteBinLine, RiImageLine, RiLoader4Line, RiSendPlaneFill } from 'react-icons/ri';
import { useToast } from '@shared/hooks/use-toast';
import { useObraDiario, useCreateDiario, useDeleteDiario } from '../hooks/use-obra-j06';

interface Props {
  obraId: string;
  canWrite: boolean;
  currentUserId?: string | null;
}

export function DiarioJ06Card({ obraId, canWrite, currentUserId }: Props) {
  const { data: entries, isLoading } = useObraDiario(obraId);
  const createMut = useCreateDiario(obraId);
  const deleteMut = useDeleteDiario(obraId);
  const { toast } = useToast();
  const [texto, setTexto] = useState('');
  const [fotoIds, setFotoIds] = useState<{ id: string; url: string }[]>([]);

  const handleSubmit = async () => {
    if (texto.trim().length < 2) return;
    try {
      await createMut.mutateAsync({ texto: texto.trim(), fotoFileIds: fotoIds.map((f) => f.id) });
      setTexto(''); setFotoIds([]);
      toast({ title: 'Registro adicionado ao diário' });
    } catch (e) {
      toast({ title: 'Erro ao registrar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta entrada do diário?')) return;
    try { await deleteMut.mutateAsync(id); toast({ title: 'Removido' }); }
    catch (e) { toast({ title: 'Erro', description: e instanceof Error ? e.message : '', variant: 'destructive' }); }
  };

  return (
    <Card className="rounded-xl border shadow-sm" data-testid="card-diario-j06">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-base font-bold">Diário de obra</h3>

        {canWrite && (
          <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
            <Textarea
              placeholder="Conte o que aconteceu hoje na obra…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={3}
              data-testid="input-diario-texto"
            />
            {fotoIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fotoIds.map((f) => (
                  <div key={f.id} className="relative w-16 h-16 rounded overflow-hidden border">
                    <img src={f.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <FileUploader
                kind="obra_foto"
                accept="image/jpeg,image/png,image/webp"
                label="Adicionar foto"
                buttonVariant="outline"
                disabled={fotoIds.length >= 8}
                testId="upload-diario-foto"
                onUploaded={(r) => { if (r.publicUrl) setFotoIds((arr) => [...arr, { id: r.id, url: r.publicUrl! }]); }}
              />
              <Button onClick={handleSubmit} disabled={createMut.isPending || texto.trim().length < 2} data-testid="button-publicar-diario">
                {createMut.isPending ? <RiLoader4Line className="w-4 h-4 mr-1 animate-spin" /> : <RiSendPlaneFill className="w-4 h-4 mr-1" />}
                Publicar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !entries || entries.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="empty-diario">Nenhum registro no diário ainda.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => {
              const canDelete = canWrite && (e.autorId === currentUserId);
              return (
                <li key={e.id} className="border rounded-lg p-3" data-testid={`diario-${e.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">{e.autorNome}</strong> · {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                      <p className="text-sm mt-1 whitespace-pre-wrap break-words">{e.texto}</p>
                      {e.fotos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {e.fotos.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded overflow-hidden border hover:opacity-80">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)} data-testid={`button-delete-diario-${e.id}`}>
                        <RiDeleteBinLine className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
