'use client';

import { useState } from 'react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@shared/components/ui/dialog';
import { RiAddLine, RiDeleteBinLine, RiLoader4Line } from 'react-icons/ri';
import { useToast } from '@shared/hooks/use-toast';
import {
  useObraEtapas,
  useCreateEtapa,
  useUpdateEtapa,
  useDeleteEtapa,
  type EtapaStatus,
} from '../hooks/use-obra-j06';
import type { EtapaJ06Data, J06DataSource } from './types';

interface Props extends J06DataSource<EtapaJ06Data> {
  obraId: string;
  canWrite: boolean;
  canEditScope: boolean; // contratante/admin
}

const STATUS_LABEL: Record<EtapaStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  bloqueado: 'Bloqueado',
  concluido: 'Concluído',
};

const STATUS_BADGE: Record<EtapaStatus, string> = {
  pendente: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  bloqueado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  concluido: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export function EtapasJ06Card({ obraId, canWrite, canEditScope, data, isLoading: isLoadingProp }: Props) {
  const injected = data !== undefined;
  const query = useObraEtapas(obraId, !injected);
  const etapas = injected ? data : query.data;
  const isLoading = injected ? (isLoadingProp ?? false) : query.isLoading;
  const createMut = useCreateEtapa(obraId);
  const updateMut = useUpdateEtapa(obraId);
  const deleteMut = useDeleteEtapa(obraId);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [desc, setDesc] = useState('');
  const [responsavel, setResponsavel] = useState('');

  const handleCreate = async () => {
    if (!canWrite) return;
    if (nome.trim().length < 2) return;
    try {
      await createMut.mutateAsync({
        nome: nome.trim(),
        descricao: desc.trim() || null,
        responsavel: responsavel.trim() || null,
      });
      setNome(''); setDesc(''); setResponsavel(''); setOpen(false);
      toast({ title: 'Etapa criada' });
    } catch (e) {
      toast({ title: 'Erro ao criar etapa', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  const handleProgresso = async (etapaId: string, progresso: number) => {
    if (!canWrite) return;
    try {
      await updateMut.mutateAsync({ etapaId, progresso });
    } catch (e) {
      toast({ title: 'Erro ao atualizar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  const handleStatus = async (etapaId: string, status: EtapaStatus) => {
    if (!canWrite) return;
    try {
      await updateMut.mutateAsync({ etapaId, status });
    } catch (e) {
      toast({ title: 'Erro', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  const handleDelete = async (etapaId: string) => {
    if (!canWrite) return;
    if (!confirm('Excluir esta etapa?')) return;
    try {
      await deleteMut.mutateAsync(etapaId);
      toast({ title: 'Etapa removida' });
    } catch (e) {
      toast({ title: 'Erro ao remover', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  return (
    <Card className="rounded-xl border shadow-sm" data-testid="card-etapas-j06">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Etapas da obra</h3>
          {canEditScope && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-nova-etapa"><RiAddLine className="w-4 h-4 mr-1" />Nova etapa</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova etapa</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome*</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} data-testid="input-etapa-nome" /></div>
                  <div><Label>Descrição</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} data-testid="input-etapa-desc" /></div>
                  <div><Label>Responsável</Label><Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} data-testid="input-etapa-responsavel" /></div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={createMut.isPending || nome.trim().length < 2} data-testid="button-criar-etapa">
                    {createMut.isPending && <RiLoader4Line className="w-4 h-4 mr-1 animate-spin" />}Criar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !etapas || etapas.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="empty-etapas">
            {canEditScope ? 'Nenhuma etapa criada. Use "Nova etapa" para definir o cronograma.' : 'Nenhuma etapa cadastrada ainda.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {etapas.map((e) => (
              <li key={e.id} className="border rounded-lg p-4 space-y-2" data-testid={`etapa-${e.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{e.nome}</p>
                    {e.descricao && <p className="text-xs text-muted-foreground mt-0.5">{e.descricao}</p>}
                     {e.responsavel && <p className="text-xs text-muted-foreground">Responsável: {e.responsavel}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[e.status]}`}>{STATUS_LABEL[e.status]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${e.progresso}%` }} />
                  </div>
                  <span className="text-xs font-semibold w-10 text-right">{e.progresso}%</span>
                </div>
                {canWrite && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={e.progresso}
                      className="w-20 h-8"
                      onBlur={(ev) => {
                        const v = Number(ev.target.value);
                        if (!Number.isNaN(v) && v !== e.progresso && v >= 0 && v <= 100) {
                          handleProgresso(e.id, v);
                        }
                      }}
                      data-testid={`input-progresso-${e.id}`}
                    />
                    <Select value={e.status} onValueChange={(v) => handleStatus(e.id, v as EtapaStatus)}>
                      <SelectTrigger className="w-44 h-8" data-testid={`select-status-${e.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABEL) as EtapaStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {canEditScope && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)} data-testid={`button-delete-etapa-${e.id}`}>
                        <RiDeleteBinLine className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
