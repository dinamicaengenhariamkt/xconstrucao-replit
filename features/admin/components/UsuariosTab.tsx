'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Badge } from '@shared/components/ui/badge';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@shared/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@shared/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@shared/components/ui/table';
import { useToast } from '@shared/hooks/use-toast';
import { apiRequest } from '@shared/lib/queryClient';
import { useUser } from '@features/auth/store/auth-store';
import {
  RiUserAddLine, RiKeyLine, RiUserUnfollowLine, RiUserFollowLine,
  RiEyeLine, RiCheckLine, RiFileCopyLine, RiSearchLine, RiEditLine,
  RiArrowLeftSLine, RiArrowRightSLine,
} from 'react-icons/ri';

type Role = 'superadmin' | 'admin' | 'contratante' | 'empreiteiro';
type SenhaModo = 'manual' | 'random' | 'link';
type AtivoFilter = 'all' | 'true' | 'false';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  ativo: boolean;
  mustChangePassword: boolean;
  emailVerified: string | null;
  createdAt: string;
}

interface ListResponse { rows: UserRow[]; total: number; page: number; pageSize: number; }

const ROLE_LABEL: Record<Role, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  contratante: 'Contratante',
  empreiteiro: 'Empreiteiro',
};

const PAGE_SIZE = 20;

export function UsuariosTab() {
  const me = useUser();
  const isSuper = me?.role === 'superadmin';
  const { toast } = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [ativoFilter, setAtivoFilter] = useState<AtivoFilter>('all');
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (roleFilter !== 'all') params.set('role', roleFilter);
  if (ativoFilter !== 'all') params.set('ativo', ativoFilter);
  params.set('page', String(page));
  params.set('pageSize', String(PAGE_SIZE));

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ['/api/admin/usuarios', { q, roleFilter, ativoFilter, page }],
    queryFn: async () => {
      const r = await fetch(`/api/admin/usuarios?${params.toString()}`, { credentials: 'include', cache: 'no-store' });
      if (!r.ok) throw new Error('Falha ao carregar usuários');
      return r.json();
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) =>
      apiRequest('POST', `/api/admin/usuarios/${id}/ativo`, { ativo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      toast({ title: 'Status atualizado' });
    },
    onError: (e: unknown) => toast({ title: 'Erro', description: e instanceof Error ? e.message : '', variant: 'destructive' }),
  });

  const impersonate = useMutation({
    mutationFn: async (id: string) => apiRequest('POST', `/api/admin/impersonate/${id}`, {}),
    onSuccess: async (res) => {
      const data = await res.json();
      toast({ title: 'Modo "Ver como" ativado', description: 'Você está visualizando em modo somente leitura.' });
      const role = data?.target?.role as Role | undefined;
      const dest =
        role === 'empreiteiro' ? '/empreiteiro/dashboard'
        : role === 'admin' || role === 'superadmin' ? '/admin/financeiro'
        : '/contratante/dashboard';
      window.location.href = dest;
    },
    onError: (e: unknown) => toast({ title: 'Erro', description: e instanceof Error ? e.message : '', variant: 'destructive' }),
  });

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou email"
            className="pl-9"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            data-testid="input-search-usuarios"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as 'all' | Role); setPage(1); }}>
          <SelectTrigger className="w-[180px]" data-testid="select-role-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os perfis</SelectItem>
            {isSuper && <SelectItem value="superadmin">Super Admin</SelectItem>}
            {isSuper && <SelectItem value="admin">Admin</SelectItem>}
            <SelectItem value="contratante">Contratante</SelectItem>
            <SelectItem value="empreiteiro">Empreiteiro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ativoFilter} onValueChange={(v) => { setAtivoFilter(v as AtivoFilter); setPage(1); }}>
          <SelectTrigger className="w-[160px]" data-testid="select-ativo-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="true">Apenas ativos</SelectItem>
            <SelectItem value="false">Apenas inativos</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-user"><RiUserAddLine className="mr-2" />Novo usuário</Button>
          </DialogTrigger>
          <NewUserDialog isSuper={isSuper} onClose={() => setOpenCreate(false)} />
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={5}>Carregando…</TableCell></TableRow>
              )}
              {!isLoading && rows.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</TableCell></TableRow>
              )}
              {rows.map((u) => {
                const canManage = isSuper || (u.role === 'contratante' || u.role === 'empreiteiro');
                const canImpersonate = isSuper && u.role !== 'superadmin' && u.ativo;
                return (
                  <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge variant="secondary">{ROLE_LABEL[u.role]}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={u.ativo ? 'default' : 'destructive'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge>
                        {u.mustChangePassword && (
                          <Badge variant="outline" className="text-amber-700 border-amber-200">Trocar senha</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canImpersonate && (
                          <Button size="sm" variant="ghost" onClick={() => impersonate.mutate(u.id)} title="Ver como" data-testid={`button-impersonate-${u.id}`}>
                            <RiEyeLine />
                          </Button>
                        )}
                        {canManage && (
                          <Button size="sm" variant="ghost" onClick={() => setEditTarget(u)} title="Editar" data-testid={`button-edit-${u.id}`}>
                            <RiEditLine />
                          </Button>
                        )}
                        {canManage && (
                          <Button size="sm" variant="ghost" onClick={() => setResetTarget(u)} title="Resetar senha" data-testid={`button-reset-${u.id}`}>
                            <RiKeyLine />
                          </Button>
                        )}
                        {canManage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleAtivo.mutate({ id: u.id, ativo: !u.ativo })}
                            title={u.ativo ? 'Desativar' : 'Ativar'}
                            data-testid={`button-toggle-${u.id}`}
                          >
                            {u.ativo ? <RiUserUnfollowLine /> : <RiUserFollowLine />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground" data-testid="text-pagination-info">
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              data-testid="button-prev-page"
            >
              <RiArrowLeftSLine />
            </Button>
            <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              data-testid="button-next-page"
            >
              <RiArrowRightSLine />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        {resetTarget && <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(null)} />}
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        {editTarget && <EditUserDialog user={editTarget} isSuper={isSuper} onClose={() => setEditTarget(null)} />}
      </Dialog>
    </div>
  );
}

/* ─────────────── Dialog: Novo usuário ─────────────── */

function NewUserDialog({ isSuper, onClose }: { isSuper: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('contratante');
  const [phone, setPhone] = useState('');
  const [senhaModo, setSenhaModo] = useState<SenhaModo>('link');
  const [senhaManual, setSenhaManual] = useState('');
  const [result, setResult] = useState<{ passwordPlain: string | null; setupUrl: string | null } | null>(null);

  const create = useMutation({
    mutationFn: async () => apiRequest('POST', '/api/admin/usuarios', {
      name, email, role, phone: phone || null, senhaModo, senhaManual: senhaManual || undefined,
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      setResult({ passwordPlain: data.passwordPlain, setupUrl: data.setupUrl });
      toast({ title: 'Usuário criado' });
    },
    onError: (e: unknown) => toast({ title: 'Erro', description: e instanceof Error ? e.message : '', variant: 'destructive' }),
  });

  if (result) {
    return (
      <DialogContent>
        <DialogHeader><DialogTitle>Usuário criado com sucesso</DialogTitle></DialogHeader>
        <CredentialBlock passwordPlain={result.passwordPlain} setupUrl={result.setupUrl} />
        <DialogFooter>
          <Button onClick={onClose} data-testid="button-close-result">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Nome completo</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-create-name" /></div>
        <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-create-email" /></div>
        <div>
          <Label>Perfil</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger data-testid="select-create-role"><SelectValue /></SelectTrigger>
            <SelectContent>
              {isSuper && <SelectItem value="superadmin">Super Admin</SelectItem>}
              {isSuper && <SelectItem value="admin">Admin</SelectItem>}
              <SelectItem value="contratante">Contratante</SelectItem>
              <SelectItem value="empreiteiro">Empreiteiro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Telefone (opcional)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div>
          <Label>Como definir a senha</Label>
          <Select value={senhaModo} onValueChange={(v) => setSenhaModo(v as SenhaModo)}>
            <SelectTrigger data-testid="select-senha-modo"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="link">Enviar link por e-mail (recomendado)</SelectItem>
              <SelectItem value="random">Gerar senha aleatória</SelectItem>
              <SelectItem value="manual">Definir senha manualmente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {senhaModo === 'manual' && (
          <div>
            <Label>Senha temporária</Label>
            <Input type="text" value={senhaManual} onChange={(e) => setSenhaManual(e.target.value)} placeholder="Min 8 chars, 3 categorias" data-testid="input-senha-manual" />
            <p className="text-xs text-muted-foreground mt-1">O usuário será obrigado a trocar no 1º login.</p>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => create.mutate()} disabled={create.isPending} data-testid="button-confirm-create">
          {create.isPending ? 'Criando…' : 'Criar usuário'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ─────────────── Dialog: Editar usuário ─────────────── */

function EditUserDialog({ user, isSuper, onClose }: { user: UserRow; isSuper: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [role, setRole] = useState<Role>(user.role);

  const save = useMutation({
    mutationFn: async () => apiRequest('PATCH', `/api/admin/usuarios/${user.id}`, {
      name,
      phone: phone || null,
      ...(isSuper ? { role } : {}),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/usuarios'] });
      toast({ title: 'Usuário atualizado' });
      onClose();
    },
    onError: (e: unknown) => toast({ title: 'Erro', description: e instanceof Error ? e.message : '', variant: 'destructive' }),
  });

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Editar {user.name}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Email (não editável)</Label><Input value={user.email} disabled /></div>
        <div><Label>Nome completo</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-edit-name" /></div>
        <div><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-edit-phone" /></div>
        {isSuper && (
          <div>
            <Label>Perfil</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger data-testid="select-edit-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="contratante">Contratante</SelectItem>
                <SelectItem value="empreiteiro">Empreiteiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending} data-testid="button-save-edit">
          {save.isPending ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ─────────────── Dialog: Reset password ─────────────── */

function ResetPasswordDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const { toast } = useToast();
  const [senhaModo, setSenhaModo] = useState<SenhaModo>('link');
  const [senhaManual, setSenhaManual] = useState('');
  const [result, setResult] = useState<{ passwordPlain: string | null; setupUrl: string | null } | null>(null);

  const reset = useMutation({
    mutationFn: async () => apiRequest('POST', `/api/admin/usuarios/${user.id}/reset-password`, {
      senhaModo, senhaManual: senhaManual || undefined,
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      setResult({ passwordPlain: data.passwordPlain, setupUrl: data.setupUrl });
      toast({ title: 'Senha resetada' });
    },
    onError: (e: unknown) => toast({ title: 'Erro', description: e instanceof Error ? e.message : '', variant: 'destructive' }),
  });

  if (result) {
    return (
      <DialogContent>
        <DialogHeader><DialogTitle>Senha resetada para {user.name}</DialogTitle></DialogHeader>
        <CredentialBlock passwordPlain={result.passwordPlain} setupUrl={result.setupUrl} />
        <DialogFooter><Button onClick={onClose}>Fechar</Button></DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Resetar senha de {user.name}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Modo</Label>
          <Select value={senhaModo} onValueChange={(v) => setSenhaModo(v as SenhaModo)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="link">Enviar link por e-mail</SelectItem>
              <SelectItem value="random">Gerar senha aleatória</SelectItem>
              <SelectItem value="manual">Definir manualmente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {senhaModo === 'manual' && (
          <div>
            <Label>Nova senha temporária</Label>
            <Input value={senhaManual} onChange={(e) => setSenhaManual(e.target.value)} />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => reset.mutate()} disabled={reset.isPending}>
          {reset.isPending ? 'Resetando…' : 'Resetar senha'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CredentialBlock({ passwordPlain, setupUrl }: { passwordPlain: string | null; setupUrl: string | null }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      toast({ title: 'Copiado!' });
      setTimeout(() => setCopied(null), 1500);
    });
  };
  return (
    <div className="space-y-3">
      {passwordPlain && (
        <div className="rounded-md border p-3 bg-amber-50 dark:bg-amber-950/30">
          <div className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">Senha temporária (mostrada uma única vez)</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all text-sm">{passwordPlain}</code>
            <Button size="sm" variant="outline" onClick={() => copy(passwordPlain, 'pwd')} data-testid="button-copy-password">
              {copied === 'pwd' ? <RiCheckLine /> : <RiFileCopyLine />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">O usuário será obrigado a trocá-la no 1º login.</p>
        </div>
      )}
      {setupUrl && (
        <div className="rounded-md border p-3 bg-slate-50 dark:bg-slate-900/40">
          <div className="text-xs font-medium mb-1">Link de definição de senha (válido por 24h)</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all text-xs">{setupUrl}</code>
            <Button size="sm" variant="outline" onClick={() => copy(setupUrl, 'url')} data-testid="button-copy-setup-url">
              {copied === 'url' ? <RiCheckLine /> : <RiFileCopyLine />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Também enviado por e-mail.</p>
        </div>
      )}
    </div>
  );
}
