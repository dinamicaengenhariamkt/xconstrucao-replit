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
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiFileTextLine,
  RiShieldCheckLine,
  RiAlertLine,
} from 'react-icons/ri';
import { useAuth } from '@features/auth/hooks/use-auth';
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
import { Switch } from '@shared/components/ui/switch';
import { Label } from '@shared/components/ui/label';
import { Badge } from '@shared/components/ui/badge';
import { cn } from '@shared/lib/utils';
import { useToast } from '@shared/hooks/use-toast';

/* ── Types ── */
type Section = 'perfil' | 'empresa' | 'notificacoes' | 'privacidade' | 'plano' | 'pagamentos';

const VALID_SECTIONS: Section[] = ['perfil', 'empresa', 'notificacoes', 'privacidade', 'plano', 'pagamentos'];

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'perfil',       label: 'Perfil',        icon: RiUser3Line },
  { id: 'empresa',      label: 'Minha Empresa', icon: RiBuildingLine },
  { id: 'notificacoes', label: 'Notificações',  icon: RiBellLine },
  { id: 'privacidade',  label: 'Privacidade',   icon: RiShieldLine },
  { id: 'plano',        label: 'Plano & Uso',   icon: RiStarLine },
  { id: 'pagamentos',   label: 'Pagamentos',    icon: RiMoneyDollarCircleLine },
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
function SecaoPerfil() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [dados, setDados] = useState({
    nome: user?.name ?? '',
    email: user?.email ?? '',
    telefone: '',
  });

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

  const handleSaveDados = () => {
    toast({ title: 'Dados salvos', description: 'Suas informações pessoais foram atualizadas.' });
  };

  const handleAlterarSenha = () => {
    if (!senhaValida) return;
    toast({ title: 'Senha alterada', description: 'Sua senha foi atualizada com sucesso.' });
    setSenha({ atual: '', nova: '', confirmar: '' });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Dados pessoais</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <FieldRow label="Nome completo">
            <Input value={dados.nome} onChange={setDado('nome')} placeholder="Seu nome completo" />
          </FieldRow>
          <FieldRow label="E-mail" description="Usado para login e comunicações da plataforma.">
            <Input type="email" value={dados.email} onChange={setDado('email')} placeholder="seu@email.com" />
          </FieldRow>
          <FieldRow label="Telefone" description="Número de contato para suporte e obras.">
            <Input type="tel" value={dados.telefone} onChange={setDado('telefone')} placeholder="(11) 9 0000-0000" />
          </FieldRow>
          <FieldRow label="Perfil" description="Definido pelo sistema. Contate o suporte para alterar.">
            <Input value="Contratante" disabled className="opacity-60 cursor-not-allowed" />
          </FieldRow>
          <div className="flex justify-end">
            <button
              onClick={handleSaveDados}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              <RiSave3Line className="w-4 h-4" />
              Salvar dados
            </button>
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
const OBRAS_INTERESSE_OPTIONS = [
  'Residencial', 'Comercial', 'Industrial', 'Reforma', 'Infraestrutura',
  'Retrofit', 'Obras Públicas', 'Incorporação', 'Condomínios', 'Hospitalares',
];

function SecaoEmpresa() {
  const { toast } = useToast();
  const [empresa, setEmpresa] = useState({
    razaoSocial: 'Incorporadora Horizonte Ltda',
    nomeFantasia: 'Horizonte Empreendimentos',
    cnpj: '98.765.432/0001-10',
    inscricaoEstadual: '987.654.321.000',
    estado: 'SP',
    cidade: 'São Paulo e região',
  });
  const [obrasInteresse, setObrasInteresse] = useState<string[]>(['Residencial', 'Comercial', 'Incorporação']);

  const setField = (key: keyof typeof empresa) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmpresa((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleObra = (tipo: string) => {
    setObrasInteresse((prev) =>
      prev.includes(tipo) ? prev.filter((o) => o !== tipo) : [...prev, tipo]
    );
  };

  const handleSave = () => {
    toast({ title: 'Empresa atualizada', description: 'Os dados da sua empresa foram salvos.' });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Dados da empresa</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="Razão social">
              <Input value={empresa.razaoSocial} onChange={setField('razaoSocial')} placeholder="Razão social" />
            </FieldRow>
            <FieldRow label="Nome fantasia">
              <Input value={empresa.nomeFantasia} onChange={setField('nomeFantasia')} placeholder="Nome fantasia" />
            </FieldRow>
            <FieldRow label="CNPJ" description="Apenas para exibição. Contate o suporte para alterar.">
              <Input value={empresa.cnpj} disabled className="opacity-60 cursor-not-allowed" />
            </FieldRow>
            <FieldRow label="Inscrição estadual">
              <Input value={empresa.inscricaoEstadual} onChange={setField('inscricaoEstadual')} placeholder="000.000.000.000" />
            </FieldRow>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-0">
          <SectionTitle>Localização e atuação</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="Estado principal">
              <Input value={empresa.estado} onChange={setField('estado')} placeholder="Ex: SP" />
            </FieldRow>
            <FieldRow label="Cidade / Região de atuação">
              <Input value={empresa.cidade} onChange={setField('cidade')} placeholder="Ex: São Paulo e região" />
            </FieldRow>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Tipos de obras de interesse{' '}
              <span className="text-xs text-muted-foreground ml-1">({obrasInteresse.length} selecionados)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {OBRAS_INTERESSE_OPTIONS.map((tipo) => {
                const ativo = obrasInteresse.includes(tipo);
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => toggleObra(tipo)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                      ativo
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    )}
                  >
                    {tipo}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <RiSave3Line className="w-4 h-4 mr-2" />
          Salvar empresa
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Notificações
───────────────────────────────────────────── */
function SecaoNotificacoes() {
  const { toast } = useToast();
  const [email, setEmail] = useState({
    novaProposta: true,
    medicao: true,
    prazo: true,
    contrato: true,
  });
  const [sistema, setSistema] = useState({
    documentos: true,
    reuniao: true,
  });

  const toggleEmail = (key: keyof typeof email) => () =>
    setEmail((p) => ({ ...p, [key]: !p[key] }));
  const toggleSistema = (key: keyof typeof sistema) => () =>
    setSistema((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    toast({ title: 'Preferências salvas', description: 'Suas notificações foram atualizadas.' });
  };

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
            checked={email.novaProposta}
            onCheckedChange={toggleEmail('novaProposta')}
          />
          <SwitchRow
            label="Medição submetida pelo empreiteiro"
            description="Notificação quando um empreiteiro submeter uma medição de etapa para sua aprovação."
            checked={email.medicao}
            onCheckedChange={toggleEmail('medicao')}
          />
          <SwitchRow
            label="Prazo de etapa próximo"
            description="Aviso quando um prazo de entrega de etapa estiver se aproximando."
            checked={email.prazo}
            onCheckedChange={toggleEmail('prazo')}
          />
          <SwitchRow
            label="Contrato disponível para assinatura"
            description="Aviso quando um contrato digital estiver disponível para sua assinatura."
            checked={email.contrato}
            onCheckedChange={toggleEmail('contrato')}
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
            checked={sistema.documentos}
            onCheckedChange={toggleSistema('documentos')}
          />
          <SwitchRow
            label="Lembretes de reunião"
            description="Notificação 1 hora antes de reuniões agendadas com empreiteiros."
            checked={sistema.reuniao}
            onCheckedChange={toggleSistema('reuniao')}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <RiSave3Line className="w-4 h-4 mr-2" />
          Salvar preferências
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
    revokeAll,
  } = useContratanteTermosStore();

  const [prefs, setPrefs] = useState({
    perfilPublico: true,
    portfOlioObras: true,
    telefone: false,
    convites: true,
  });

  const toggle = (key: keyof typeof prefs) => (v: boolean) =>
    setPrefs((p) => ({ ...p, [key]: v }));

  const handleSave = () => {
    toast({ title: 'Privacidade atualizada', description: 'Suas preferências de visibilidade foram salvas.' });
  };

  const handleRevoke = async () => {
    revokeAll();
    await logout();
    router.push('/login');
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
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <RiSave3Line className="w-4 h-4 mr-2" />
          Salvar privacidade
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Plano
───────────────────────────────────────────── */
const PLAN_USAGE = [
  { label: 'Obras abertas', current: 3, max: 10 },
  { label: 'Empreiteiros contratados', current: 7, max: 20 },
  { label: 'Documentos gerados', current: 15, max: 50 },
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
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <SectionTitle>Plano atual</SectionTitle>
            <Badge className="bg-[#22846D]/10 text-[#22846D] border-0 text-xs">Ativo</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-2 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Plano Empresarial</p>
              <p className="text-xs text-muted-foreground mt-0.5">Renovação em 15/07/2026</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/contratante/planos')}>
              Ver planos disponíveis
              <RiExternalLinkLine className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Uso do plano</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
   SECTION: Pagamentos
───────────────────────────────────────────── */
function SecaoPagamentos() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pagamentos</p>
        </CardHeader>
        <CardContent className="p-6 pt-2 flex flex-col gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Acesse seu histórico de pagamentos, notas fiscais e contratos financeiros das suas obras.
          </p>
          <Button onClick={() => router.push('/contratante/pagamentos')} className="w-fit">
            <RiMoneyDollarCircleLine className="w-4 h-4 mr-2" />
            Ver pagamentos
            <RiExternalLinkLine className="w-3.5 h-3.5 ml-2" />
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
  empresa:      SecaoEmpresa,
  notificacoes: SecaoNotificacoes,
  privacidade:  SecaoPrivacidade,
  plano:        SecaoPlano,
  pagamentos:   SecaoPagamentos,
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
