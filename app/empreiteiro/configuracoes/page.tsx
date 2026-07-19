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
  RiBuilding2Line,
  RiStarLine,
  RiVipCrownLine,
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
  usePerfilEmpreiteiro,
  useUpdatePerfilEmpreiteiro,
} from '@features/perfil/hooks/use-perfil';
import { useUpload, deleteUpload } from '@features/shared/hooks/use-uploads';
import { useEmpreiteiroDocumentos, TIPOS_DOCUMENTO_OBRIGATORIOS } from '@features/perfil/hooks/use-documentos';
import { useEmpreiteiroPortfolio, useUpdatePortfolio } from '@features/perfil/hooks/use-portfolio';
import { usePreferencias, useUpdatePreferencias, usePlano } from '@features/perfil/hooks/use-preferencias';
import { useCancelarAssinatura } from '@features/planos/ui/use-planos';
import { Textarea } from '@shared/components/ui/textarea';
import { RiFilePdf2Line } from 'react-icons/ri';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { RiUploadCloud2Line, RiCheckboxCircleFill, RiTimeLine as RiTimePending, RiCloseLine } from 'react-icons/ri';
import { getInitials } from '@shared/lib/formatters';
import { useTermosStore, VERSAO_ATUAL_TERMOS, VERSAO_ATUAL_PRIVACIDADE } from '@features/empreiteiro/termos/store/termos-store';
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
import { ContaSection } from '@features/perfil/components/ContaSection';
import { TwoFactorSection } from '@features/auth/components/TwoFactorSection';
import { MapaRaio } from '@features/perfil/components/MapaRaio';
import { Switch } from '@shared/components/ui/switch';
import { Label } from '@shared/components/ui/label';
import { Badge } from '@shared/components/ui/badge';
import { Checkbox } from '@shared/components/ui/checkbox';
import { cn } from '@shared/lib/utils';
import { useToast } from '@shared/hooks/use-toast';
import { MultiSelectAdd } from '@shared/components/MultiSelectAdd';
import { formatPhone, unformatPhone, isPhoneValid, formatCnpj, unformatCnpj, isCnpjValid } from '@shared/lib/masks';
import { IDIOMA_OPTIONS, TIMEZONE_OPTIONS, ESPECIALIDADES_SUGGESTIONS } from '@features/perfil/constants';
import { useQuery } from '@tanstack/react-query';

/* ── Types ── */
type Section = 'perfil' | 'empresa' | 'documentos' | 'notificacoes' | 'privacidade' | 'plano';

const VALID_SECTIONS: Section[] = ['perfil', 'empresa', 'documentos', 'notificacoes', 'privacidade', 'plano'];

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'perfil',        label: 'Perfil',          icon: RiUser3Line },
  { id: 'empresa',       label: 'Minha Empresa',   icon: RiBuilding2Line },
  { id: 'documentos',    label: 'Documentos',      icon: RiFileTextLine },
  { id: 'notificacoes',  label: 'Notificações',    icon: RiBellLine },
  { id: 'privacidade',   label: 'Privacidade',     icon: RiShieldLine },
  { id: 'plano',         label: 'Plano & Uso',     icon: RiStarLine },
];

/* ── IBGE Cidades autocomplete (Task #95) ── */
type IbgeCidade = { nome: string; uf: string };

function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return v;
}

interface CidadesIbgeAutocompleteProps {
  value: string[];
  onChange: (next: string[]) => void;
  ufHints?: string[];
  maxItems?: number;
  'data-testid'?: string;
}

function CidadesIbgeAutocomplete({
  value,
  onChange,
  ufHints,
  maxItems = 50,
  ...rest
}: CidadesIbgeAutocompleteProps) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 200);

  const { data, isLoading } = useQuery<{ rows: IbgeCidade[] }>({
    queryKey: ['cidades-ibge', debounced],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debounced.trim()) params.set('q', debounced.trim());
      params.set('limit', '20');
      const r = await fetch(`/api/cidades?${params.toString()}`, { credentials: 'include' });
      if (!r.ok) throw new Error('Falha ao buscar cidades');
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Suggestions in display form ("Nome — UF") to disambiguate cidades homônimas
  // (ex.: Campinas/SP vs Campinas/MG). O valor armazenado é só o "Nome".
  const suggestions = (data?.rows ?? [])
    // Prioriza UFs da zona quando o usuário já selecionou alguma.
    .sort((a, b) => {
      if (!ufHints || ufHints.length === 0) return 0;
      const aHit = ufHints.includes(a.uf) ? 0 : 1;
      const bHit = ufHints.includes(b.uf) ? 0 : 1;
      return aHit - bHit;
    })
    .map((c) => `${c.nome} — ${c.uf}`);

  // Recebe "Nome — UF" → guarda só "Nome" (canônico IBGE).
  const handleChange = (next: string[]) => {
    const cleaned = next.map((entry) => {
      const idx = entry.indexOf(' — ');
      return idx > 0 ? entry.slice(0, idx) : entry;
    });
    onChange(cleaned);
  };

  // Reapresenta value como "Nome — UF" quando possível (lookup nas sugestões atuais).
  const displayValue = value.map((nome) => {
    const hit = (data?.rows ?? []).find((c) => c.nome.toLowerCase() === nome.toLowerCase());
    return hit ? `${hit.nome} — ${hit.uf}` : nome;
  });

  return (
    <MultiSelectAdd
      value={displayValue}
      onChange={handleChange}
      suggestions={suggestions}
      placeholder="Adicionar cidade…"
      maxItems={maxItems}
      minLength={2}
      maxLength={120}
      disableCustom
      onQueryChange={setQuery}
      emptyText={isLoading ? 'Buscando…' : 'Nenhuma cidade encontrada.'}
      data-testid={rest['data-testid']}
    />
  );
}

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
      Complete seu perfil (endereço, especialidades, raio de atuação e foto) para liberar a curadoria.
    </div>
  );
}

function SecaoPerfil() {
  const { toast } = useToast();
  const { data: perfil, isLoading } = usePerfilEmpreiteiro();
  const { mutateAsync: updatePerfil, isPending: saving } = useUpdatePerfilEmpreiteiro();

  const [dados, setDados] = useState({
    nome: '',
    responsavel: '',
    telefone: '',
    bio: '',
    idioma: 'pt-BR',
    timezone: 'America/Sao_Paulo',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (perfil) {
      setDados({
        nome: perfil.nome ?? '',
        responsavel: perfil.responsavel ?? '',
        telefone: perfil.telefone ?? '',
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

  const { upload: uploadAvatarFile, pending: uploadingAvatar, progress: avatarProgress } = useUpload();
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadAvatarFile({ file, kind: 'avatar' });
      const url = result.publicUrl ?? null;
      setAvatarUrl(url);
      // commit já persistiu users.avatarUrl + empreiteiras.avatarUrl;
      // chamamos updatePerfil para reavaliar perfilCompleto/status corretamente.
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
        nome: dados.nome,
        responsavel: dados.responsavel,
        telefone: dados.telefone ? unformatPhone(dados.telefone) : null,
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

  return (
    <div className="flex flex-col gap-6">
      <PerfilStatusBanner perfilCompleto={perfil.perfilCompleto} status={perfil.status} />

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Dados pessoais</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20" data-testid="avatar-perfil-empreiteiro">
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

          <FieldRow label="Nome / Razão social">
            <Input value={dados.nome} onChange={setDado('nome')} placeholder="Nome ou razão social" data-testid="input-perfil-nome" />
          </FieldRow>
          <FieldRow label="Responsável técnico">
            <Input value={dados.responsavel} onChange={setDado('responsavel')} placeholder="Nome do responsável" data-testid="input-perfil-responsavel" />
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
   SECTION: Empresa
───────────────────────────────────────────── */
const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];

function SecaoEmpresa() {
  const { toast } = useToast();
  const { data: perfil, isLoading } = usePerfilEmpreiteiro();
  const { mutateAsync: updatePerfil, isPending: saving } = useUpdatePerfilEmpreiteiro();

  const [empresa, setEmpresa] = useState({
    cnpj: '',
    cep: '',
    endereco: '',
    cidade: '',
    estado: '',
    raioKm: '',
    descricao: '',
    anoFundacao: '',
    tamanhoEquipe: '',
    siteUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
    registroProfissional: '',
  });
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [zonaUfs, setZonaUfs] = useState<string[]>([]);
  const [zonaCidades, setZonaCidades] = useState<string[]>([]);

  useEffect(() => {
    if (perfil) {
      setEmpresa({
        cnpj: perfil.cnpj ?? '',
        cep: perfil.cep ?? '',
        endereco: perfil.endereco ?? '',
        cidade: perfil.cidade ?? '',
        estado: perfil.estado ?? '',
        raioKm: perfil.raioKm != null ? String(perfil.raioKm) : '',
        descricao: perfil.descricao ?? '',
        anoFundacao: perfil.anoFundacao != null ? String(perfil.anoFundacao) : '',
        tamanhoEquipe: perfil.tamanhoEquipe ?? '',
        siteUrl: perfil.siteUrl ?? '',
        instagramUrl: perfil.instagramUrl ?? '',
        linkedinUrl: perfil.linkedinUrl ?? '',
        registroProfissional: perfil.registroProfissional ?? '',
      });
      setEspecialidades(perfil.especialidades ?? []);
      setZonaUfs(perfil.zonaAtuacaoUfs ?? []);
      setZonaCidades(perfil.zonaAtuacaoCidades ?? []);
    }
  }, [perfil]);

  const setField = (key: keyof typeof empresa) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEmpresa((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    const raio = empresa.raioKm.trim() === '' ? null : Number(empresa.raioKm);
    if (raio != null && (Number.isNaN(raio) || raio < 0)) {
      toast({ title: 'Raio inválido', description: 'Informe um número válido.', variant: 'destructive' });
      return;
    }
    const ano = empresa.anoFundacao.trim() === '' ? null : Number(empresa.anoFundacao);
    if (ano != null && (Number.isNaN(ano) || ano < 1800 || ano > new Date().getFullYear())) {
      toast({ title: 'Ano inválido', description: 'Informe um ano válido.', variant: 'destructive' });
      return;
    }
    if (empresa.cnpj && !isCnpjValid(empresa.cnpj)) {
      toast({ title: 'CNPJ inválido', description: 'Verifique os dígitos.', variant: 'destructive' });
      return;
    }
    try {
      await updatePerfil({
        cnpj: empresa.cnpj ? unformatCnpj(empresa.cnpj) : null,
        cep: empresa.cep || null,
        endereco: empresa.endereco || null,
        cidade: empresa.cidade || null,
        estado: empresa.estado || null,
        raioKm: raio,
        especialidades,
        zonaAtuacaoUfs: zonaUfs,
        zonaAtuacaoCidades: zonaCidades,
        descricao: empresa.descricao.trim() || null,
        anoFundacao: ano,
        tamanhoEquipe: empresa.tamanhoEquipe || null,
        siteUrl: empresa.siteUrl.trim() || null,
        instagramUrl: empresa.instagramUrl.trim() || null,
        linkedinUrl: empresa.linkedinUrl.trim() || null,
        registroProfissional: empresa.registroProfissional.trim() || null,
      });
      toast({ title: 'Empresa atualizada', description: 'Os dados da sua empresa foram salvos.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar empresa.', variant: 'destructive' });
    }
  };

  if (isLoading || !perfil) {
    return <div className="flex flex-col gap-4"><Skeleton className="h-72 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PerfilStatusBanner perfilCompleto={perfil.perfilCompleto} status={perfil.status} />

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Dados da empresa</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <FieldRow label="CNPJ">
            <Input
              value={formatCnpj(empresa.cnpj)}
              onChange={(e) => setEmpresa((p) => ({ ...p, cnpj: unformatCnpj(e.target.value) }))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              maxLength={18}
              data-testid="input-empresa-cnpj"
            />
          </FieldRow>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FieldRow label="CEP">
              <CepInput
                value={empresa.cep}
                onChange={(cep) => setEmpresa((p) => ({ ...p, cep }))}
                onClear={() =>
                  setEmpresa((p) => ({ ...p, endereco: '', cidade: '', estado: '' }))
                }
                onLookupFailed={() =>
                  toast({ title: 'CEP não encontrado', description: 'Preencha o endereço manualmente.', variant: 'destructive' })
                }
                onAutofill={(addr) =>
                  setEmpresa((p) => ({
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
                <Input value={empresa.endereco} onChange={setField('endereco')} placeholder="Rua, número, complemento" data-testid="input-empresa-endereco" />
              </FieldRow>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-2">
              <FieldRow label="Cidade">
                <Input value={empresa.cidade} onChange={setField('cidade')} placeholder="Cidade" data-testid="input-empresa-cidade" />
              </FieldRow>
            </div>
            <FieldRow label="Estado">
              <Select value={empresa.estado} onValueChange={(v) => setEmpresa((p) => ({ ...p, estado: v }))}>
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

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Atuação</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <FieldRow label="Raio de atuação (km)" description="Distância máxima da sua sede em que aceita obras.">
            <Input
              type="number"
              min={0}
              max={2000}
              value={empresa.raioKm}
              onChange={setField('raioKm')}
              placeholder="Ex: 50"
              data-testid="input-empresa-raio"
            />
          </FieldRow>
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Cobertura no mapa
            </Label>
            <MapaRaio
              cep={empresa.cep}
              cidade={empresa.cidade}
              estado={empresa.estado}
              raioKm={empresa.raioKm.trim() === '' ? null : Number(empresa.raioKm)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Visualização aproximada do alcance com base no CEP/cidade. Dados © OpenStreetMap.
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Especialidades <span className="text-xs text-muted-foreground ml-1">({especialidades.length} selecionadas)</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              Busque entre as sugestões ou adicione uma especialidade própria. Até 25 itens.
            </p>
            <MultiSelectAdd
              value={especialidades}
              onChange={setEspecialidades}
              suggestions={ESPECIALIDADES_SUGGESTIONS}
              placeholder="Buscar ou adicionar especialidade…"
              maxItems={25}
              minLength={2}
              maxLength={60}
              data-testid="multiselect-especialidades"
            />
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Zona de atuação{' '}
              <span className="text-xs text-muted-foreground ml-1">
                ({zonaUfs.length} UF{zonaUfs.length === 1 ? '' : 's'} · {zonaCidades.length} cidade{zonaCidades.length === 1 ? '' : 's'})
              </span>
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              Estados e cidades onde você aceita obras. Obras compatíveis ganham o selo
              <strong className="mx-1">"Na minha zona"</strong>
              no marketplace.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Estados (UFs)</Label>
                <MultiSelectAdd
                  value={zonaUfs}
                  onChange={(next) => setZonaUfs(next.map((v) => v.toUpperCase()).filter((v) => /^[A-Z]{2}$/.test(v) && UF_OPTIONS.includes(v)))}
                  suggestions={UF_OPTIONS}
                  placeholder="Adicionar UF…"
                  maxItems={27}
                  minLength={2}
                  maxLength={2}
                  emptyText="Selecione uma UF da lista."
                  data-testid="multiselect-zona-ufs"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Cidades</Label>
                <CidadesIbgeAutocomplete
                  value={zonaCidades}
                  onChange={setZonaCidades}
                  ufHints={zonaUfs}
                  maxItems={50}
                  data-testid="multiselect-zona-cidades"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Selecione cidades da lista (base IBGE). Evita duplicatas como "São Paulo" vs "Sao Paulo".
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Sobre a empresa</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <FieldRow label="Apresentação" description="Quem é a empresa, especializações e diferenciais (até 600 caracteres).">
            <Textarea
              value={empresa.descricao}
              onChange={setField('descricao')}
              maxLength={600}
              rows={4}
              placeholder="Conte um pouco sobre sua empresa..."
              className="resize-none"
              data-testid="input-empresa-descricao"
            />
            <p className="text-xs text-muted-foreground text-right">{empresa.descricao.length}/600</p>
          </FieldRow>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="Ano de fundação">
              <Input
                type="number"
                min={1800}
                max={new Date().getFullYear()}
                value={empresa.anoFundacao}
                onChange={setField('anoFundacao')}
                placeholder="Ex: 2015"
                data-testid="input-empresa-ano"
              />
            </FieldRow>
            <FieldRow label="Tamanho da equipe">
              <Select
                value={empresa.tamanhoEquipe}
                onValueChange={(v) => setEmpresa((p) => ({ ...p, tamanhoEquipe: v }))}
              >
                <SelectTrigger data-testid="select-empresa-equipe"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {['1-5', '6-10', '11-25', '26-50', '50+'].map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt} profissionais</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </div>
          <FieldRow label="Registro profissional" description="Ex.: CREA-SP 1234567, CAU A12345-6, ART nº ...">
            <Input
              value={empresa.registroProfissional}
              onChange={setField('registroProfissional')}
              placeholder="CREA / CAU / ART"
              data-testid="input-empresa-crea"
            />
          </FieldRow>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FieldRow label="Site">
              <Input
                type="url"
                value={empresa.siteUrl}
                onChange={setField('siteUrl')}
                placeholder="https://suaempresa.com.br"
                data-testid="input-empresa-site"
              />
            </FieldRow>
            <FieldRow label="Instagram">
              <Input
                type="url"
                value={empresa.instagramUrl}
                onChange={setField('instagramUrl')}
                placeholder="https://instagram.com/..."
                data-testid="input-empresa-instagram"
              />
            </FieldRow>
            <FieldRow label="LinkedIn">
              <Input
                type="url"
                value={empresa.linkedinUrl}
                onChange={setField('linkedinUrl')}
                placeholder="https://linkedin.com/company/..."
                data-testid="input-empresa-linkedin"
              />
            </FieldRow>
          </div>
        </CardContent>
      </Card>

      <PortfolioGridSection />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} data-testid="button-salvar-empresa">
          <RiSave3Line className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar empresa'}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Notificações
───────────────────────────────────────────── */
const NOTIF_DEFAULTS_EMP = {
  email_novaObra: true,
  email_prazo: true,
  email_contrato: true,
  email_medicao: true,
  sis_documentos: true,
  sis_reuniao: true,
};

function SecaoNotificacoes() {
  const { toast } = useToast();
  const { data: prefsRemote, isLoading } = usePreferencias();
  const { mutateAsync: updatePrefs, isPending: saving } = useUpdatePreferencias();

  const [notif, setNotif] = useState<Record<string, boolean>>(NOTIF_DEFAULTS_EMP);

  useEffect(() => {
    if (prefsRemote?.notificacoes) {
      setNotif({ ...NOTIF_DEFAULTS_EMP, ...prefsRemote.notificacoes });
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
            label="Nova obra disponível"
            description="Receba um e-mail quando uma nova obra compatível com suas especialidades for publicada."
            checked={get('email_novaObra')}
            onCheckedChange={toggle('email_novaObra')}
          />
          <SwitchRow
            label="Atualização de prazo"
            description="Notificação quando um prazo de entrega em obra ativa for alterado ou se aproximar."
            checked={get('email_prazo')}
            onCheckedChange={toggle('email_prazo')}
          />
          <SwitchRow
            label="Contrato gerado para assinatura"
            description="Aviso quando um contrato digital estiver disponível para sua assinatura."
            checked={get('email_contrato')}
            onCheckedChange={toggle('email_contrato')}
          />
          <SwitchRow
            label="Medição aprovada pelo contratante"
            description="Confirmação quando o contratante aprovar uma medição de etapa."
            checked={get('email_medicao')}
            onCheckedChange={toggle('email_medicao')}
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
            description="Notificação 1 hora antes de reuniões agendadas com contratantes."
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
  const { logout, user } = useAuth();
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
  } = useTermosStore();

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

  const PRIV_DEFAULTS = { perfilPublico: true, portfolio: true, telefone: false, convites: true };
  const { data: prefsRemote } = usePreferencias();
  const { mutateAsync: updatePrefs, isPending: savingPriv } = useUpdatePreferencias();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(PRIV_DEFAULTS);

  useEffect(() => {
    if (prefsRemote?.privacidade) {
      setPrefs({ ...PRIV_DEFAULTS, ...prefsRemote.privacidade });
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
              data-testid="aceite-inline-empreiteiro"
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
            label="Exibir meu perfil no diretório de empreiteiras"
            description="Contratantes podem encontrar sua empresa ao buscar por especialidade ou região."
            checked={prefs.perfilPublico}
            onCheckedChange={toggle('perfilPublico')}
          />
          <SwitchRow
            label="Permitir que contratantes vejam meu portfólio"
            description="Fotos e obras concluídas ficam visíveis no seu perfil público."
            checked={prefs.portfolio}
            onCheckedChange={toggle('portfolio')}
          />
          <SwitchRow
            label="Mostrar telefone de contato no perfil público"
            description="Seu número de telefone fica visível para contratantes logados."
            checked={prefs.telefone}
            onCheckedChange={toggle('telefone')}
          />
          <SwitchRow
            label="Receber convites diretos para orçamento"
            description="Contratantes podem enviar convites para você participar de licitações."
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

      <TwoFactorSection />

      <ContaSection emailAtual={user?.email} />
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
  const cancelar = useCancelarAssinatura();

  function handleCancelar() {
    cancelar.mutate(undefined, {
      onSuccess: () => {
        toast({ title: 'Assinatura cancelada', description: 'Você voltou para o plano gratuito.' });
        void refetch();
      },
      onError: () => {
        toast({ title: 'Erro', description: 'Não foi possível cancelar agora. Tente novamente.', variant: 'destructive' });
      },
    });
  }

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
      {/* Banner de upgrade para plano free */}
      {plano.plano === 'free' && (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-testid="banner-upgrade-free">
          <div className="flex items-start gap-3">
            <RiStarLine className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quer desbloquear mais recursos?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Mais obras ativas, mais propostas e destaque no diretório.</p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => router.push('/empreiteiro/planos')}
            data-testid="button-upgrade-plano"
          >
            <RiVipCrownLine className="w-4 h-4 mr-1.5" />
            Ver planos
          </Button>
        </div>
      )}

      {/* Card 1: Plano atual + billing */}
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
              {plano.plano !== 'free' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={cancelar.isPending}
                      data-testid="button-cancelar-assinatura"
                    >
                      {cancelar.isPending ? 'Cancelando…' : 'Cancelar assinatura'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Você voltará para o plano gratuito imediatamente. Os limites do plano gratuito passam a valer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelar}>Confirmar cancelamento</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push('/empreiteiro/planos')}>
                Ver outros planos
                <RiExternalLinkLine className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Recursos incluídos */}
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

      {/* Card 3: Uso do plano */}
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
   SECTION: Portfólio (cards com título + reorder + remove)
───────────────────────────────────────────── */
function PortfolioGridSection() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useEmpreiteiroPortfolio();
  const updatePortfolio = useUpdatePortfolio();
  const { upload, pending } = useUpload();
  const items = data?.items ?? [];
  const [edits, setEdits] = useState<Record<string, string>>({});

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    try {
      for (const file of files) {
        const isImg = file.type.startsWith('image/');
        await upload({
          file,
          kind: isImg ? 'portfolio_imagem' : 'portfolio_doc',
          extras: { observacao: file.name },
        });
      }
      toast({ title: 'Portfólio atualizado', description: `${files.length} arquivo(s) adicionado(s).` });
      await refetch();
    } catch (err) {
      toast({
        title: 'Falha no upload',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleRemove = async (fileId: string) => {
    try {
      await deleteUpload(fileId);
      toast({ title: 'Item removido' });
      await refetch();
    } catch (err) {
      toast({ title: 'Falha ao remover', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[idx];
    const b = items[target];
    await updatePortfolio.mutateAsync([
      { id: a.id, ordem: b.ordem },
      { id: b.id, ordem: a.ordem },
    ]);
  };

  const saveTitle = async (id: string) => {
    const titulo = (edits[id] ?? '').trim();
    if (!titulo) return;
    await updatePortfolio.mutateAsync([{ id, titulo }]);
    setEdits((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    toast({ title: 'Título atualizado' });
  };

  return (
    <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
      <CardHeader className="p-6 pb-0">
        <SectionTitle>Portfólio</SectionTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Mostre fotos e documentos das suas obras. Cards podem ter título personalizado e ser reordenados.
        </p>
      </CardHeader>
      <CardContent className="p-6 pt-4 flex flex-col gap-4">
        <div>
          <label
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-muted-foreground cursor-pointer hover:border-primary/50 w-fit"
            data-testid="button-adicionar-portfolio"
          >
            <RiUploadCloud2Line className="w-4 h-4" />
            {pending ? 'Enviando…' : 'Adicionar foto ou PDF'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="hidden"
              onChange={handleUpload}
              data-testid="input-portfolio-multi"
            />
          </label>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 rounded-lg" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nenhum item no portfólio ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" data-testid="grid-portfolio-cards">
            {items.map((item, idx) => {
              const isImg = item.kind === 'portfolio_imagem';
              const editing = edits[item.id] !== undefined;
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
                  data-testid={`card-portfolio-${item.id}`}
                >
                  <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    {isImg && item.publicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.publicUrl} alt={item.titulo ?? ''} className="w-full h-full object-cover" />
                    ) : (
                      <RiFilePdf2Line className="w-10 h-10 text-red-500" />
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-2 text-sm">
                    {editing ? (
                      <Input
                        value={edits[item.id]}
                        onChange={(e) => setEdits((p) => ({ ...p, [item.id]: e.target.value }))}
                        onBlur={() => saveTitle(item.id)}
                        autoFocus
                        maxLength={120}
                        data-testid={`input-titulo-${item.id}`}
                      />
                    ) : (
                      <button
                        type="button"
                        className="text-left font-medium truncate hover:underline"
                        onClick={() => setEdits((p) => ({ ...p, [item.id]: item.titulo ?? '' }))}
                        data-testid={`button-editar-titulo-${item.id}`}
                      >
                        {item.titulo || item.originalName}
                      </button>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{(item.sizeBytes / 1000).toFixed(0)} KB</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => move(idx, -1)}
                          disabled={idx === 0}
                          className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
                          aria-label="Mover para cima"
                          data-testid={`button-up-${item.id}`}
                        >↑</button>
                        <button
                          type="button"
                          onClick={() => move(idx, 1)}
                          disabled={idx === items.length - 1}
                          className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
                          aria-label="Mover para baixo"
                          data-testid={`button-down-${item.id}`}
                        >↓</button>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.fileId)}
                          className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500"
                          aria-label="Remover"
                          data-testid={`button-remover-portfolio-${item.id}`}
                        >
                          <RiCloseLine className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Documentos privados (R2 signed URLs)
───────────────────────────────────────────── */

function SecaoDocumentos() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useEmpreiteiroDocumentos();
  const { upload, pending } = useUpload();
  const items = data?.items ?? [];
  const byTipo = new Map(items.map((i) => [i.tipo, i] as const));

  const handleFile = async (tipo: string, file: File | null) => {
    if (!file) return;
    try {
      await upload({ file, kind: 'empreiteiro_documento', extras: { tipoDocumento: tipo } });
      toast({ title: 'Documento enviado', description: file.name });
      await refetch();
    } catch (err) {
      toast({
        title: 'Falha no envio',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await deleteUpload(fileId);
      toast({ title: 'Documento removido' });
      await refetch();
    } catch (err) {
      toast({
        title: 'Falha ao remover',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Documentos obrigatórios</SectionTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Envie cada documento no campo correspondente. Apenas você e a administração têm acesso (link de download expira em 15 minutos).
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {isLoading ? (
            <Skeleton className="h-40 rounded-lg" />
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800" data-testid="lista-documentos-tipos">
              {TIPOS_DOCUMENTO_OBRIGATORIOS.map((t) => {
                const item = byTipo.get(t.value);
                const enviado = !!item;
                return (
                  <li key={t.value} className="flex items-center gap-3 py-4" data-testid={`row-doc-tipo-${t.value}`}>
                    <RiFilePdf2Line className={`w-6 h-6 shrink-0 ${enviado ? 'text-red-500' : 'text-gray-300 dark:text-gray-700'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{t.label}</p>
                        <span
                          className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            enviado
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                          data-testid={`badge-status-${t.value}`}
                        >
                          {enviado ? 'enviado' : 'pendente'}
                        </span>
                      </div>
                      {item ? (
                        <p className="text-xs text-muted-foreground truncate" title={item.originalName}>
                          {item.originalName} · {(item.sizeBytes / 1000).toFixed(0)} KB
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Aguardando envio</p>
                      )}
                    </div>
                    {item && (
                      <a
                        href={item.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline px-2"
                        data-testid={`link-baixar-doc-${t.value}`}
                      >
                        Baixar
                      </a>
                    )}
                    <label
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-xs cursor-pointer hover:border-primary/50"
                      data-testid={`button-enviar-doc-${t.value}`}
                    >
                      <RiUploadCloud2Line className="w-4 h-4" />
                      {item ? 'Substituir' : 'Enviar'}
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={pending}
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          handleFile(t.value, f);
                          e.target.value = '';
                        }}
                        data-testid={`input-doc-${t.value}`}
                      />
                    </label>
                    {item && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.fileId)}
                        className="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                        aria-label="Remover documento"
                        data-testid={`button-remover-doc-${t.value}`}
                      >
                        <RiCloseLine className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-muted-foreground mt-4">PDF, JPG, PNG ou WebP até 15 MB cada.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE ROOT
───────────────────────────────────────────── */
const SECTION_COMPONENTS: Record<Section, React.ComponentType> = {
  perfil:        SecaoPerfil,
  empresa:       SecaoEmpresa,
  documentos:    SecaoDocumentos,
  notificacoes:  SecaoNotificacoes,
  privacidade:   SecaoPrivacidade,
  plano:         SecaoPlano,
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

function EmpreiteiroConfiguracoesInner({
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

export default function EmpreiteiroConfiguracoesPage() {
  const [activeSection, setActiveSection] = useState<Section>('perfil');

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsReader onSection={setActiveSection} />
      </Suspense>
      <EmpreiteiroConfiguracoesInner activeSection={activeSection} setActiveSection={setActiveSection} />
    </>
  );
}
