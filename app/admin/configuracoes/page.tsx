'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  RiSettings3Line,
  RiBellLine,
  RiToggleLine,
  RiShieldLine,
  RiPlugLine,
  RiSave3Line,
  RiFileCopyLine,
  RiRefreshLine,
  RiGlobalLine,
  RiTimeLine,
  RiLockPasswordLine,
  RiExternalLinkLine,
  RiComputerLine,
  RiSmartphoneLine,
  RiCheckLine,
  RiAlertLine,
  RiUser3Line,
  RiTeamLine,
} from 'react-icons/ri';
import { UsuariosTab } from '@features/admin/components/UsuariosTab';
import { useUser } from '@features/auth/store/auth-store';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { Switch } from '@shared/components/ui/switch';
import { Label } from '@shared/components/ui/label';
import { Separator } from '@shared/components/ui/separator';
import { Badge } from '@shared/components/ui/badge';
import { Checkbox } from '@shared/components/ui/checkbox';
import { cn } from '@shared/lib/utils';
import { useToast } from '@shared/hooks/use-toast';
import { useAdminConfig, useUpdateAdminConfig } from '@features/admin/hooks/use-admin-config';
import { useSessoes, useRevokeSessao, usePreferencias, useUpdatePreferencias } from '@features/perfil/hooks/use-preferencias';
import { usePerfilAdmin, useUpdatePerfilAdmin } from '@features/perfil/hooks/use-perfil';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { useUpload } from '@features/shared/hooks/use-uploads';
import { RiUploadCloud2Line, RiLoader4Line } from 'react-icons/ri';
import { formatPhone, unformatPhone, isPhoneValid } from '@shared/lib/masks';
import { IDIOMA_OPTIONS, TIMEZONE_OPTIONS } from '@features/perfil/constants';

/* ── Types ── */
type Section = 'perfil' | 'usuarios' | 'geral' | 'notificacoes' | 'plataforma' | 'seguranca' | 'integracoes';

const VALID_SECTIONS: Section[] = ['perfil', 'usuarios', 'geral', 'notificacoes', 'plataforma', 'seguranca', 'integracoes'];

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'perfil',       label: 'Perfil',          icon: RiUser3Line },
  { id: 'usuarios',     label: 'Usuários',        icon: RiTeamLine },
  { id: 'geral',        label: 'Geral',           icon: RiSettings3Line },
  { id: 'notificacoes', label: 'Notificações',    icon: RiBellLine },
  { id: 'plataforma',   label: 'Plataforma',      icon: RiToggleLine },
  { id: 'seguranca',    label: 'Segurança',       icon: RiShieldLine },
  { id: 'integracoes',  label: 'Integrações',     icon: RiPlugLine },
];

/* ── Helpers ── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
      {children}
    </p>
  );
}

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
  danger,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100')}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Perfil
───────────────────────────────────────────── */
function SecaoPerfil() {
  const { toast } = useToast();
  const { data: perfil, isLoading } = usePerfilAdmin();
  const { mutateAsync: updatePerfil, isPending: saving } = useUpdatePerfilAdmin();

  const [dados, setDados] = useState({
    nome: '',
    email: '',
    telefone: '',
    bio: '',
    idioma: 'pt-BR',
    timezone: 'America/Sao_Paulo',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (perfil) {
      setDados({
        nome: perfil.name ?? '',
        email: perfil.email ?? '',
        telefone: perfil.phone ?? '',
        bio: perfil.bio ?? '',
        idioma: perfil.idioma || 'pt-BR',
        timezone: perfil.timezone || 'America/Sao_Paulo',
      });
      setAvatarUrl(perfil.avatarUrl ?? null);
    }
  }, [perfil]);

  const [senha, setSenha] = useState({
    atual: '',
    nova: '',
    confirmar: '',
  });

  const senhaError = senha.nova && senha.confirmar && senha.nova !== senha.confirmar;
  const senhaValida = senha.atual && senha.nova && senha.confirmar && !senhaError;

  const setDado = (key: keyof typeof dados) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDados((prev) => ({ ...prev, [key]: e.target.value }));

  const setSenhaField = (key: keyof typeof senha) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSenha((prev) => ({ ...prev, [key]: e.target.value }));

  const { upload: uploadAvatarFile, pending: avatarUploading, progress: avatarProgress } = useUpload();
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadAvatarFile({ file, kind: 'avatar' });
      const url = result.publicUrl ?? null;
      setAvatarUrl(url);
      await updatePerfil({ avatarUrl: url });
      toast({ title: 'Foto atualizada', description: 'Sua foto de perfil foi salva.' });
    } catch (err) {
      toast({
        title: 'Erro ao enviar foto',
        description: err instanceof Error ? err.message : 'Tente um arquivo menor.',
        variant: 'destructive',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveDados = async () => {
    if (dados.telefone && !isPhoneValid(dados.telefone)) {
      toast({ title: 'Telefone inválido', description: 'Informe DDD + número completo.', variant: 'destructive' });
      return;
    }
    try {
      await updatePerfil({
        name: dados.nome,
        phone: dados.telefone ? unformatPhone(dados.telefone) : null,
        bio: dados.bio.trim() || null,
        idioma: dados.idioma,
        timezone: dados.timezone,
      });
      toast({ title: 'Dados salvos', description: 'Suas informações pessoais foram atualizadas.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' });
    }
  };

  const [senhaLoading, setSenhaLoading] = useState(false);
  const handleAlterarSenha = async () => {
    if (!senhaValida) return;
    setSenhaLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: senha.atual,
          newPassword: senha.nova,
          confirmPassword: senha.confirmar,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: 'Não foi possível alterar a senha',
          description: data.message ?? 'Tente novamente.',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Senha alterada', description: data.message ?? 'Sua senha foi atualizada com sucesso.' });
      setSenha({ atual: '', nova: '', confirmar: '' });
    } catch {
      toast({ title: 'Erro de rede', description: 'Não foi possível contatar o servidor.', variant: 'destructive' });
    } finally {
      setSenhaLoading(false);
    }
  };

  if (isLoading || !perfil) {
    return <div className="flex flex-col gap-4"><Skeleton className="h-72 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  const initials = (dados.nome || dados.email || 'A')
    .split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      {/* Dados pessoais */}
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Dados pessoais</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20" data-testid="avatar-perfil-admin">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={dados.nome || 'avatar'} />}
              <AvatarFallback className="bg-primary text-white text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <label
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-fit"
                data-testid="button-upload-avatar"
              >
                {avatarUploading ? (
                  <RiLoader4Line className="w-4 h-4 animate-spin" />
                ) : (
                  <RiUploadCloud2Line className="w-4 h-4" />
                )}
                {avatarUploading ? `Enviando... ${avatarProgress}%` : 'Enviar foto'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                  data-testid="input-avatar-file"
                  disabled={avatarUploading}
                />
              </label>
              <p className="text-xs text-muted-foreground">JPG, PNG ou WebP até 2 MB.</p>
            </div>
          </div>
          <FieldRow label="Nome completo">
            <Input value={dados.nome} onChange={setDado('nome')} placeholder="Seu nome completo" data-testid="input-perfil-nome" />
          </FieldRow>
          <FieldRow label="E-mail" description="Usado para login. Contate o suporte para alterar.">
            <Input type="email" value={dados.email} disabled className="opacity-60 cursor-not-allowed" data-testid="input-perfil-email" />
          </FieldRow>
          <FieldRow label="Telefone" description="Número de contato para suporte e autenticação.">
            <Input
              type="tel"
              value={formatPhone(dados.telefone)}
              onChange={(e) => setDados((p) => ({ ...p, telefone: unformatPhone(e.target.value) }))}
              placeholder="(11) 90000-0000"
              data-testid="input-perfil-telefone"
            />
          </FieldRow>
          <FieldRow label="Bio" description="Apresentação curta sobre você (até 400 caracteres).">
            <Textarea
              value={dados.bio}
              onChange={(e) => setDados((p) => ({ ...p, bio: e.target.value }))}
              maxLength={400}
              rows={3}
              placeholder="Conte um pouco sobre você..."
              className="resize-none"
              data-testid="input-perfil-bio"
            />
            <p className="text-xs text-muted-foreground text-right">{dados.bio.length}/400</p>
          </FieldRow>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="Idioma">
              <SelectField
                value={dados.idioma}
                onChange={(v) => setDados((p) => ({ ...p, idioma: v }))}
                options={IDIOMA_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              />
            </FieldRow>
            <FieldRow label="Fuso horário">
              <SelectField
                value={dados.timezone}
                onChange={(v) => setDados((p) => ({ ...p, timezone: v }))}
                options={TIMEZONE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              />
            </FieldRow>
          </div>
          <FieldRow label="Cargo" description="Definido pelo sistema. Contate o suporte para alterar.">
            <Input value="Administrador" disabled className="opacity-60 cursor-not-allowed" />
          </FieldRow>
          <div className="flex justify-end">
            <Button onClick={handleSaveDados} disabled={saving} data-testid="button-salvar-perfil">
              <RiSave3Line className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar dados'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Segurança da conta */}
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Segurança da conta</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <FieldRow label="Senha atual">
            <Input
              type="password"
              value={senha.atual}
              onChange={setSenhaField('atual')}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </FieldRow>
          <FieldRow label="Nova senha" description="Mínimo de 8 caracteres.">
            <Input
              type="password"
              value={senha.nova}
              onChange={setSenhaField('nova')}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </FieldRow>
          <FieldRow label="Confirmar nova senha">
            <Input
              type="password"
              value={senha.confirmar}
              onChange={setSenhaField('confirmar')}
              placeholder="••••••••"
              autoComplete="new-password"
              className={cn(senhaError ? 'border-red-400 focus-visible:ring-red-400' : '')}
            />
            {senhaError && (
              <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
            )}
          </FieldRow>
          <div className="flex justify-end">
            <button
              onClick={handleAlterarSenha}
              disabled={!senhaValida}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RiLockPasswordLine className="w-4 h-4" />
              Alterar senha
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Geral
───────────────────────────────────────────── */
const GERAL_DEFAULTS = {
  nome: 'XConstrução',
  descricao: 'Plataforma de gestão de obras e conexão entre contratantes e empreiteiras.',
  email: 'suporte@xconstrucao.com.br',
  cnpj: '12.345.678/0001-99',
  timezone: 'America/Sao_Paulo',
  idioma: 'pt-BR',
};

function SecaoGeral() {
  const { toast } = useToast();
  const { data: config, isLoading } = useAdminConfig();
  const { mutateAsync: updateConfig, isPending: saving } = useUpdateAdminConfig();
  const [form, setForm] = useState(GERAL_DEFAULTS);

  useEffect(() => {
    if (config?.geral) {
      setForm({ ...GERAL_DEFAULTS, ...(config.geral as typeof GERAL_DEFAULTS) });
    }
  }, [config]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      await updateConfig({ chave: 'geral', valor: form });
      toast({ title: 'Alterações salvas', description: 'As configurações gerais foram atualizadas.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar configurações.', variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>;

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Informações da plataforma</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <FieldRow label="Nome da plataforma">
            <Input value={form.nome} onChange={set('nome')} placeholder="Nome da plataforma" />
          </FieldRow>
          <FieldRow label="Descrição" description="Aparece no rodapé e em e-mails transacionais.">
            <Textarea
              value={form.descricao}
              onChange={set('descricao')}
              placeholder="Descreva a plataforma em até 200 caracteres"
              maxLength={200}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{form.descricao.length}/200</p>
          </FieldRow>
          <FieldRow label="E-mail de suporte" description="Endereço exibido nas comunicações com usuários.">
            <Input type="email" value={form.email} onChange={set('email')} placeholder="suporte@empresa.com.br" />
          </FieldRow>
          <FieldRow label="CNPJ" description="Apenas para exibição. Contate o suporte para alterar.">
            <Input value={form.cnpj} disabled className="opacity-60 cursor-not-allowed" />
          </FieldRow>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Região e idioma</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <FieldRow label="Fuso horário">
            <SelectField
              value={form.timezone}
              onChange={(v) => setForm((p) => ({ ...p, timezone: v }))}
              options={[
                { label: 'Brasília (UTC-3)', value: 'America/Sao_Paulo' },
                { label: 'Manaus (UTC-4)', value: 'America/Manaus' },
                { label: 'Belém (UTC-3)', value: 'America/Belem' },
                { label: 'Fernando de Noronha (UTC-2)', value: 'America/Noronha' },
              ]}
            />
          </FieldRow>
          <FieldRow label="Idioma">
            <SelectField
              value={form.idioma}
              onChange={(v) => setForm((p) => ({ ...p, idioma: v }))}
              options={[
                { label: 'Português (BR)', value: 'pt-BR' },
                { label: 'English (US)', value: 'en-US' },
              ]}
            />
          </FieldRow>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} data-testid="button-salvar-geral">
          <RiSave3Line className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Notificações
───────────────────────────────────────────── */
const NOTIF_PESSOAL_DEFAULTS = {
  novoCliente: true,
  novaObra: true,
  pagamento: true,
  contrato: false,
  campanhaExpirando: true,
  relatorioSemanal: false,
};

const NOTIF_PLATAFORMA_DEFAULTS = {
  manutencao: true,
  atualizacoes: true,
  alertasSeguranca: true,
};

function SecaoNotificacoes() {
  const { toast } = useToast();
  const { data: config, isLoading: loadingPlat } = useAdminConfig();
  const { data: prefs, isLoading: loadingPess } = usePreferencias();
  const { mutateAsync: updateConfig, isPending: savingPlat } = useUpdateAdminConfig();
  const { mutateAsync: updatePrefs, isPending: savingPess } = useUpdatePreferencias();

  const [pessoal, setPessoal] = useState<Record<string, boolean>>(NOTIF_PESSOAL_DEFAULTS);
  const [plataforma, setPlataforma] = useState<Record<string, boolean>>(NOTIF_PLATAFORMA_DEFAULTS);

  useEffect(() => {
    if (prefs?.notificacoes) {
      setPessoal({ ...NOTIF_PESSOAL_DEFAULTS, ...(prefs.notificacoes as Record<string, boolean>) });
    }
  }, [prefs]);

  useEffect(() => {
    if (config?.notificacoes) {
      setPlataforma({ ...NOTIF_PLATAFORMA_DEFAULTS, ...(config.notificacoes as Record<string, boolean>) });
    }
  }, [config]);

  const togglePessoal = (key: string) => (v: boolean) => setPessoal((p) => ({ ...p, [key]: v }));
  const togglePlataforma = (key: string) => (v: boolean) => setPlataforma((p) => ({ ...p, [key]: v }));

  const saving = savingPlat || savingPess;
  const isLoading = loadingPlat || loadingPess;

  const handleSave = async () => {
    try {
      await Promise.all([
        updatePrefs({ notificacoes: pessoal }),
        updateConfig({ chave: 'notificacoes', valor: plataforma }),
      ]);
      toast({ title: 'Preferências salvas', description: 'Suas notificações foram atualizadas.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar preferências.', variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>;

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <RiUser3Line className="w-4 h-4 text-gray-400" />
            <SectionTitle>Notificações pessoais</SectionTitle>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">Aplicam-se apenas à sua conta de administrador.</p>
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-0">
          <SwitchRow
            label="Novo cliente cadastrado"
            description="Receba um e-mail quando um novo cliente completar o cadastro."
            checked={pessoal.novoCliente}
            onCheckedChange={togglePessoal('novoCliente')}
          />
          <SwitchRow
            label="Nova obra criada"
            description="Notificação quando uma nova obra for cadastrada na plataforma."
            checked={pessoal.novaObra}
            onCheckedChange={togglePessoal('novaObra')}
          />
          <SwitchRow
            label="Pagamento recebido"
            description="Confirmação de pagamento processado com sucesso."
            checked={pessoal.pagamento}
            onCheckedChange={togglePessoal('pagamento')}
          />
          <SwitchRow
            label="Contrato assinado"
            description="Aviso quando um contrato for assinado entre as partes."
            checked={pessoal.contrato}
            onCheckedChange={togglePessoal('contrato')}
          />
          <SwitchRow
            label="Campanha de anúncio expirando"
            description="Alerta 3 dias antes do vencimento de uma campanha ativa."
            checked={pessoal.campanhaExpirando}
            onCheckedChange={togglePessoal('campanhaExpirando')}
          />
          <SwitchRow
            label="Relatório semanal automático"
            description="Resumo de métricas enviado toda segunda-feira às 8h."
            checked={pessoal.relatorioSemanal}
            onCheckedChange={togglePessoal('relatorioSemanal')}
          />
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <RiGlobalLine className="w-4 h-4 text-gray-400" />
            <SectionTitle>Notificações da plataforma</SectionTitle>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">Configurações que afetam todos os usuários da plataforma.</p>
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-0">
          <SwitchRow
            label="Alertas de manutenção"
            description="Avisos sobre janelas de manutenção programada para todos os usuários."
            checked={plataforma.manutencao}
            onCheckedChange={togglePlataforma('manutencao')}
          />
          <SwitchRow
            label="Atualizações da plataforma"
            description="Comunicar novidades e melhorias publicadas para todos os usuários."
            checked={plataforma.atualizacoes}
            onCheckedChange={togglePlataforma('atualizacoes')}
          />
          <SwitchRow
            label="Alertas de segurança"
            description="Avisos críticos de segurança enviados a todos os usuários."
            checked={plataforma.alertasSeguranca}
            onCheckedChange={togglePlataforma('alertasSeguranca')}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} data-testid="button-salvar-notificacoes">
          <RiSave3Line className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar preferências'}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Plataforma
───────────────────────────────────────────── */


const PLATAFORMA_DEFAULTS = {
  anuncios: true,
  faq: true,
  empreiteiras: true,
  clienteLogin: true,
  manutencao: false,
  relatorios: false,
};

function SecaoPlataforma() {
  const { toast } = useToast();
  const { data: config, isLoading } = useAdminConfig();
  const { mutateAsync: updateConfig, isPending: saving } = useUpdateAdminConfig();
  const [features, setFeatures] = useState<Record<string, boolean>>(PLATAFORMA_DEFAULTS);

  useEffect(() => {
    if (config?.plataforma) {
      setFeatures({ ...PLATAFORMA_DEFAULTS, ...(config.plataforma as Record<string, boolean>) });
    }
  }, [config]);

  const toggle = (key: string) => (v: boolean) =>
    setFeatures((p) => ({ ...p, [key]: v }));

  const handleSave = async () => {
    try {
      await updateConfig({ chave: 'plataforma', valor: features });
      toast({ title: 'Configurações salvas', description: 'As funcionalidades da plataforma foram atualizadas.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar configurações.', variant: 'destructive' });
    }
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Módulos e funcionalidades</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-0">
          <SwitchRow
            label="Módulo de Anúncios"
            description="Ativa exibição de anúncios e campanhas na plataforma."
            checked={features.anuncios}
            onCheckedChange={toggle('anuncios')}
          />
          <SwitchRow
            label="Módulo de FAQ"
            description="Permite acesso à central de ajuda pelos usuários."
            checked={features.faq}
            onCheckedChange={toggle('faq')}
          />
          <SwitchRow
            label="Cadastro de empreiteiras"
            description="Habilita o cadastro e acesso de novas empreiteiras."
            checked={features.empreiteiras}
            onCheckedChange={toggle('empreiteiras')}
          />
          <SwitchRow
            label="Acesso de clientes"
            description="Permite login e uso da plataforma pelos clientes contratantes."
            checked={features.clienteLogin}
            onCheckedChange={toggle('clienteLogin')}
          />
          <SwitchRow
            label="Relatórios exportáveis"
            description="Permite exportar dados em CSV e PDF pela interface."
            checked={features.relatorios}
            onCheckedChange={toggle('relatorios')}
          />
          <SwitchRow
            label="Modo manutenção"
            description="Exibe tela de manutenção para todos os usuários finais."
            checked={features.manutencao}
            onCheckedChange={toggle('manutencao')}
            danger
          />
          {features.manutencao && (
            <div className="mt-3 flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
              <RiAlertLine className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">
                O modo manutenção está ativo. Todos os usuários (exceto admins) verão a tela de manutenção ao tentar acessar a plataforma.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} data-testid="button-salvar-plataforma">
          <RiSave3Line className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Segurança
───────────────────────────────────────────── */

function SecaoSeguranca() {
  const { toast } = useToast();
  const { data: config, isLoading } = useAdminConfig();
  const { mutateAsync: updateConfig, isPending: saving } = useUpdateAdminConfig();
  const [politica, setPolitica] = useState({
    timeout: '30',
    maxTentativas: '5',
    senhaMinima: '8',
  });
  const [doisFatores, setDoisFatores] = useState({
    admins: false,
    todos: false,
  });

  useEffect(() => {
    const seg = (config?.seguranca ?? {}) as Record<string, unknown>;
    if (Object.keys(seg).length === 0) return;
    setPolitica({
      timeout: String(seg.timeout ?? '30'),
      maxTentativas: String(seg.maxTentativas ?? '5'),
      senhaMinima: String(seg.senhaMinima ?? '8'),
    });
    setDoisFatores({
      admins: Boolean(seg.doisFatoresAdmins ?? false),
      todos: Boolean(seg.doisFatoresTodos ?? false),
    });
  }, [config]);

  const handleSave = async () => {
    try {
      await updateConfig({
        chave: 'seguranca',
        valor: {
          timeout: politica.timeout,
          maxTentativas: politica.maxTentativas,
          senhaMinima: politica.senhaMinima,
          doisFatoresAdmins: doisFatores.admins,
          doisFatoresTodos: doisFatores.todos,
        },
      });
      toast({ title: 'Políticas atualizadas', description: 'As configurações de segurança foram salvas.' });
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: err instanceof Error ? err.message : 'Tente novamente.', variant: 'destructive' });
    }
  };

  const doisFatoresAtivo = doisFatores.admins || doisFatores.todos;

  if (isLoading) {
    return <div className="flex flex-col gap-6"><Skeleton className="h-64 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <RiTimeLine className="w-4 h-4 text-gray-400" />
            <SectionTitle>Política de acesso</SectionTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <FieldRow label="Timeout de sessão" description="Tempo sem atividade até expirar a sessão do usuário.">
            <SelectField
              value={politica.timeout}
              onChange={(v) => setPolitica((p) => ({ ...p, timeout: v }))}
              options={[
                { label: '15 minutos', value: '15' },
                { label: '30 minutos', value: '30' },
                { label: '1 hora', value: '60' },
                { label: '4 horas', value: '240' },
                { label: '8 horas', value: '480' },
              ]}
            />
          </FieldRow>
          <FieldRow label="Tentativas máximas de login" description="Conta é bloqueada temporariamente após exceder este limite.">
            <SelectField
              value={politica.maxTentativas}
              onChange={(v) => setPolitica((p) => ({ ...p, maxTentativas: v }))}
              options={[
                { label: '3 tentativas', value: '3' },
                { label: '5 tentativas', value: '5' },
                { label: '10 tentativas', value: '10' },
              ]}
            />
          </FieldRow>
          <FieldRow label="Tamanho mínimo de senha" description="Exigido no cadastro e na troca de senha.">
            <SelectField
              value={politica.senhaMinima}
              onChange={(v) => setPolitica((p) => ({ ...p, senhaMinima: v }))}
              options={[
                { label: '6 caracteres', value: '6' },
                { label: '8 caracteres', value: '8' },
                { label: '10 caracteres', value: '10' },
                { label: '12 caracteres', value: '12' },
              ]}
            />
          </FieldRow>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RiLockPasswordLine className="w-4 h-4 text-gray-400" />
              <SectionTitle>Autenticação em dois fatores (2FA)</SectionTitle>
            </div>
            <Badge className={cn(
              'border-0 text-xs',
              doisFatoresAtivo
                ? 'bg-[#22846D]/10 text-[#22846D]'
                : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
            )}>
              {doisFatoresAtivo ? 'Ativo' : 'Não configurado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-0">
          <SwitchRow
            label="Exigir 2FA para admins"
            description="Todos os administradores deverão configurar o segundo fator."
            checked={doisFatores.admins}
            onCheckedChange={(v) => setDoisFatores((p) => ({ ...p, admins: v }))}
          />
          <SwitchRow
            label="Exigir 2FA para todos os usuários"
            description="Clientes e empreiteiras também precisarão do segundo fator."
            checked={doisFatores.todos}
            onCheckedChange={(v) => setDoisFatores((p) => ({ ...p, todos: v }))}
          />
        </CardContent>
      </Card>

      <SessoesAtivasCard />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} data-testid="button-salvar-seguranca">
          <RiSave3Line className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar políticas'}
        </Button>
      </div>
    </div>
  );
}

function SessoesAtivasCard() {
  const { toast } = useToast();
  const { data: sessoes, isLoading } = useSessoes();
  const { mutateAsync: revoke, isPending: revoking } = useRevokeSessao();

  const handleRevoke = async (id: string) => {
    try {
      await revoke(id);
      toast({ title: 'Sessão encerrada', description: 'A sessão remota foi encerrada com sucesso.' });
    } catch (err) {
      toast({ title: 'Erro ao encerrar sessão', description: err instanceof Error ? err.message : 'Tente novamente.', variant: 'destructive' });
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('pt-BR'); } catch { return iso; }
  };

  return (
    <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
      <CardHeader className="p-6 pb-2">
        <SectionTitle>Sessões ativas</SectionTitle>
      </CardHeader>
      <CardContent className="p-6 pt-2 flex flex-col gap-3">
        {isLoading ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : !sessoes || sessoes.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-sessoes-empty">
            Nenhuma sessão registrada no momento.
          </p>
        ) : (
          sessoes.map((session) => (
            <div
              key={session.id}
              data-testid={`row-sessao-${session.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                <RiComputerLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {session.userAgent || 'Dispositivo desconhecido'}
                  </p>
                  {session.current && (
                    <Badge className="bg-[#22846D]/10 text-[#22846D] border-0 text-xs">Sessão atual</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(session.ip || 'IP desconhecido')} · último uso {formatDate(session.lastUsedAt)}
                </p>
              </div>
              {!session.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevoke(session.id)}
                  disabled={revoking}
                  data-testid={`button-revogar-sessao-${session.id}`}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/10"
                >
                  Encerrar
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Integrações
───────────────────────────────────────────── */

const WEBHOOK_EVENTS = [
  { id: 'novo_cliente', label: 'Novo cliente cadastrado' },
  { id: 'nova_obra', label: 'Nova obra criada' },
  { id: 'pagamento_recebido', label: 'Pagamento recebido' },
  { id: 'campanha_expirada', label: 'Campanha de anúncio expirada' },
] as const;

type WebhookEventId = typeof WEBHOOK_EVENTS[number]['id'];

type ApiKeyInfo = { hasKey: boolean; last4: string | null; createdAt: string | null; lastUsedAt: string | null };

function SecaoIntegracoes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: config, isLoading } = useAdminConfig();
  const { mutateAsync: updateConfig, isPending: savingWebhook } = useUpdateAdminConfig();

  const { data: keyInfo } = useQuery<ApiKeyInfo>({
    queryKey: ['admin', 'api-key'],
    queryFn: async () => {
      const r = await fetch('/api/admin/integracoes/api-key', { credentials: 'include' });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    staleTime: 60_000,
  });

  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<Set<WebhookEventId>>(new Set());
  const [testingWebhook, setTestingWebhook] = useState(false);

  useEffect(() => {
    const integ = (config?.integracoes ?? {}) as Record<string, unknown>;
    setWebhookUrl(typeof integ.webhookUrl === 'string' ? integ.webhookUrl : '');
    const evts = Array.isArray(integ.webhookEvents) ? (integ.webhookEvents as string[]) : [];
    setWebhookEvents(new Set(evts.filter((e): e is WebhookEventId => WEBHOOK_EVENTS.some(w => w.id === e))));
  }, [config]);

  const last4 = keyInfo?.last4 ?? null;
  const apiKeyDisplay = revealedKey ?? (last4 ? `sk-live-••••••••••••••••••••${last4}` : 'Nenhuma chave gerada');

  const handleCopyKey = () => {
    if (!revealedKey) {
      toast({ title: 'Chave indisponível', description: 'Por segurança, a chave só pode ser copiada no momento da geração.', variant: 'destructive' });
      return;
    }
    navigator.clipboard.writeText(revealedKey).catch(() => {});
    toast({ title: 'Chave copiada', description: 'A chave foi copiada para a área de transferência.' });
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const r = await fetch('/api/admin/integracoes/api-key', { method: 'POST', credentials: 'include' });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as { plaintext: string; last4: string; createdAt: string };
      setRevealedKey(data.plaintext);
      qc.invalidateQueries({ queryKey: ['admin', 'api-key'] });
      toast({ title: 'Chave gerada', description: 'Copie agora — ela não será exibida novamente.' });
    } catch (err) {
      toast({ title: 'Erro ao gerar chave', description: err instanceof Error ? err.message : 'Tente novamente.', variant: 'destructive' });
    } finally {
      setRegenerating(false);
    }
  };

  const handleTestWebhook = () => {
    if (!webhookUrl) return;
    setTestingWebhook(true);
    setTimeout(() => {
      setTestingWebhook(false);
      toast({ title: 'Webhook testado', description: 'Evento de teste disparado.' });
    }, 800);
  };

  const toggleEvent = (eventId: WebhookEventId) => {
    setWebhookEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const handleSaveWebhook = async () => {
    try {
      await updateConfig({
        chave: 'integracoes',
        valor: { webhookUrl, webhookEvents: Array.from(webhookEvents) },
      });
      toast({ title: 'Webhook salvo', description: 'As configurações de webhook foram atualizadas.' });
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: err instanceof Error ? err.message : 'Tente novamente.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="flex flex-col gap-6"><Skeleton className="h-56 w-full rounded-xl" /><Skeleton className="h-72 w-full rounded-xl" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* API Key */}
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <SectionTitle>Chave de API</SectionTitle>
            <Badge className="bg-[#22846D]/10 text-[#22846D] border-0 text-xs">Ativa</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-2 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Input
              value={apiKeyDisplay}
              readOnly
              data-testid="input-api-key"
              className="font-mono text-sm bg-gray-50 dark:bg-gray-800/60"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyKey}
              disabled={!revealedKey}
              title={revealedKey ? 'Copiar chave' : 'Indisponível após o reload'}
              className="shrink-0"
              data-testid="button-copiar-api-key"
            >
              <RiFileCopyLine className="w-4 h-4" />
            </Button>
          </div>

          {revealedKey ? (
            <p className="text-xs text-amber-600 dark:text-amber-400" data-testid="text-api-key-warning">
              Copie a chave agora — ela não será exibida novamente após sair desta tela.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {keyInfo?.createdAt
                ? `Criada em ${new Date(keyInfo.createdAt).toLocaleString('pt-BR')}`
                : 'Nenhuma chave gerada até o momento.'}
            </p>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {keyInfo?.hasKey ? 'Regenerar chave' : 'Gerar chave'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {keyInfo?.hasKey
                  ? 'A chave atual será revogada imediatamente.'
                  : 'Uma nova chave será gerada e exibida apenas uma vez.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={regenerating}
              data-testid="button-gerar-api-key"
              className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-900/30 dark:hover:bg-amber-900/10"
            >
              <RiRefreshLine className={cn('w-4 h-4 mr-2', regenerating && 'animate-spin')} />
              {regenerating ? 'Gerando...' : keyInfo?.hasKey ? 'Regenerar' : 'Gerar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <SectionTitle>Webhook</SectionTitle>
            <Badge className={cn(
              'border-0 text-xs',
              webhookUrl
                ? 'bg-[#22846D]/10 text-[#22846D]'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            )}>
              {webhookUrl ? 'Configurado' : 'Não configurado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-2 flex flex-col gap-5">
          <FieldRow label="URL do webhook" description="Endpoint que receberá as notificações de eventos da plataforma.">
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://sua-api.com/webhook"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestWebhook}
                disabled={!webhookUrl || testingWebhook}
                className="shrink-0"
              >
                {testingWebhook ? (
                  <RiRefreshLine className="w-4 h-4 animate-spin" />
                ) : (
                  'Testar'
                )}
              </Button>
            </div>
          </FieldRow>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Eventos que acionam o webhook
            </Label>
            <div className="flex flex-col gap-3">
              {WEBHOOK_EVENTS.map((event) => (
                <div key={event.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`webhook-${event.id}`}
                    checked={webhookEvents.has(event.id)}
                    onCheckedChange={() => toggleEvent(event.id)}
                  />
                  <Label htmlFor={`webhook-${event.id}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-normal">
                    {event.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveWebhook} disabled={savingWebhook} data-testid="button-salvar-webhook">
              <RiSave3Line className="w-4 h-4 mr-2" />
              {savingWebhook ? 'Salvando...' : 'Salvar webhook'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documentação */}
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Documentação da API</p>
            <p className="text-xs text-muted-foreground mt-0.5">Guia completo de endpoints, autenticação e exemplos.</p>
          </div>
          <Button variant="ghost" size="sm">
            Ver documentação
            <RiExternalLinkLine className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE ROOT
───────────────────────────────────────────── */

const SECTION_COMPONENTS: Record<Section, React.ComponentType> = {
  perfil:       SecaoPerfil,
  usuarios:     UsuariosTab,
  geral:        SecaoGeral,
  notificacoes: SecaoNotificacoes,
  plataforma:   SecaoPlataforma,
  seguranca:    SecaoSeguranca,
  integracoes:  SecaoIntegracoes,
};

/* ── SearchParams reader (needs Suspense) ── */
function SearchParamsReader({ onSection }: { onSection: (s: Section) => void }) {
  const searchParams = useSearchParams();
  const stableOnSection = useCallback(onSection, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const tab = searchParams.get('tab') as Section | null;
    if (tab && VALID_SECTIONS.includes(tab)) {
      stableOnSection(tab);
    }
  }, [searchParams, stableOnSection]);

  return null;
}

function AdminConfiguracoesInner({
  activeSection,
  setActiveSection,
}: {
  activeSection: Section;
  setActiveSection: (s: Section) => void;
}) {
  const me = useUser();
  const canSeeUsers = me?.role === 'superadmin' || me?.canManageUsers === true;
  const navItems = NAV_ITEMS.filter((it) => (it.id === 'usuarios' ? canSeeUsers : true));
  const safeSection: Section = !canSeeUsers && activeSection === 'usuarios' ? 'perfil' : activeSection;
  const SectionComponent = SECTION_COMPONENTS[safeSection];

  return (
    <div className="p-6 md:p-10 min-h-full" data-testid="admin-configuracoes-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-page-title">
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as preferências e configurações da plataforma ConectaObra
        </p>
      </div>

      {/* Mobile nav — horizontal scroll */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = safeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Desktop layout — two columns */}
      <div className="flex gap-8 items-start">
        {/* Left nav */}
        <nav className="hidden lg:flex flex-col w-56 shrink-0 sticky top-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = safeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors text-left',
                    idx < navItems.length - 1 && 'border-b border-gray-50 dark:border-gray-800',
                    isActive
                      ? 'bg-primary/5 text-primary font-semibold border-r-2 border-primary'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                  )}
                  data-testid={`nav-${item.id}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <SectionComponent />
        </div>
      </div>
    </div>
  );
}

export default function AdminConfiguracoesPage() {
  const [activeSection, setActiveSection] = useState<Section>('geral');

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsReader onSection={setActiveSection} />
      </Suspense>
      <AdminConfiguracoesInner activeSection={activeSection} setActiveSection={setActiveSection} />
    </>
  );
}
