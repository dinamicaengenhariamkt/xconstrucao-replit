'use client';

import { useState } from 'react';
// XG20 — data absoluta no lugar de "há 2 dias". Pedido do cliente ("coloca a
// data... até a data e horário"), e de quebra some o "em 1 minuto": o sufixo
// direcional do date-fns virava futuro quando o relógio do navegador estava
// alguns segundos atrás do servidor.
import { formatDateTime } from '@shared/lib/formatters';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { FileUploader } from '@features/shared/components/FileUploader';
import { RiAddLine, RiCheckLine, RiLoader4Line } from 'react-icons/ri';
import { IconDelete, IconEdit, IconMoreVert, IconUndo } from '@shared/components/icons';
import { useToast } from '@shared/hooks/use-toast';
import {
  useObraOcorrencias,
  useCreateOcorrencia,
  useResolverOcorrencia,
  useUpdateOcorrencia,
  useDeleteOcorrencia,
  useReabrirOcorrencia,
  type OcorrenciaGravidade,
} from '../hooks/use-obra-j06';
import type { J06DataSource, OcorrenciaJ06Data } from './types';

interface Props extends J06DataSource<OcorrenciaJ06Data> {
  obraId: string;
  canWrite: boolean;
  /**
   * Obra própria do xgestão: resolver pede a observação (opcional) e cada
   * linha com `podeGerenciar` ganha o menu editar/reabrir/excluir. Sem a prop,
   * o card segue como no marketplace: só registrar e resolver.
   */
  edicaoCompleta?: boolean;
}

const GRAVIDADE_LABEL: Record<OcorrenciaGravidade, string> = { critico: 'Crítico', medio: 'Médio', baixo: 'Baixo' };
const GRAVIDADE_BADGE: Record<OcorrenciaGravidade, string> = {
  critico: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medio: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  baixo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

/** Foto no formulário de edição: manter a atual, remover ou trocar por um upload novo. */
type FotoEdicao = { tipo: 'manter' } | { tipo: 'remover' } | { tipo: 'nova'; id: string };

function erroToast(toast: ReturnType<typeof useToast>['toast'], e: unknown) {
  toast({ title: 'Erro', description: e instanceof Error ? e.message : '', variant: 'destructive' });
}

export function OcorrenciasJ06Card({ obraId, canWrite, edicaoCompleta = false, data, isLoading: isLoadingProp }: Props) {
  const injected = data !== undefined;
  const query = useObraOcorrencias(obraId, !injected);
  const rows = injected ? data : query.data;
  const isLoading = injected ? (isLoadingProp ?? false) : query.isLoading;
  const createMut = useCreateOcorrencia(obraId);
  const resolverMut = useResolverOcorrencia(obraId);
  const updateMut = useUpdateOcorrencia(obraId);
  const deleteMut = useDeleteOcorrencia(obraId);
  const reabrirMut = useReabrirOcorrencia(obraId);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [desc, setDesc] = useState('');
  const [grav, setGrav] = useState<OcorrenciaGravidade>('medio');
  const [fotoFileId, setFotoFileId] = useState<string | null>(null);

  // Edição: o mesmo formulário do registro, preenchido com a ocorrência.
  const [editando, setEditando] = useState<OcorrenciaJ06Data | null>(null);
  const [edTitulo, setEdTitulo] = useState('');
  const [edDesc, setEdDesc] = useState('');
  const [edGrav, setEdGrav] = useState<OcorrenciaGravidade>('medio');
  const [edFoto, setEdFoto] = useState<FotoEdicao>({ tipo: 'manter' });
  const [edObs, setEdObs] = useState('');

  const [resolvendo, setResolvendo] = useState<OcorrenciaJ06Data | null>(null);
  const [obsResolucao, setObsResolucao] = useState('');
  const [excluindo, setExcluindo] = useState<OcorrenciaJ06Data | null>(null);

  const handleCreate = async () => {
    if (!canWrite) return;
    if (titulo.trim().length < 3 || desc.trim().length < 3) return;
    try {
      await createMut.mutateAsync({ titulo: titulo.trim(), descricao: desc.trim(), gravidade: grav, fotoFileId });
      setTitulo(''); setDesc(''); setGrav('medio'); setFotoFileId(null); setOpen(false);
      toast({ title: 'Ocorrência registrada' });
    } catch (e) { erroToast(toast, e); }
  };

  const handleResolver = async (id: string) => {
    if (!canWrite) return;
    try { await resolverMut.mutateAsync(id); toast({ title: 'Ocorrência resolvida' }); }
    catch (e) { erroToast(toast, e); }
  };

  const confirmarResolver = async () => {
    if (!resolvendo) return;
    try {
      await resolverMut.mutateAsync({ id: resolvendo.id, observacaoResolucao: obsResolucao.trim() || null });
      setResolvendo(null); setObsResolucao('');
      toast({ title: 'Ocorrência resolvida' });
    } catch (e) { erroToast(toast, e); }
  };

  const abrirEdicao = (o: OcorrenciaJ06Data) => {
    setEditando(o);
    setEdTitulo(o.titulo); setEdDesc(o.descricao); setEdGrav(o.gravidade);
    setEdFoto({ tipo: 'manter' }); setEdObs(o.observacaoResolucao ?? '');
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    if (edTitulo.trim().length < 3 || edDesc.trim().length < 3) return;
    try {
      await updateMut.mutateAsync({
        id: editando.id,
        titulo: edTitulo.trim(),
        descricao: edDesc.trim(),
        gravidade: edGrav,
        ...(edFoto.tipo === 'remover' ? { fotoFileId: null } : edFoto.tipo === 'nova' ? { fotoFileId: edFoto.id } : {}),
        ...(editando.status === 'resolvida' ? { observacaoResolucao: edObs.trim() || null } : {}),
      });
      setEditando(null);
      toast({ title: 'Ocorrência atualizada' });
    } catch (e) {
      // Mantém o formulário aberto: a falha não pode apagar a correção digitada.
      erroToast(toast, e);
    }
  };

  const confirmarExclusao = async () => {
    if (!excluindo) return;
    try { await deleteMut.mutateAsync(excluindo.id); setExcluindo(null); toast({ title: 'Ocorrência excluída' }); }
    catch (e) { erroToast(toast, e); }
  };

  const handleReabrir = async (id: string) => {
    try { await reabrirMut.mutateAsync(id); toast({ title: 'Ocorrência reaberta' }); }
    catch (e) { erroToast(toast, e); }
  };

  const temFotoAtual = editando ? Boolean(editando.temFoto || editando.fotoUrl) : false;

  return (
    <Card className="rounded-xl border shadow-sm" data-testid="card-ocorrencias-j06">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          {/* XG15 — "ocorrência" é jargão; o KPI do topo da tela já diz
              "Problemas Abertos" para o mesmo dado. O subtítulo aproxima as duas
              palavras sem renomear a aba, que é contrato com o link público. */}
          <div>
            <h3 className="text-base font-bold">Ocorrências</h3>
            <p className="text-xs text-muted-foreground">
              Problemas e imprevistos da obra: o que travou e precisa de solução.
            </p>
          </div>
          {canWrite && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-nova-ocorrencia"><RiAddLine className="w-4 h-4 mr-1" />Registrar problema</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar problema da obra</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Título*</Label>
                    <Input
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ex.: Vazamento na laje do 2º andar"
                      data-testid="input-ocorr-titulo"
                    />
                  </div>
                  <div>
                    <Label>Descrição*</Label>
                    <Textarea
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      rows={3}
                      placeholder="O que aconteceu, onde, e o que precisa ser feito."
                      data-testid="input-ocorr-desc"
                    />
                  </div>
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
                      obraId={obraId}
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
          <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center dark:border-border" data-testid="empty-ocorrencias">
            <p className="font-semibold text-gray-700 dark:text-slate-300">
              Nenhum problema registrado
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Registre aqui o que atrapalhou a obra: chuva, material que não chegou,
              retrabalho. Fica documentado e entra no indicador de saúde.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((o) => {
              const gerenciar = canWrite && edicaoCompleta && o.podeGerenciar === true;
              return (
              <li key={o.id} className="border rounded-lg p-3 space-y-1" data-testid={`ocorrencia-${o.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{o.titulo}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GRAVIDADE_BADGE[o.gravidade]}`}>{GRAVIDADE_LABEL[o.gravidade]}</span>
                      {o.status === 'resolvida' && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">Resolvida</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">{o.descricao}</p>
                    {o.status === 'resolvida' && o.observacaoResolucao && (
                      <p className="text-sm mt-1 whitespace-pre-wrap break-words" data-testid={`ocorrencia-observacao-${o.id}`}>
                        <strong>Como foi resolvido:</strong> {o.observacaoResolucao}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                       Por <strong className="text-foreground">{o.autorNome ?? 'Equipe da obra'}</strong> · {formatDateTime(o.createdAt)}
                      {o.resolvidoPorNome && o.resolvidoEm && (
                        <> · Resolvida por <strong className="text-foreground">{o.resolvidoPorNome}</strong> em {formatDateTime(o.resolvidoEm)}</>
                      )}
                    </p>
                    {o.fotoUrl && (
                      <a href={o.fotoUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 w-24 h-24 rounded overflow-hidden border">
                        <img src={o.fotoUrl} alt="" className="w-full h-full object-cover" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-start gap-1 shrink-0">
                    {canWrite && o.status === 'aberta' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => (edicaoCompleta ? (setObsResolucao(''), setResolvendo(o)) : handleResolver(o.id))}
                        disabled={resolverMut.isPending}
                        data-testid={`button-resolver-${o.id}`}
                      >
                        <RiCheckLine className="w-4 h-4 mr-1" />Resolver
                      </Button>
                    )}
                    {gerenciar && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-muted transition-colors cursor-pointer dark:text-muted-foreground dark:hover:text-slate-300"
                            aria-label="Ações da ocorrência"
                            data-testid={`button-acoes-ocorrencia-${o.id}`}
                          >
                            <IconMoreVert className="text-base" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => abrirEdicao(o)} data-testid={`menu-editar-ocorrencia-${o.id}`}>
                            <IconEdit className="text-sm mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {o.status === 'resolvida' && (
                            <DropdownMenuItem onClick={() => handleReabrir(o.id)} data-testid={`menu-reabrir-ocorrencia-${o.id}`}>
                              <IconUndo className="text-sm mr-2" />
                              Reabrir
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setExcluindo(o)}
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                            data-testid={`menu-excluir-ocorrencia-${o.id}`}
                          >
                            <IconDelete className="text-sm mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {/* Resolver com observação (obra própria do xgestão). */}
      <Dialog open={resolvendo !== null} onOpenChange={(v) => { if (!v) setResolvendo(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolver problema</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ocorr-obs-resolucao">Como foi resolvido (opcional)</Label>
            <Textarea
              id="ocorr-obs-resolucao"
              value={obsResolucao}
              onChange={(e) => setObsResolucao(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Ex.: manta trocada e teste de estanqueidade feito."
              data-testid="input-ocorr-observacao"
            />
            <p className="text-xs text-muted-foreground">Aparece no link do cliente quando a seção Ocorrências está ligada.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResolvendo(null)}>Cancelar</Button>
            <Button onClick={confirmarResolver} disabled={resolverMut.isPending} data-testid="button-confirmar-resolver">
              {resolverMut.isPending && <RiLoader4Line className="w-4 h-4 mr-1 animate-spin" />}Resolver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edição: mesmo formulário do registro. */}
      <Dialog open={editando !== null} onOpenChange={(v) => { if (!v) setEditando(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar problema da obra</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título*</Label>
              <Input value={edTitulo} onChange={(e) => setEdTitulo(e.target.value)} data-testid="input-edit-ocorr-titulo" />
            </div>
            <div>
              <Label>Descrição*</Label>
              <Textarea value={edDesc} onChange={(e) => setEdDesc(e.target.value)} rows={3} data-testid="input-edit-ocorr-desc" />
            </div>
            <div>
              <Label>Gravidade</Label>
              <Select value={edGrav} onValueChange={(v) => setEdGrav(v as OcorrenciaGravidade)}>
                <SelectTrigger data-testid="select-edit-ocorr-gravidade"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(GRAVIDADE_LABEL) as OcorrenciaGravidade[]).map((g) => (<SelectItem key={g} value={g}>{GRAVIDADE_LABEL[g]}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Foto (opcional)</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <FileUploader
                  kind="obra_foto"
                  obraId={obraId}
                  accept="image/jpeg,image/png,image/webp"
                  label={temFotoAtual || edFoto.tipo === 'nova' ? 'Trocar foto' : 'Enviar foto'}
                  testId="upload-edit-ocorr-foto"
                  onUploaded={(r) => setEdFoto({ tipo: 'nova', id: r.id })}
                />
                {(temFotoAtual || edFoto.tipo === 'nova') && edFoto.tipo !== 'remover' && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEdFoto({ tipo: 'remover' })} data-testid="button-remover-ocorr-foto">
                    Remover foto
                  </Button>
                )}
              </div>
              {edFoto.tipo === 'nova' && <p className="text-xs text-muted-foreground">Nova foto anexada ✓</p>}
              {edFoto.tipo === 'remover' && <p className="text-xs text-muted-foreground">A foto será removida ao salvar.</p>}
            </div>
            {editando?.status === 'resolvida' && (
              <div>
                <Label htmlFor="ocorr-edit-obs">Como foi resolvido (opcional)</Label>
                <Textarea
                  id="ocorr-edit-obs"
                  value={edObs}
                  onChange={(e) => setEdObs(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  data-testid="input-edit-ocorr-observacao"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={updateMut.isPending || edTitulo.trim().length < 3 || edDesc.trim().length < 3} data-testid="button-salvar-ocorrencia">
              {updateMut.isPending && <RiLoader4Line className="w-4 h-4 mr-1 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={excluindo !== null} onOpenChange={(v) => { if (!v) setExcluindo(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ocorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              {excluindo ? `"${excluindo.titulo}" sai da obra e do link do cliente. Não dá para desfazer.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void confirmarExclusao(); }}
              disabled={deleteMut.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirmar-excluir-ocorrencia"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
