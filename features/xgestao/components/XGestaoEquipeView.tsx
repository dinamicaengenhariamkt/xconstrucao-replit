'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RiAddLine,
  RiEditLine,
  RiMailSendLine,
  RiRefreshLine,
  RiShieldUserLine,
  RiTeamLine,
  RiUserForbidLine,
} from 'react-icons/ri';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Skeleton } from '@shared/components/ui/skeleton';

type Papel = 'gestor' | 'colaborador';
type Permissao = 'visualizar' | 'editar';
type Obra = { id: string; nome: string };
type MembroObra = { obraId: string; permissao: Permissao };
type Membro = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  status: string;
  obras: MembroObra[];
};
type EquipeData = { rows: Membro[]; obras: Obra[] };
type FormState = { nome: string; email: string; papel: Papel; obras: MembroObra[] };

const ROLE_LABEL: Record<string, string> = { gestor: 'Gestor', colaborador: 'Colaborador' };
const STATUS_LABEL: Record<string, string> = {
  pendente: 'Convite pendente',
  convidado: 'Convite pendente',
  pending: 'Convite pendente',
  ativo: 'Ativo',
  ativa: 'Ativo',
  active: 'Ativo',
  revogado: 'Acesso revogado',
  revogada: 'Acesso revogado',
  revoked: 'Acesso revogado',
};
const STATUS_STYLE: Record<string, string> = {
  pendente: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  convidado: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  pending: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  ativo: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  ativa: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  revogado: 'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
  revogada: 'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
  revoked: 'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const blankForm = (): FormState => ({ nome: '', email: '', papel: 'colaborador', obras: [] });

async function apiRequest(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body?.message === 'string'
      ? body.message
      : response.status === 403
        ? 'Somente o responsável pela empresa pode gerenciar os membros.'
        : 'Não foi possível concluir esta ação. Tente novamente.';
    throw new Error(message);
  }
  return body;
}

function isPending(status: string) {
  return ['pendente', 'convidado', 'pending'].includes(status.toLowerCase());
}

function isRevoked(status: string) {
  return ['revogado', 'revogada', 'revoked'].includes(status.toLowerCase());
}

function WorkAccessEditor({
  obras,
  value,
  onChange,
}: {
  obras: Obra[];
  value: MembroObra[];
  onChange: (next: MembroObra[]) => void;
}) {
  const selectedIds = new Set(value.map((obra) => obra.obraId));
  const allSelected = obras.length === 0 || obras.every((obra) => selectedIds.has(obra.id));

  function toggleAll(checked: boolean) {
    onChange(checked ? obras.map((obra) => ({
      obraId: obra.id,
      permissao: value.find((item) => item.obraId === obra.id)?.permissao ?? 'visualizar',
    })) : []);
  }

  function toggleWork(obra: Obra, checked: boolean) {
    const existing = value.find((item) => item.obraId === obra.id);
    onChange(checked
      ? [...value.filter((item) => item.obraId !== obra.id), { obraId: obra.id, permissao: existing?.permissao ?? 'visualizar' }]
      : value.filter((item) => item.obraId !== obra.id));
  }

  function setPermission(obraId: string, permissao: Permissao) {
    onChange(value.map((item) => item.obraId === obraId ? { ...item, permissao } : item));
  }

  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-sm font-semibold">Acesso às obras</legend>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
        <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleAll(checked === true)} aria-label="Selecionar todas as obras" />
        <span><span className="block font-medium">Todas as obras disponíveis</span><span className="text-xs text-muted-foreground">Seleciona todas as obras listadas abaixo.</span></span>
      </label>
      {obras.length > 0 && (
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border p-2">
          {obras.map((obra) => {
            const item = value.find((entry) => entry.obraId === obra.id);
            return (
              <div key={obra.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-sm">
                  <Checkbox checked={Boolean(item)} onCheckedChange={(checked) => toggleWork(obra, checked === true)} />
                  <span className="truncate">{obra.nome}</span>
                </label>
                {item && (
                  <select
                    aria-label={`Permissão para ${obra.nome}`}
                    value={item.permissao}
                    onChange={(event) => setPermission(obra.id, event.target.value as Permissao)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="visualizar">Visualizar</option>
                    <option value="editar">Editar</option>
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}
      {obras.length === 0 && <p className="text-xs text-muted-foreground">Ainda não há obras disponíveis. O convite poderá ser criado sem uma obra vinculada.</p>}
    </fieldset>
  );
}

export function XGestaoEquipeView() {
  const [data, setData] = useState<EquipeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Membro | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await apiRequest('/api/xgestao/membros') as {
        rows: Membro[];
        obras: Array<Obra | { obraId: string; nome: string }>;
      };
      setData({
        rows: result.rows,
        obras: result.obras.map((obra) => ({
          id: 'id' in obra ? obra.id : obra.obraId,
          nome: obra.nome,
        })),
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar a equipe.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeCount = useMemo(
    () => data?.rows.filter((member) => !isPending(member.status) && !isRevoked(member.status)).length ?? 0,
    [data],
  );

  function openInvite() {
    setEditing(null);
    setForm(blankForm());
    setFormError('');
    setFormOpen(true);
  }

  function openEdit(member: Membro) {
    setEditing(member);
    setForm({
      nome: member.nome,
      email: member.email,
      papel: member.papel === 'gestor' ? 'gestor' : 'colaborador',
      obras: member.obras.map((obra) => ({ ...obra })),
    });
    setFormError('');
    setFormOpen(true);
  }

  async function saveMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!editing && (!form.nome.trim() || !form.email.trim())) {
      setFormError('Informe o nome e o e-mail da pessoa.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await apiRequest(`/api/xgestao/membros/${encodeURIComponent(editing.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ papel: form.papel, obras: form.obras }),
        });
      } else {
        await apiRequest('/api/xgestao/membros', {
          method: 'POST',
          body: JSON.stringify({ nome: form.nome.trim(), email: form.email.trim(), papel: form.papel, obras: form.obras }),
        });
      }
      setFormOpen(false);
      await load();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  async function runMemberAction(member: Membro, action: 'reenviar' | 'revogar') {
    setPendingAction(`${member.id}:${action}`);
    setActionError('');
    try {
      if (action === 'revogar') {
        const confirmed = window.confirm(`Revogar o acesso de ${member.nome}?`);
        if (!confirmed) return;
        await apiRequest(`/api/xgestao/membros/${encodeURIComponent(member.id)}`, { method: 'DELETE' });
      } else {
        await apiRequest(`/api/xgestao/membros/${encodeURIComponent(member.id)}/reenviar`, { method: 'POST', body: '{}' });
      }
      await load();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível concluir a ação.');
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="min-h-full space-y-6 p-5 sm:p-6 md:p-10" data-testid="xgestao-equipe-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><RiTeamLine className="size-4" /> Empresa</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">Equipe</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Convide pessoas para acessar as obras da empresa e gerencie suas permissões.</p>
        </div>
        <Button onClick={openInvite} disabled={loading || Boolean(loadError)}><RiAddLine /> Convidar pessoa</Button>
      </div>

      {actionError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{actionError}</p>}

      {loading ? (
        <div className="space-y-3" aria-label="Carregando equipe" aria-busy="true">
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-24 rounded-xl" />)}
        </div>
      ) : loadError ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-8">
            <p role="alert" className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" onClick={() => void load()}><RiRefreshLine /> Tentar novamente</Button>
          </CardContent>
        </Card>
      ) : data?.rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <span className="mb-4 rounded-full bg-primary/10 p-4 text-primary"><RiShieldUserLine className="size-7" /></span>
            <h2 className="text-lg font-semibold">Sua equipe começa aqui</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">Convide sócios e colaboradores para trabalharem nas obras com acessos definidos por você.</p>
            <Button className="mt-5" onClick={openInvite}><RiAddLine /> Convidar primeira pessoa</Button>
          </CardContent>
        </Card>
      ) : (
        <section aria-labelledby="team-list-title" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="team-list-title" className="text-sm font-semibold text-muted-foreground">
              {data?.rows.length ?? 0} {data?.rows.length === 1 ? 'pessoa na equipe' : 'pessoas na equipe'} · {activeCount} ativos
            </h2>
            <Button variant="outline" size="sm" onClick={() => void load()}><RiRefreshLine /> Atualizar lista</Button>
          </div>
          {data?.rows.map((member) => {
            const status = member.status.toLowerCase();
            const busy = pendingAction?.startsWith(`${member.id}:`) ?? false;
            return (
              <Card key={member.id} className={isRevoked(member.status) ? 'opacity-75' : ''}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">{member.nome}</h3>
                      <Badge variant="outline" className={STATUS_STYLE[status] ?? 'bg-muted text-muted-foreground'}>
                        {STATUS_LABEL[status] ?? member.status}
                      </Badge>
                    </div>
                    <p className="mt-1 break-all text-sm text-muted-foreground">{member.email}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {ROLE_LABEL[member.papel] ?? member.papel} · {member.obras.length ? `${member.obras.length} ${member.obras.length === 1 ? 'obra vinculada' : 'obras vinculadas'}` : 'sem obras vinculadas'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {!isRevoked(member.status) && (
                      <Button variant="outline" size="sm" onClick={() => openEdit(member)} disabled={busy}>
                        <RiEditLine /> Permissões
                      </Button>
                    )}
                    {isPending(member.status) && (
                      <Button variant="outline" size="sm" onClick={() => void runMemberAction(member, 'reenviar')} disabled={busy}>
                        <RiMailSendLine /> {pendingAction === `${member.id}:reenviar` ? 'Reenviando…' : 'Reenviar convite'}
                      </Button>
                    )}
                    {!isRevoked(member.status) && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => void runMemberAction(member, 'revogar')} disabled={busy}>
                        <RiUserForbidLine /> Revogar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => { if (!saving) setFormOpen(open); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Permissões de ${editing.nome}` : 'Convidar pessoa'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Atualize o papel e as obras que esta pessoa pode acessar.' : 'A pessoa receberá um convite para acessar a empresa.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveMember} className="space-y-5">
            {!editing && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="member-name">Nome</Label>
                  <Input id="member-name" value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} autoComplete="name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="member-email">E-mail</Label>
                  <Input id="member-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" required />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="member-role">Papel</Label>
              <select
                id="member-role"
                value={form.papel}
                onChange={(event) => setForm((current) => ({ ...current, papel: event.target.value as Papel }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="gestor">Gestor</option>
                <option value="colaborador">Colaborador</option>
              </select>
            </div>
            {data && <WorkAccessEditor obras={data.obras} value={form.obras} onChange={(obras) => setForm((current) => ({ ...current, obras }))} />}
            {formError && <p role="alert" className="rounded-md bg-destructive/5 p-2 text-sm text-destructive">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : editing ? 'Salvar permissões' : 'Enviar convite'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}