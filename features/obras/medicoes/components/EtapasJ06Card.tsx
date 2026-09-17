'use client';

import { useState } from 'react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@shared/components/ui/dialog';
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiLoader4Line } from 'react-icons/ri';
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
  /*
   * XG23 — a prop `progressoDerivado` saiu daqui.
   *
   * Ela nasceu na XG10 para esconder o campo de percentual na obra própria,
   * onde o valor vinha da média das tarefas. O cliente desfez essa cadeia:
   * "tira isso tudo, e deixa só a etapas, e a etapa deixa com uma barrinha
   * manual mesmo, pra poder encher ali, colocar a porcentagem que ela tá".
   *
   * Com o percentual manual nos dois contextos, a prop valeria o mesmo nos
   * quatro consumidores do card (console, contratante, admin e obra pública)
   * — e prop que ninguém varia é constante disfarçada. Quem decide agora é
   * só `canWrite`, que já era a permissão certa: os dois consumidores
   * read-only passam `false` e continuam vendo a barra sem controle.
   */
}

/** Data curta para a listagem: "12/03". A data vem ISO do servidor. */
function formatarDiaMes(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
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

/**
 * XG23 — o percentual da etapa: barrinha + número.
 *
 * O cliente pediu a barrinha nestas palavras: *"eu coloco uma barrinha de
 * cursor ali mesmo, se eu colocar 10, 15, 20% e 100% na etapa (...) aí eu
 * consigo pôr manualmente mesmo, porque eu acho mais fácil de fazer"*. O campo
 * numérico fica ao lado porque arrastar acerta a dezena, não o valor exato.
 *
 * O PATCH sai ao **soltar** o cursor, não a cada movimento: arrastar de 0 a 100
 * emite dezenas de eventos, e cada um viraria um PATCH com `SELECT ... FOR
 * UPDATE` na obra — fila de escrita e histórico de auditoria inútil.
 *
 * `valorLocal` guarda o arrasto em andamento; sem ele o valor voltaria ao dado
 * do servidor a cada render e a barrinha escorregaria de volta sob o dedo.
 */
function ProgressoEtapaControl({
  progresso,
  etapaId,
  disabled,
  onCommit,
}: {
  progresso: number;
  etapaId: string;
  disabled: boolean;
  onCommit: (valor: number) => void;
}) {
  const [valorLocal, setValorLocal] = useState<number | null>(null);
  /*
   * Reconciliação com o servidor sem `useEffect`: guardamos junto o progresso
   * que o servidor tinha quando o arrasto começou. Quando ele muda (a resposta
   * do PATCH chegou, ou outra aba alterou), o rascunho local é descartado —
   * um `useEffect` de sincronia aqui causaria render extra a cada arrasto.
   */
  const [progressoBase, setProgressoBase] = useState(progresso);
  if (progressoBase !== progresso) {
    setProgressoBase(progresso);
    setValorLocal(null);
  }
  const valor = valorLocal ?? progresso;

  const comitar = (v: number) => {
    const limitado = Math.min(100, Math.max(0, Math.round(v)));
    setValorLocal(limitado);
    if (limitado !== progresso) onCommit(limitado);
  };

  return (
    <div className="flex items-center gap-3" data-tour="etapa-progresso">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={valor}
        disabled={disabled}
        onChange={(ev) => setValorLocal(Number(ev.target.value))}
        onMouseUp={(ev) => comitar(Number(ev.currentTarget.value))}
        onTouchEnd={(ev) => comitar(Number(ev.currentTarget.value))}
        onKeyUp={(ev) => comitar(Number(ev.currentTarget.value))}
        className="h-2 flex-1 cursor-pointer rounded-full accent-primary disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Percentual concluído da etapa"
        data-testid={`slider-progresso-${etapaId}`}
      />
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={100}
          value={valor}
          disabled={disabled}
          className="h-8 w-16 text-right"
          onChange={(ev) => setValorLocal(Number(ev.target.value))}
          onBlur={(ev) => {
            const v = Number(ev.target.value);
            if (Number.isNaN(v)) {
              setValorLocal(null);
              return;
            }
            comitar(v);
          }}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') ev.currentTarget.blur();
          }}
          data-testid={`input-progresso-${etapaId}`}
        />
        <span className="text-xs font-semibold text-muted-foreground">%</span>
      </div>
    </div>
  );
}

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [desc, setDesc] = useState('');
  const [responsavel, setResponsavel] = useState('');
  // XG10 — datas do Gantt, no formato do <input type="date"> (AAAA-MM-DD).
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  // XG23 — percentual editável junto do resto da etapa (só na edição).
  const [progressoForm, setProgressoForm] = useState(0);

  const resetForm = () => {
    setNome('');
    setDesc('');
    setResponsavel('');
    setDataInicio('');
    setDataFim('');
    setProgressoForm(0);
    setEditingId(null);
  };

  /** "AAAA-MM-DD" → ISO que a API espera; vazio vira null. */
  const toIso = (v: string) => (v ? new Date(`${v}T12:00:00`).toISOString() : null);
  /** ISO do banco → "AAAA-MM-DD" para o input. */
  const toInputDate = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

  const handleSave = async () => {
    if (!canWrite) return;
    if (nome.trim().length < 2) return;
    try {
      if (editingId) {
        await updateMut.mutateAsync({
          etapaId: editingId,
          nome: nome.trim(),
          descricao: desc.trim() || null,
          responsavel: responsavel.trim() || null,
          dataInicio: toIso(dataInicio),
          prazo: toIso(dataFim),
          // XG23 — o percentual vai junto com o resto da edição.
          progresso: progressoForm,
        });
      } else {
        await createMut.mutateAsync({
          nome: nome.trim(),
          descricao: desc.trim() || null,
          responsavel: responsavel.trim() || null,
          dataInicio: toIso(dataInicio),
          prazo: toIso(dataFim),
        });
      }
      resetForm();
      setOpen(false);
      toast({ title: editingId ? 'Etapa atualizada' : 'Etapa criada' });
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
            <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-nova-etapa" onClick={resetForm}><RiAddLine className="w-4 h-4 mr-1" />Nova etapa</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingId ? 'Editar etapa' : 'Nova etapa'}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome*</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} data-testid="input-etapa-nome" /></div>
                  <div><Label>Descrição</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} data-testid="input-etapa-desc" /></div>
                  <div><Label>Responsável</Label><Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} data-testid="input-etapa-responsavel" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Início previsto</Label>
                      <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} data-testid="input-etapa-data-inicio" />
                    </div>
                    <div>
                      <Label>Fim previsto</Label>
                      <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} data-testid="input-etapa-prazo" />
                    </div>
                  </div>
                  {/* XG15 — "alimentam o gráfico" soava opcional; a regra real é
                      exclusão: sem as duas datas a etapa não é desenhada. */}
                  <p className="text-xs text-muted-foreground">
                    Preencha as duas datas para a etapa aparecer no cronograma —{' '}
                    <strong>sem elas ela fica de fora do gráfico</strong>.
                  </p>
                  {/*
                    XG23 — o percentual no modal, porque foi assim que o cliente
                    descreveu o fluxo: "eu posso editar ela e eu coloco uma
                    barrinha de cursor ali mesmo". Na lista o controle serve o
                    ajuste rápido do dia a dia; aqui, quem abriu a etapa inteira
                    para revisar.

                    Só na edição: etapa nasce em 0% e o POST de etapas não
                    aceita o campo — incluir na criação obrigaria a mexer também
                    no contrato de criação, além do escopo pedido.
                  */}
                  {editingId && (
                    <div>
                      <Label>Percentual concluído</Label>
                      <div className="flex items-center gap-3 pt-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={progressoForm}
                          onChange={(e) => setProgressoForm(Number(e.target.value))}
                          className="h-2 flex-1 cursor-pointer rounded-full accent-primary"
                          aria-label="Percentual concluído da etapa"
                          data-testid="slider-etapa-progresso"
                        />
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={progressoForm}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setProgressoForm(Number.isNaN(v) ? 0 : Math.min(100, Math.max(0, v)));
                          }}
                          className="h-8 w-16 text-right"
                          data-testid="input-etapa-progresso"
                        />
                        <span className="text-xs font-semibold text-muted-foreground">%</span>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending || nome.trim().length < 2} data-testid="button-criar-etapa">
                    {(createMut.isPending || updateMut.isPending) && <RiLoader4Line className="w-4 h-4 mr-1 animate-spin" />}
                    {editingId ? 'Salvar alterações' : 'Criar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !etapas || etapas.length === 0 ? (
          /* XG15 — o empty state dizia "defina o cronograma", mandando para a aba
             errada, e não explicava o que é uma etapa. Etapa é o conceito-raiz:
             tarefa pertence a ela e o cronograma a desenha. */
          <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center dark:border-gray-700" data-testid="empty-etapas">
            <p className="font-semibold text-gray-700 dark:text-gray-200">
              Nenhuma etapa cadastrada ainda
            </p>
            {canEditScope ? (
              <>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Etapas são as fases da obra — fundação, alvenaria, acabamento. As tarefas
                  ficam dentro delas, e com as datas preenchidas viram o cronograma.
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      resetForm();
                      setOpen(true);
                    }}
                    data-testid="button-etapa-empty"
                  >
                    <RiAddLine className="mr-1 h-4 w-4" />
                    Criar primeira etapa
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                As fases desta obra aparecerão aqui.
              </p>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {etapas.map((e) => (
              <li key={e.id} className="border rounded-lg p-4 space-y-2" data-testid={`etapa-${e.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{e.nome}</p>
                    {e.descricao && <p className="text-xs text-muted-foreground mt-0.5">{e.descricao}</p>}
                     {e.responsavel && <p className="text-xs text-muted-foreground">Responsável: {e.responsavel}</p>}
                    {/* XG15 — as datas passam a aparecer na lista. Sem isto, o
                        aviso do cronograma ("N etapas ainda não têm início e
                        fim") era inacionável: o usuário teria de abrir uma a uma
                        para descobrir quais faltavam. */}
                    {e.dataInicio && e.prazo ? (
                      <p className="mt-0.5 text-xs text-muted-foreground" data-testid={`etapa-datas-${e.id}`}>
                        {formatarDiaMes(e.dataInicio)} até {formatarDiaMes(e.prazo)}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-amber-600" data-testid={`etapa-sem-datas-${e.id}`}>
                        Sem datas — não aparece no cronograma
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[e.status]}`}>{STATUS_LABEL[e.status]}</span>
                </div>
                {/* XG23 — quem pode escrever arrasta a barrinha; quem só lê vê
                    a barra. Antes eram dois controles para o mesmo número: a
                    barra aqui e um campo numérico solto na linha dos botões. */}
                {canWrite ? (
                  <ProgressoEtapaControl
                    progresso={e.progresso}
                    etapaId={e.id}
                    disabled={updateMut.isPending}
                    onCommit={(v) => handleProgresso(e.id, v)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${e.progresso}%` }} />
                    </div>
                    <span className="text-xs font-semibold w-10 text-right">{e.progresso}%</span>
                  </div>
                )}
                {canWrite && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Select value={e.status} onValueChange={(v) => handleStatus(e.id, v as EtapaStatus)}>
                      <SelectTrigger className="w-44 h-8" data-testid={`select-status-${e.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABEL) as EtapaStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {canEditScope && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(e.id);
                            setNome(e.nome);
                            setDesc(e.descricao ?? '');
                            setResponsavel(e.responsavel ?? '');
                            setDataInicio(toInputDate(e.dataInicio));
                            setDataFim(toInputDate(e.prazo));
                            setProgressoForm(e.progresso);
                            setOpen(true);
                          }}
                          data-testid={`button-edit-etapa-${e.id}`}
                        >
                          <RiEditLine className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)} data-testid={`button-delete-etapa-${e.id}`}>
                          <RiDeleteBinLine className="w-4 h-4" />
                        </Button>
                      </>
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
