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
  fileToDataUrl,
  MAX_PORTFOLIO_IMAGE_BYTES,
  MAX_PORTFOLIO_DOC_BYTES,
} from '@features/perfil/hooks/use-perfil';
import { usePreferencias, useUpdatePreferencias } from '@features/perfil/hooks/use-preferencias';
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
import { MapaRaio } from '@features/perfil/components/MapaRaio';
import { Switch } from '@shared/components/ui/switch';
import { Label } from '@shared/components/ui/label';
import { Badge } from '@shared/components/ui/badge';
import { cn } from '@shared/lib/utils';
import { useToast } from '@shared/hooks/use-toast';

/* ── Types ── */
type Section = 'perfil' | 'empresa' | 'notificacoes' | 'privacidade' | 'plano';

const VALID_SECTIONS: Section[] = ['perfil', 'empresa', 'notificacoes', 'privacidade', 'plano'];

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'perfil',        label: 'Perfil',          icon: RiUser3Line },
  { id: 'empresa',       label: 'Minha Empresa',   icon: RiBuilding2Line },
  { id: 'notificacoes',  label: 'Notificações',    icon: RiBellLine },
  { id: 'privacidade',   label: 'Privacidade',     icon: RiShieldLine },
  { id: 'plano',         label: 'Plano & Uso',     icon: RiStarLine },
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
      Complete seu perfil (endereço, especialidades, raio de atuação e foto) para liberar a curadoria.
    </div>
  );
}

function SecaoPerfil() {
  const { toast } = useToast();
  const { data: perfil, isLoading } = usePerfilEmpreiteiro();
  const { mutateAsync: updatePerfil, isPending: saving } = useUpdatePerfilEmpreiteiro();

  const [dados, setDados] = useState({ nome: '', responsavel: '', telefone: '' });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (perfil) {
      setDados({
        nome: perfil.nome ?? '',
        responsavel: perfil.responsavel ?? '',
        telefone: perfil.telefone ?? '',
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
    try {
      await updatePerfil({
        nome: dados.nome,
        responsavel: dados.responsavel,
        telefone: dados.telefone || null,
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
            <Input type="tel" value={dados.telefone} onChange={setDado('telefone')} placeholder="(11) 9 0000-0000" data-testid="input-perfil-telefone" />
          </FieldRow>
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
const ESPECIALIDADES_OPTIONS = [
  'Alvenaria', 'Elétrica', 'Hidráulica', 'Pintura', 'Acabamento',
  'Fundações', 'Estrutura Metálica', 'Gesso/Drywall', 'Cobertura/Telhado',
  'Paisagismo', 'Reformas', 'Obras Comerciais',
] as const;

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
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [portfolioDocs, setPortfolioDocs] = useState<string[]>([]);

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
      setPortfolio(perfil.portfolioUrls ?? []);
      setPortfolioDocs(perfil.portfolioDocs ?? []);
    }
  }, [perfil]);

  const setField = (key: keyof typeof empresa) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEmpresa((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleEspecialidade = (esp: string) => {
    setEspecialidades((prev) =>
      prev.includes(esp) ? prev.filter((e) => e !== esp) : [...prev, esp],
    );
  };

  const BLOCKED_DOCS = /\.(docx?|pptx?|xlsx?)$/i;

  const handlePortfolioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (BLOCKED_DOCS.test(file.name)) {
        throw new Error('Use PDF para garantir a visualização.');
      }
      if (!file.type.startsWith('image/')) {
        throw new Error('Selecione uma imagem JPG, PNG ou WebP.');
      }
      if (portfolio.length >= 10) {
        throw new Error('Limite de 10 imagens atingido.');
      }
      const url = await fileToDataUrl(file, MAX_PORTFOLIO_IMAGE_BYTES);
      const next = [...portfolio, url];
      setPortfolio(next);
      await updatePerfil({ portfolioUrls: next });
      toast({ title: 'Imagem adicionada', description: 'Foto incluída no portfólio.' });
    } catch (err) {
      toast({
        title: 'Erro ao adicionar foto',
        description: err instanceof Error ? err.message : 'Tente um arquivo menor.',
        variant: 'destructive',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handlePortfolioDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (BLOCKED_DOCS.test(file.name)) {
        throw new Error('Use PDF para garantir a visualização.');
      }
      if (file.type !== 'application/pdf') {
        throw new Error('Apenas PDF é aceito neste campo.');
      }
      if (portfolioDocs.length >= 3) {
        throw new Error('Limite de 3 PDFs atingido.');
      }
      const url = await fileToDataUrl(file, MAX_PORTFOLIO_DOC_BYTES);
      const stamped = `${file.name}::${url}`;
      const next = [...portfolioDocs, stamped];
      setPortfolioDocs(next);
      await updatePerfil({ portfolioDocs: next });
      toast({ title: 'Documento adicionado', description: 'PDF incluído no portfólio.' });
    } catch (err) {
      toast({
        title: 'Erro ao adicionar documento',
        description: err instanceof Error ? err.message : 'Tente um arquivo menor.',
        variant: 'destructive',
      });
    } finally {
      e.target.value = '';
    }
  };

  const removePortfolioItem = async (idx: number) => {
    const next = portfolio.filter((_, i) => i !== idx);
    setPortfolio(next);
    try {
      await updatePerfil({ portfolioUrls: next });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao remover item.', variant: 'destructive' });
    }
  };

  const removePortfolioDoc = async (idx: number) => {
    const next = portfolioDocs.filter((_, i) => i !== idx);
    setPortfolioDocs(next);
    try {
      await updatePerfil({ portfolioDocs: next });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao remover documento.', variant: 'destructive' });
    }
  };

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
    try {
      await updatePerfil({
        cnpj: empresa.cnpj || null,
        cep: empresa.cep || null,
        endereco: empresa.endereco || null,
        cidade: empresa.cidade || null,
        estado: empresa.estado || null,
        raioKm: raio,
        especialidades,
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
            <Input value={empresa.cnpj} onChange={setField('cnpj')} placeholder="00.000.000/0000-00" data-testid="input-empresa-cnpj" />
          </FieldRow>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FieldRow label="CEP">
              <CepInput
                value={empresa.cep}
                onChange={(cep) => setEmpresa((p) => ({ ...p, cep }))}
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
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Especialidades <span className="text-xs text-muted-foreground ml-1">({especialidades.length} selecionadas)</span>
            </Label>
            <div className="flex flex-wrap gap-2" data-testid="grupo-especialidades">
              {ESPECIALIDADES_OPTIONS.map((esp) => {
                const ativo = especialidades.includes(esp);
                return (
                  <button
                    key={esp}
                    type="button"
                    onClick={() => toggleEspecialidade(esp)}
                    data-testid={`chip-especialidade-${esp}`}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                      ativo
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary/50',
                    )}
                  >
                    {esp}
                  </button>
                );
              })}
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

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Portfólio</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Imagens de obras <span className="text-xs text-muted-foreground">({portfolio.length}/10)</span>
            </Label>
            <div className="flex flex-wrap gap-3" data-testid="grupo-portfolio">
              {portfolio.map((url, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Portfólio ${idx + 1}`} className="w-full h-full object-cover" data-testid={`img-portfolio-${idx}`} />
                  <button
                    type="button"
                    onClick={() => removePortfolioItem(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    aria-label="Remover"
                    data-testid={`button-remover-portfolio-${idx}`}
                  >
                    <RiCloseLine className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {portfolio.length < 10 && (
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-xs text-muted-foreground cursor-pointer hover:border-primary/50" data-testid="button-adicionar-portfolio">
                  <RiUploadCloud2Line className="w-5 h-5 mb-1" />
                  Adicionar
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePortfolioFile} data-testid="input-portfolio-file" />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Até 10 imagens (JPG/PNG/WebP), 2 MB cada.</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Documentos PDF <span className="text-xs text-muted-foreground">({portfolioDocs.length}/3)</span>
            </Label>
            <div className="flex flex-col gap-2" data-testid="grupo-portfolio-docs">
              {portfolioDocs.map((entry, idx) => {
                const sepIdx = entry.indexOf('::');
                const name = sepIdx > 0 ? entry.slice(0, sepIdx) : `Documento ${idx + 1}.pdf`;
                const url = sepIdx > 0 ? entry.slice(sepIdx + 2) : entry;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700"
                    data-testid={`doc-portfolio-${idx}`}
                  >
                    <RiFilePdf2Line className="w-5 h-5 text-red-500 shrink-0" />
                    <span className="text-sm flex-1 truncate" title={name}>{name}</span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                      data-testid={`link-doc-portfolio-${idx}`}
                    >
                      Abrir
                    </a>
                    <button
                      type="button"
                      onClick={() => removePortfolioDoc(idx)}
                      className="w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                      aria-label="Remover"
                      data-testid={`button-remover-doc-${idx}`}
                    >
                      <RiCloseLine className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {portfolioDocs.length < 3 && (
                <label
                  className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-muted-foreground cursor-pointer hover:border-primary/50 w-fit"
                  data-testid="button-adicionar-doc"
                >
                  <RiUploadCloud2Line className="w-4 h-4" />
                  Adicionar PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePortfolioDoc}
                    data-testid="input-portfolio-doc"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Até 3 PDFs, 5 MB cada (portfólio institucional, ART/RRT, certificações).
              DOC/DOCX/PPT/XLS não são aceitos — converta para PDF.
            </p>
          </div>
        </CardContent>
      </Card>

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
  const { toast, } = useToast();
  const { logout } = useAuth();
  const router = useRouter();
  const {
    termosAceitosEm,
    privacidadeAceitaEm,
    versaoTermosAceita,
    versaoPrivacidadeAceita,
    revokeAll,
    load: loadTermos,
    loaded: termosLoaded,
  } = useTermosStore();

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
                      <p className="text-xs text-gray-500">Aceito em {formatDate(termosAceitosEm)}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Versão {versaoTermosAceita ?? VERSAO_ATUAL_TERMOS}
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
                      <p className="text-xs text-gray-500">Aceita em {formatDate(privacidadeAceitaEm)}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Versão {versaoPrivacidadeAceita ?? VERSAO_ATUAL_PRIVACIDADE}
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
const PLANO_FEATURES = [
  '10 obras ativas simultâneas',
  '30 propostas por mês',
  'Acesso completo ao diretório de obras',
  'Contratos digitais',
  'Portfólio com até 100 fotos',
  'Relatórios de desempenho',
  'Análises com IA',
  'Suporte prioritário',
  'Exportação de relatórios',
];

const PLAN_USAGE = [
  { label: 'Obras ativas',          current: 4,  max: 10 },
  { label: 'Propostas enviadas',    current: 12, max: 30 },
  { label: 'Fotos no portfólio',    current: 47, max: 100 },
  { label: 'Contratos ativos',      current: 3,  max: 10 },
  { label: 'Medições submetidas',   current: 6,  max: 30 },
  { label: 'Relatórios exportados', current: 4,  max: 20 },
];

function UsageMeterBadge({ current, max }: { current: number; max: number }) {
  const pct = current / max;
  if (pct > 0.95) return <Badge className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-0 text-xs">{current}/{max}</Badge>;
  if (pct > 0.8)  return <Badge className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-0 text-xs">{current}/{max}</Badge>;
  return <Badge className="bg-[#22846D]/10 text-[#22846D] border-0 text-xs">{current}/{max}</Badge>;
}

function SecaoPlano() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      {/* Card 1: Plano atual + billing */}
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <SectionTitle>Plano atual</SectionTitle>
            <Badge className="bg-[#22846D]/10 text-[#22846D] border-0 text-xs">Ativo</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-2 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Plano Profissional</p>
              <div className="flex items-center gap-2 mt-2">
                <RiBankCardLine className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">R$ 89<span className="text-xs font-normal text-muted-foreground">/mês</span></span>
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-xs text-muted-foreground">Renovação em 15 de junho de 2026</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="text-xs">
                Gerenciar assinatura
              </Button>
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
            {PLANO_FEATURES.map((feat) => (
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
            {PLAN_USAGE.map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 flex flex-col gap-2"
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
                      item.current / item.max > 0.95 ? 'bg-red-500' :
                      item.current / item.max > 0.8 ? 'bg-amber-400' :
                      'bg-[#22846D]'
                    )}
                    style={{ width: `${Math.min(100, (item.current / item.max) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">máx. {item.max}</p>
              </div>
            ))}
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
  perfil:        SecaoPerfil,
  empresa:       SecaoEmpresa,
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
