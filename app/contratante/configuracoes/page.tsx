'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  RiBellLine,
  RiShieldLine,
  RiSave3Line,
  RiLockPasswordLine,
  RiUser3Line,
  RiBuildingLine,
  RiStarLine,
  RiExternalLinkLine,
  RiCheckboxCircleLine,
  RiCheckLine,
  RiBankCardLine,
  RiFileTextLine,
  RiShieldCheckLine,
  RiAlertLine,
} from 'react-icons/ri';
import { useAuth } from '@features/auth/hooks/use-auth';
import {
  usePerfilContratante,
  useUpdatePerfilContratante,
  fileToDataUrl,
} from '@features/perfil/hooks/use-perfil';
import { usePreferencias, useUpdatePreferencias, usePlano } from '@features/perfil/hooks/use-preferencias';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { RiUploadCloud2Line, RiCheckboxCircleFill, RiTimeLine as RiTimePending } from 'react-icons/ri';
import { getInitials } from '@shared/lib/formatters';
import {
  useContratanteTermosStore,
  VERSAO_ATUAL_TERMOS,
  VERSAO_ATUAL_PRIVACIDADE,
} from '@features/contratante/termos/store/termos-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@shared/components/ui/alert-dialog';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { CepInput } from '@features/perfil/components/CepInput';
import { Switch } from '@shared/components/ui/switch';
import { Label } from '@shared/components/ui/label';
import { Badge } from '@shared/components/ui/badge';
import { Checkbox } from '@shared/components/ui/checkbox';
import { cn } from '@shared/lib/utils';
import { useToast } from '@shared/hooks/use-toast';
import { Textarea } from '@shared/components/ui/textarea';
import {
  formatPhone, unformatPhone, isPhoneValid,
  formatCpf, unformatCpf, isCpfValid,
  formatCnpj, unformatCnpj, isCnpjValid,
} from '@shared/lib/masks';
import { IDIOMA_OPTIONS, TIMEZONE_OPTIONS } from '@features/perfil/constants';

/* ── Types ── */
type Section = 'perfil' | 'empresa' | 'notificacoes' | 'privacidade' | 'plano';

const VALID_SECTIONS: Section[] = ['perfil', 'empresa', 'notificacoes', 'privacidade', 'plano'];

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'perfil',       label: 'Perfil',        icon: RiUser3Line },
  { id: 'empresa',      label: 'Minha Empresa', icon: RiBuildingLine },
  { id: 'notificacoes', label: 'Notificações',  icon: RiBellLine },
  { id: 'privacidade',  label: 'Privacidade',   icon: RiShieldLine },
  { id: 'plano',        label: 'Plano & Uso',   icon: RiStarLine },
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
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Perfil
───────────────────────────────────────────── */
function PerfilStatusBanner({
  perfilCompleto,
  status,
}: {
  perfilCompleto: boolean;
  status: 'ativo' | 'inativo' | 'aprovacao';
}) {
  if (status === 'ativo') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm" data-testid="banner-perfil-aprovado">
        <RiCheckboxCircleFill className="w-4 h-4" />
        Perfil aprovado pela curadoria.
      </div>
    );
  }
  if (status === 'inativo') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm" data-testid="banner-perfil-reprovado">
        <RiAlertLine className="w-4 h-4" />
        Conta inativa. Fale com o suporte.
      </div>
    );
  }
  if (perfilCompleto) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm" data-testid="banner-perfil-curadoria">
        <RiTimePending className="w-4 h-4" />
        Perfil completo. Aguardando curadoria do administrador.
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm" data-testid="banner-perfil-incompleto">
      <RiAlertLine className="w-4 h-4" />
      Complete seu perfil (incluindo endereço e foto) para liberar a curadoria.
    </div>
  );
}

function SecaoPerfil() {
  const { toast } = useToast();
  const { data: perfil, isLoading } = usePerfilContratante();
  const { mutateAsync: updatePerfil, isPending: saving } = useUpdatePerfilContratante();

  const [dados, setDados] = useState({
    nome: '',
    telefone: '',
    cnpjCpf: '',
    tipo: 'Pessoa Física',
    bio: '',
    idioma: 'pt-BR',
    timezone: 'America/Sao_Paulo',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (perfil) {
      setDados({
        nome: perfil.nome ?? '',
        telefone: perfil.telefone ?? '',
        cnpjCpf: perfil.cnpjCpf ?? '',
        tipo: perfil.tipo || 'Pessoa Física',
        bio: perfil.bio ?? '',
        idioma: perfil.idioma || 'pt-BR',
        timezone: perfil.timezone || 'America/Sao_Paulo',
      });
      setAvatarUrl(perfil.avatarUrl ?? null);
    }
  }, [perfil]);

  const [senha, setSenha] = useState({ atual: '', nova: '', confirmar: '' });
  const senhaError = senha.nova && senha.confirmar && senha.nova !== senha.confirmar;
  const senhaValida = senha.atual && senha.nova && senha.confirmar && !senhaError;

  const setDado = (key: keyof typeof dados) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDados((prev) => ({ ...prev, [key]: e.target.value }));
  const setSenhaField = (key: keyof typeof senha) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSenha((prev) => ({ ...prev, [key]: e.target.value }));

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
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
    const isPF = dados.tipo === 'Pessoa Física';
    if (dados.cnpjCpf) {
      const valid = isPF ? isCpfValid(dados.cnpjCpf) : isCnpjValid(dados.cnpjCpf);
      if (!valid) {
        toast({
          title: isPF ? 'CPF inválido' : 'CNPJ inválido',
          description: 'Verifique os dígitos verificadores.',
          variant: 'destructive',
        });
        return;
      }
    }
    try {
      await updatePerfil({
        nome: dados.nome,
        telefone: dados.telefone ? unformatPhone(dados.telefone) : null,
        cnpjCpf: dados.cnpjCpf
          ? (isPF ? unformatCpf(dados.cnpjCpf) : unformatCnpj(dados.cnpjCpf))
          : null,
        tipo: dados.tipo,
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

  const isPF = dados.tipo === 'Pessoa Física';

  return (
    <div className="flex flex-col gap-6">
      <PerfilStatusBanner perfilCompleto={perfil.perfilCompleto} status={perfil.status} />

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Dados pessoais</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20" data-testid="avatar-perfil-contratante">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={dados.nome || 'avatar'} />}
              <AvatarFallback className="bg-primary text-white text-xl font-bold">
                {getInitials(dados.nome || perfil.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-fit" data-testid="button-upload-avatar">
                <RiUploadCloud2Line className="w-4 h-4" />
                Enviar foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  data-testid="input-avatar-file"
                />
              </label>
              <p className="text-xs text-muted-foreground">PNG ou JPG até 1.5 MB.</p>
            </div>
          </div>

          <FieldRow label="Tipo de pessoa">
            <Select value={dados.tipo} onValueChange={(v) => setDados((p) => ({ ...p, tipo: v }))}>
              <SelectTrigger data-testid="select-perfil-tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Nome completo">
            <Input value={dados.nome} onChange={setDado('nome')} placeholder="Seu nome completo" data-testid="input-perfil-nome" />
          </FieldRow>
          <FieldRow label="E-mail" description="Usado para login. Contate o suporte para alterar.">
            <Input type="email" value={perfil.email} disabled className="opacity-60 cursor-not-allowed" data-testid="input-perfil-email" />
          </FieldRow>
          <FieldRow label="Telefone" description="Número de contato para suporte e obras.">
            <Input
              type="tel"
              value={formatPhone(dados.telefone)}
              onChange={(e) => setDados((p) => ({ ...p, telefone: unformatPhone(e.target.value) }))}
              placeholder="(11) 90000-0000"
              data-testid="input-perfil-telefone"
            />
          </FieldRow>
          <FieldRow label={isPF ? 'CPF' : 'CNPJ'}>
            <Input
              value={isPF ? formatCpf(dados.cnpjCpf) : formatCnpj(dados.cnpjCpf)}
              onChange={(e) => setDados((p) => ({
                ...p,
                cnpjCpf: isPF ? unformatCpf(e.target.value) : unformatCnpj(e.target.value),
              }))}
              placeholder={isPF ? '000.000.000-00' : '00.000.000/0000-00'}
              inputMode="numeric"
              maxLength={isPF ? 14 : 18}
              data-testid="input-perfil-cpfcnpj"
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
              <Select value={dados.idioma} onValueChange={(v) => setDados((p) => ({ ...p, idioma: v }))}>
                <SelectTrigger data-testid="select-perfil-idioma"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IDIOMA_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Fuso horário">
              <Select value={dados.timezone} onValueChange={(v) => setDados((p) => ({ ...p, timezone: v }))}>
                <SelectTrigger data-testid="select-perfil-timezone"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {TIMEZONE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveDados} disabled={saving} data-testid="button-salvar-perfil">
              <RiSave3Line className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar dados'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
   SECTION: Empresa (Endereço)
───────────────────────────────────────────── */
const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];

function SecaoEmpresa() {
  const { toast } = useToast();
  const { data: perfil, isLoading } = usePerfilContratante();
  const { mutateAsync: updatePerfil, isPending: saving } = useUpdatePerfilContratante();

  const [endereco, setEndereco] = useState({ cep: '', endereco: '', cidade: '', estado: '' });

  useEffect(() => {
    if (perfil) {
      setEndereco({
        cep: perfil.cep ?? '',
        endereco: perfil.endereco ?? '',
        cidade: perfil.cidade ?? '',
        estado: perfil.estado ?? '',
      });
    }
  }, [perfil]);

  const setField = (key: keyof typeof endereco) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEndereco((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      await updatePerfil({
        cep: endereco.cep || null,
        endereco: endereco.endereco || null,
        cidade: endereco.cidade || null,
        estado: endereco.estado || null,
      });
      toast({ title: 'Endereço salvo', description: 'Os dados de endereço foram atualizados.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar endereço.', variant: 'destructive' });
    }
  };

  if (isLoading || !perfil) {
    return <Skeleton className="h-72 rounded-xl" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PerfilStatusBanner perfilCompleto={perfil.perfilCompleto} status={perfil.status} />

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Endereço</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FieldRow label="CEP">
              <CepInput
                value={endereco.cep}
                onChange={(cep) => setEndereco((p) => ({ ...p, cep }))}
                onClear={() => setEndereco((p) => ({ ...p, endereco: '', cidade: '', estado: '' }))}
                onLookupFailed={() =>
                  toast({ title: 'CEP não encontrado', description: 'Preencha o endereço manualmente.', variant: 'destructive' })
                }
                onAutofill={(addr) =>
                  setEndereco((p) => ({
                    ...p,
                    endereco: p.endereco || addr.endereco,
                    cidade: addr.cidade,
                    estado: addr.estado,
                  }))
                }
                data-testid="input-empresa-cep"
              />
            </FieldRow>
            <div className="sm:col-span-2">
              <FieldRow label="Endereço">
                <Input value={endereco.endereco} onChange={setField('endereco')} placeholder="Rua, número, complemento" data-testid="input-empresa-endereco" />
              </FieldRow>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-2">
              <FieldRow label="Cidade">
                <Input value={endereco.cidade} onChange={setField('cidade')} placeholder="Cidade" data-testid="input-empresa-cidade" />
              </FieldRow>
            </div>
            <FieldRow label="Estado">
              <Select value={endereco.estado} onValueChange={(v) => setEndereco((p) => ({ ...p, estado: v }))}>
                <SelectTrigger data-testid="select-empresa-estado"><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {UF_OPTIONS.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} data-testid="button-salvar-empresa">
          <RiSave3Line className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar endereço'}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Notificações
───────────────────────────────────────────── */
const NOTIF_DEFAULTS_CON = {
  email_novaProposta: true,
  email_medicao: true,
  email_prazo: true,
  email_contrato: true,
  sis_documentos: true,
  sis_reuniao: true,
};

function SecaoNotificacoes() {
  const { toast } = useToast();
  const { data: prefsRemote, isLoading } = usePreferencias();
  const { mutateAsync: updatePrefs, isPending: saving } = useUpdatePreferencias();
  const [notif, setNotif] = useState<Record<string, boolean>>(NOTIF_DEFAULTS_CON);

  useEffect(() => {
    if (prefsRemote?.notificacoes) {
      setNotif({ ...NOTIF_DEFAULTS_CON, ...prefsRemote.notificacoes });
    }
  }, [prefsRemote]);

  const toggle = (key: string) => () => setNotif((p) => ({ ...p, [key]: !p[key] }));
  const get = (k: string) => notif[k] ?? true;

  const handleSave = async () => {
    try {
      await updatePrefs({ notificacoes: notif });
      toast({ title: 'Preferências salvas', description: 'Suas notificações foram atualizadas.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar preferências.', variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-32 rounded-xl" /></div>;

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Notificações por e-mail</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-0">
          <SwitchRow
            label="Nova proposta recebida"
            description="Receba um e-mail quando um empreiteiro enviar uma proposta para uma obra publicada."
            checked={get('email_novaProposta')}
            onCheckedChange={toggle('email_novaProposta')}
          />
          <SwitchRow
            label="Medição submetida pelo empreiteiro"
            description="Notificação quando um empreiteiro submeter uma medição de etapa para sua aprovação."
            checked={get('email_medicao')}
            onCheckedChange={toggle('email_medicao')}
          />
          <SwitchRow
            label="Prazo de etapa próximo"
            description="Aviso quando um prazo de entrega de etapa estiver se aproximando."
            checked={get('email_prazo')}
            onCheckedChange={toggle('email_prazo')}
          />
          <SwitchRow
            label="Contrato disponível para assinatura"
            description="Aviso quando um contrato digital estiver disponível para sua assinatura."
            checked={get('email_contrato')}
            onCheckedChange={toggle('email_contrato')}
          />
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Notificações do sistema</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-0">
          <SwitchRow
            label="Alertas de documentos próximos ao vencimento"
            description="Aviso automático 30 dias antes do vencimento de documentos cadastrados."
            checked={get('sis_documentos')}
            onCheckedChange={toggle('sis_documentos')}
          />
          <SwitchRow
            label="Lembretes de reunião"
            description="Notificação 1 hora antes de reuniões agendadas com empreiteiros."
            checked={get('sis_reuniao')}
            onCheckedChange={toggle('sis_reuniao')}
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
   SECTION: Privacidade
───────────────────────────────────────────── */
function SecaoPrivacidade() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const router = useRouter();
  const {
    termosAceitosEm,
    privacidadeAceitaEm,
    versaoTermosAceita,
    versaoPrivacidadeAceita,
    termosIp,
    privacidadeIp,
    acceptAll,
    revokeAll,
    load: loadTermos,
    loaded: termosLoaded,
  } = useContratanteTermosStore();

  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [aceitePriv, setAceitePriv] = useState(false);
  const [aceitando, setAceitando] = useState(false);

  const precisaAceite =
    termosLoaded &&
    (!termosAceitosEm ||
      !privacidadeAceitaEm ||
      versaoTermosAceita !== VERSAO_ATUAL_TERMOS ||
      versaoPrivacidadeAceita !== VERSAO_ATUAL_PRIVACIDADE);

  const handleAceitar = async () => {
    if (!aceiteTermos || !aceitePriv) return;
    setAceitando(true);
    try {
      await acceptAll();
      toast({ title: 'Aceite registrado', description: 'Obrigado por aceitar os documentos legais.' });
      setAceiteTermos(false);
      setAceitePriv(false);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível registrar o aceite.', variant: 'destructive' });
    } finally {
      setAceitando(false);
    }
  };

  useEffect(() => {
    if (!termosLoaded) {
      loadTermos();
    }
  }, [termosLoaded, loadTermos]);

  const PRIV_DEFAULTS_CON = { perfilPublico: true, portfOlioObras: true, telefone: false, convites: true };
  const { data: prefsRemote } = usePreferencias();
  const { mutateAsync: updatePrefs, isPending: savingPriv } = useUpdatePreferencias();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(PRIV_DEFAULTS_CON);

  useEffect(() => {
    if (prefsRemote?.privacidade) {
      setPrefs({ ...PRIV_DEFAULTS_CON, ...prefsRemote.privacidade });
    }
  }, [prefsRemote]);

  const toggle = (key: string) => (v: boolean) =>
    setPrefs((p) => ({ ...p, [key]: v }));

  const handleSave = async () => {
    try {
      await updatePrefs({ privacidade: prefs });
      toast({ title: 'Privacidade atualizada', description: 'Suas preferências de visibilidade foram salvas.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar preferências.', variant: 'destructive' });
    }
  };

  const handleRevoke = async () => {
    await revokeAll();
    toast({
      title: 'Consentimento revogado',
      description: 'Você será desconectado. Para voltar a usar a plataforma, será necessário aceitar os termos novamente.',
    });
    const { redirect } = await logout();
    router.push(redirect);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(iso));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Documentos Legais */}
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Documentos legais</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0 flex flex-col gap-4">
          {precisaAceite && (
            <div
              className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-4 flex flex-col gap-3"
              data-testid="aceite-inline-contratante"
            >
              <div className="flex items-start gap-2">
                <RiAlertLine className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Aceite necessário para usar a plataforma
                  </p>
                  <p className="text-xs text-amber-800/80 dark:text-amber-200/70 mt-0.5">
                    Para continuar, leia e confirme os documentos abaixo.
                  </p>
                </div>
              </div>
              <label className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-100 cursor-pointer">
                <Checkbox
                  checked={aceiteTermos}
                  onCheckedChange={(v) => setAceiteTermos(!!v)}
                  data-testid="checkbox-aceite-termos"
                  className="mt-0.5"
                />
                <span>
                  Li e aceito os{' '}
                  <a href="/termos" target="_blank" rel="noreferrer" className="underline font-medium">
                    Termos de Uso
                  </a>{' '}
                  (versão {VERSAO_ATUAL_TERMOS}).
                </span>
              </label>
              <label className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-100 cursor-pointer">
                <Checkbox
                  checked={aceitePriv}
                  onCheckedChange={(v) => setAceitePriv(!!v)}
                  data-testid="checkbox-aceite-privacidade"
                  className="mt-0.5"
                />
                <span>
                  Li e aceito a{' '}
                  <a href="/politica-privacidade" target="_blank" rel="noreferrer" className="underline font-medium">
                    Política de Privacidade
                  </a>{' '}
                  (versão {VERSAO_ATUAL_PRIVACIDADE}).
                </span>
              </label>
              <Button
                size="sm"
                disabled={!aceiteTermos || !aceitePriv || aceitando}
                onClick={handleAceitar}
                className="self-start mt-1"
                data-testid="button-aceitar-documentos"
              >
                {aceitando ? 'Registrando…' : 'Li e aceito'}
              </Button>
            </div>
          )}
          {/* Termos de Uso */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <RiFileTextLine className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Termos de Uso</p>
                {termosAceitosEm ? (
                  <>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <RiCheckboxCircleLine className="w-3.5 h-3.5 text-green-500" />
                      <p className="text-xs text-gray-500" data-testid="termos-aceito-em">Aceito em {formatDate(termosAceitosEm)}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Versão {versaoTermosAceita ?? VERSAO_ATUAL_TERMOS}
                      {termosIp && <span className="ml-2">· IP {termosIp}</span>}
                      {versaoTermosAceita !== VERSAO_ATUAL_TERMOS && (
                        <span className="ml-2 text-amber-500 font-medium">· Nova versão disponível</span>
                      )}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <RiAlertLine className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">Pendente de aceite</p>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => window.open('/termos', '_blank')}
            >
              Ver
              <RiExternalLinkLine className="w-3 h-3 ml-1" />
            </Button>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Política de Privacidade */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <RiShieldCheckLine className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Política de Privacidade</p>
                {privacidadeAceitaEm ? (
                  <>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <RiCheckboxCircleLine className="w-3.5 h-3.5 text-green-500" />
                      <p className="text-xs text-gray-500" data-testid="privacidade-aceita-em">Aceita em {formatDate(privacidadeAceitaEm)}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Versão {versaoPrivacidadeAceita ?? VERSAO_ATUAL_PRIVACIDADE}
                      {privacidadeIp && <span className="ml-2">· IP {privacidadeIp}</span>}
                      {versaoPrivacidadeAceita !== VERSAO_ATUAL_PRIVACIDADE && (
                        <span className="ml-2 text-amber-500 font-medium">· Nova versão disponível</span>
                      )}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <RiAlertLine className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">Pendente de aceite</p>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 text-xs"
              onClick={() => window.open('/politica-privacidade', '_blank')}
            >
              Ver
              <RiExternalLinkLine className="w-3 h-3 ml-1" />
            </Button>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs px-0">
                  <RiAlertLine className="w-3.5 h-3.5 mr-1.5" />
                  Revogar consentimento (LGPD)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revogar consentimento?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <span className="block">
                      Ao revogar seu consentimento, você exercerá seu direito garantido pela LGPD (Lei 13.709/2018). Suas preferências e aceites serão removidos desta sessão.
                    </span>
                    <span className="block font-medium text-destructive">
                      Você será deslogado imediatamente e precisará aceitar os termos novamente para acessar a plataforma.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRevoke}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Revogar e sair
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Visibilidade */}
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Visibilidade no diretório</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-0">
          <SwitchRow
            label="Exibir meu perfil no diretório de contratantes"
            description="Empreiteiros podem encontrar sua empresa ao buscar por contratantes na região."
            checked={prefs.perfilPublico}
            onCheckedChange={toggle('perfilPublico')}
          />
          <SwitchRow
            label="Permitir que empreiteiros vejam obras anteriores"
            description="Histórico de obras concluídas fica visível no seu perfil público."
            checked={prefs.portfOlioObras}
            onCheckedChange={toggle('portfOlioObras')}
          />
          <SwitchRow
            label="Mostrar telefone de contato no perfil público"
            description="Seu número de telefone fica visível para empreiteiros logados na plataforma."
            checked={prefs.telefone}
            onCheckedChange={toggle('telefone')}
          />
          <SwitchRow
            label="Aceitar convites de empreiteiros para avaliação de proposta"
            description="Empreiteiros podem enviar convites espontâneos para você avaliar suas propostas."
            checked={prefs.convites}
            onCheckedChange={toggle('convites')}
          />
          {prefsRemote?.updatedAt && (
            <p
              className="text-xs text-muted-foreground mt-3"
              data-testid="text-prefs-updated-at"
            >
              Última atualização: {formatDate(prefsRemote.updatedAt)}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={savingPriv} data-testid="button-salvar-privacidade">
          <RiSave3Line className="w-4 h-4 mr-2" />
          {savingPriv ? 'Salvando...' : 'Salvar privacidade'}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Plano
───────────────────────────────────────────── */
function UsageMeterBadge({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? current / max : 0;
  const display = max >= 9999 ? `${current}/∞` : `${current}/${max}`;
  if (pct > 0.95) return <Badge className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-0 text-xs">{display}</Badge>;
  if (pct > 0.8)  return <Badge className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-0 text-xs">{display}</Badge>;
  return <Badge className="bg-[#22846D]/10 text-[#22846D] border-0 text-xs">{display}</Badge>;
}

function SecaoPlano() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: plano, isLoading, isError, refetch } = usePlano();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !plano) {
    return (
      <Card className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10">
        <CardContent className="p-6 flex flex-col items-start gap-3" data-testid="plano-error">
          <div className="flex items-center gap-2">
            <RiAlertLine className="w-5 h-5 text-red-500" />
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">
              Não foi possível carregar seu plano.
            </p>
          </div>
          <p className="text-xs text-red-800/80 dark:text-red-200/70">
            Tente novamente em instantes ou recarregue a página.
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-retry-plano">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tierLabel = plano.plano === 'free' ? 'Gratuito' : plano.plano === 'pro' ? 'Profissional' : 'Empresarial';
  const inicio = plano.planoStartedAt
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(plano.planoStartedAt))
    : '—';

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <SectionTitle>Plano atual</SectionTitle>
            <Badge className="bg-[#22846D]/10 text-[#22846D] border-0 text-xs" data-testid="badge-plano-tier">{tierLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-2 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100" data-testid="text-plano-nome">{plano.catalogo.nome}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <RiBankCardLine className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {plano.catalogo.precoMensal === 0
                    ? 'Grátis'
                    : <>R$ {plano.catalogo.precoMensal}<span className="text-xs font-normal text-muted-foreground">/mês</span></>}
                </span>
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-xs text-muted-foreground">Início em {inicio}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => toast({ title: 'Em breve', description: 'A gestão de assinatura estará disponível em breve.' })}
                data-testid="button-gerenciar-assinatura"
              >
                Gerenciar assinatura
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push('/contratante/planos')}>
                Ver outros planos
                <RiExternalLinkLine className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Recursos incluídos no plano</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {plano.catalogo.features.map((feat) => (
              <div key={feat} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#22846D]/10 flex items-center justify-center shrink-0">
                  <RiCheckLine className="w-3 h-3 text-[#22846D]" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{feat}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Uso do plano</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plano.uso.map((item) => {
              const pct = item.max > 0 ? Math.min(100, (item.current / item.max) * 100) : 0;
              return (
                <div
                  key={item.key}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 flex flex-col gap-2"
                  data-testid={`uso-item-${item.key}`}
                >
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.current}</p>
                    <UsageMeterBadge current={item.current} max={item.max} />
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        pct > 95 ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-[#22846D]',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">máx. {item.max >= 9999 ? 'ilimitado' : item.max}</p>
                </div>
              );
            })}
          </div>
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
  empresa:      SecaoEmpresa,
  notificacoes: SecaoNotificacoes,
  privacidade:  SecaoPrivacidade,
  plano:        SecaoPlano,
};

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

function ContratanteConfiguracoesInner({
  activeSection,
  setActiveSection,
}: {
  activeSection: Section;
  setActiveSection: (s: Section) => void;
}) {
  const SectionComponent = SECTION_COMPONENTS[activeSection];

  return (
    <div className="p-6 md:p-10 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie suas preferências, dados da empresa e visibilidade na plataforma
        </p>
      </div>

      {/* Mobile nav — horizontal scroll */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
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
            {NAV_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors text-left',
                    idx < NAV_ITEMS.length - 1 && 'border-b border-gray-50 dark:border-gray-800',
                    isActive
                      ? 'bg-primary/5 text-primary font-semibold border-r-2 border-primary'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                  )}
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

export default function ContratanteConfiguracoesPage() {
  const [activeSection, setActiveSection] = useState<Section>('perfil');

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsReader onSection={setActiveSection} />
      </Suspense>
      <ContratanteConfiguracoesInner activeSection={activeSection} setActiveSection={setActiveSection} />
    </>
  );
}
