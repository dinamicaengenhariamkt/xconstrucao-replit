'use client';

import { useState } from 'react';
// XG20 — data absoluta: "coloca a data, pede pra mostrar a data ali e o horário
// que foi feita as entradas". Ver a nota em OcorrenciasJ06Card.
import { formatDateTime } from '@shared/lib/formatters';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Textarea } from '@shared/components/ui/textarea';
import { FileUploader } from '@features/shared/components/FileUploader';
import { RiDeleteBinLine, RiEditLine, RiImageLine, RiLoader4Line, RiSendPlaneFill } from 'react-icons/ri';
import { useToast } from '@shared/hooks/use-toast';
import { useObraDiario, useCreateDiario, useDeleteDiario, useUpdateDiario } from '../hooks/use-obra-j06';
import type { DiarioJ06Data, J06DataSource } from './types';

interface Props extends J06DataSource<DiarioJ06Data> {
  obraId: string;
  canWrite: boolean;
  currentUserId?: string | null;
  /** Obra própria do xgestão: o autor corrige o texto do próprio registro. */
  podeEditar?: boolean;
}

export function DiarioJ06Card({ obraId, canWrite, currentUserId, podeEditar = false, data, isLoading: isLoadingProp }: Props) {
  const injected = data !== undefined;
  const query = useObraDiario(obraId, !injected);
  const entries = injected ? data : query.data;
  const isLoading = injected ? (isLoadingProp ?? false) : query.isLoading;
  const createMut = useCreateDiario(obraId);
  const deleteMut = useDeleteDiario(obraId);
  const updateMut = useUpdateDiario(obraId);
  const [edicao, setEdicao] = useState<{ id: string; texto: string } | null>(null);
  const { toast } = useToast();
  const [texto, setTexto] = useState('');
  const [fotoIds, setFotoIds] = useState<{ id: string; url: string }[]>([]);

  const handleSubmit = async () => {
    if (!canWrite) return;
    if (texto.trim().length < 2) return;
    try {
      await createMut.mutateAsync({ texto: texto.trim(), fotoFileIds: fotoIds.map((f) => f.id) });
      setTexto(''); setFotoIds([]);
      toast({ title: 'Registro adicionado ao diário' });
    } catch (e) {
      toast({ title: 'Erro ao registrar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  const handleSalvarEdicao = async () => {
    if (!edicao || edicao.texto.trim().length < 2) return;
    try {
      await updateMut.mutateAsync({ id: edicao.id, texto: edicao.texto.trim() });
      setEdicao(null);
      toast({ title: 'Registro atualizado' });
    } catch (e) {
      // Mantém o que foi digitado aberto: a falha não pode apagar a correção.
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!canWrite) return;
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
                obraId={obraId}
                label="Adicionar foto"
                buttonVariant="outline"
                disabled={fotoIds.length >= 8}
                testId="upload-diario-foto"
                onUploaded={(r) => {
                  // EMP-02 — na obra do xgestão a foto é privada: a prévia usa a URL assinada.
                  const url = r.publicUrl ?? r.signedUrl;
                  if (url) setFotoIds((arr) => [...arr, { id: r.id, url }]);
                }}
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
                         <strong className="text-foreground">{e.autorNome ?? 'Equipe da obra'}</strong> · {formatDateTime(e.createdAt)}
                      </p>
                      {edicao?.id === e.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            aria-label="Texto do registro"
                            value={edicao.texto}
                            onChange={(ev) => setEdicao({ id: e.id, texto: ev.target.value })}
                            rows={3}
                            maxLength={2000}
                            data-testid={`input-edit-diario-${e.id}`}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSalvarEdicao} disabled={updateMut.isPending || edicao.texto.trim().length < 2} data-testid={`button-salvar-diario-${e.id}`}>
                              {updateMut.isPending ? 'Salvando…' : 'Salvar'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEdicao(null)} disabled={updateMut.isPending}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm mt-1 whitespace-pre-wrap break-words">{e.texto}</p>
                      )}
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
                    {canDelete && podeEditar && edicao?.id !== e.id && (
                      <Button variant="ghost" size="sm" aria-label="Editar registro" onClick={() => setEdicao({ id: e.id, texto: e.texto })} data-testid={`button-edit-diario-${e.id}`}>
                        <RiEditLine className="w-4 h-4" />
                      </Button>
                    )}
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
