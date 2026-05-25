'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@shared/components/ui/dialog';
import { FileUploader } from '@features/shared/components/FileUploader';
import { RiAddLine, RiCheckLine, RiLoader4Line } from 'react-icons/ri';
import { useToast } from '@shared/hooks/use-toast';
import { useObraOcorrencias, useCreateOcorrencia, useResolverOcorrencia, type OcorrenciaGravidade } from '../hooks/use-obra-j06';

interface Props {
  obraId: string;
  canWrite: boolean;
}

const GRAVIDADE_LABEL: Record<OcorrenciaGravidade, string> = { critico: 'Crítico', medio: 'Médio', baixo: 'Baixo' };
const GRAVIDADE_BADGE: Record<OcorrenciaGravidade, string> = {
  critico: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medio: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  baixo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

export function OcorrenciasJ06Card({ obraId, canWrite }: Props) {
  const { data: rows, isLoading } = useObraOcorrencias(obraId);
  const createMut = useCreateOcorrencia(obraId);
  const resolverMut = useResolverOcorrencia(obraId);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [desc, setDesc] = useState('');
  const [grav, setGrav] = useState<OcorrenciaGravidade>('medio');
  const [fotoFileId, setFotoFileId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (titulo.trim().length < 3 || desc.trim().length < 3) return;
    try {
      await createMut.mutateAsync({ titulo: titulo.trim(), descricao: desc.trim(), gravidade: grav, fotoFileId });
      setTitulo(''); setDesc(''); setGrav('medio'); setFotoFileId(null); setOpen(false);
      toast({ title: 'Ocorrência registrada' });
    } catch (e) { toast({ title: 'Erro', description: e instanceof Error ? e.message : '', variant: 'destructive' }); }
  };

  const handleResolver = async (id: string) => {
    try { await resolverMut.mutateAsync(id); toast({ title: 'Ocorrência resolvida' }); }
    catch (e) { toast({ title: 'Erro', description: e instanceof Error ? e.message : '', variant: 'destructive' }); }
  };

  return (
    <Card className="rounded-xl border shadow-sm" data-testid="card-ocorrencias-j06">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Ocorrências</h3>
          {canWrite && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-nova-ocorrencia"><RiAddLine className="w-4 h-4 mr-1" />Nova ocorrência</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar ocorrência</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Título*</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} data-testid="input-ocorr-titulo" /></div>
                  <div><Label>Descrição*</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} data-testid="input-ocorr-desc" /></div>
                  <div>
                    <Label>Gravidade</Label>
                    <Select value={grav} onValueChange={(v) => setGrav(v as OcorrenciaGravidade)}>
                      <SelectTrigger data-testid="select-ocorr-gravidade"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(GRAVIDADE_LABEL) as OcorrenciaGravidade[]).map((g) => (<SelectItem key={g} value={g}>{GRAVIDADE_LABEL[g]}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Foto (opcional)</Label>
                    <FileUploader
                      kind="obra_foto"
                      accept="image/jpeg,image/png,image/webp"
                      label={fotoFileId ? 'Trocar foto' : 'Enviar foto'}
                      testId="upload-ocorr-foto"
                      onUploaded={(r) => setFotoFileId(r.id)}
                    />
                    {fotoFileId && <p className="text-xs text-muted-foreground">Foto anexada ✓</p>}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={createMut.isPending || titulo.trim().length < 3 || desc.trim().length < 3} data-testid="button-criar-ocorrencia">
                    {createMut.isPending && <RiLoader4Line className="w-4 h-4 mr-1 animate-spin" />}Registrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !rows || rows.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="empty-ocorrencias">Nenhuma ocorrência registrada.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((o) => (
              <li key={o.id} className="border rounded-lg p-3 space-y-1" data-testid={`ocorrencia-${o.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{o.titulo}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GRAVIDADE_BADGE[o.gravidade]}`}>{GRAVIDADE_LABEL[o.gravidade]}</span>
                      {o.status === 'resolvida' && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">Resolvida</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">{o.descricao}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Por <strong className="text-foreground">{o.autorNome}</strong> · {formatDistanceToNow(new Date(o.createdAt), { addSuffix: true, locale: ptBR })}
                      {o.resolvidoPorNome && o.resolvidoEm && (
                        <> · Resolvida por <strong className="text-foreground">{o.resolvidoPorNome}</strong> {formatDistanceToNow(new Date(o.resolvidoEm), { addSuffix: true, locale: ptBR })}</>
                      )}
                    </p>
                    {o.fotoUrl && (
                      <a href={o.fotoUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 w-24 h-24 rounded overflow-hidden border">
                        <img src={o.fotoUrl} alt="" className="w-full h-full object-cover" />
                      </a>
                    )}
                  </div>
                  {canWrite && o.status === 'aberta' && (
                    <Button size="sm" variant="outline" onClick={() => handleResolver(o.id)} disabled={resolverMut.isPending} data-testid={`button-resolver-${o.id}`}>
                      <RiCheckLine className="w-4 h-4 mr-1" />Resolver
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
