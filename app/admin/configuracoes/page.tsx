'use client';

import { useState } from 'react';
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
} from 'react-icons/ri';
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

/* ── Types ── */
type Section = 'geral' | 'notificacoes' | 'plataforma' | 'seguranca' | 'integracoes';

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'geral',        label: 'Geral',         icon: RiSettings3Line },
  { id: 'notificacoes', label: 'Notificações',   icon: RiBellLine },
  { id: 'plataforma',   label: 'Plataforma',     icon: RiToggleLine },
  { id: 'seguranca',    label: 'Segurança',      icon: RiShieldLine },
  { id: 'integracoes',  label: 'Integrações',    icon: RiPlugLine },
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
   SECTION: Geral
───────────────────────────────────────────── */
function SecaoGeral() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nome: 'ConectaObra',
    descricao: 'Plataforma de gestão de obras e conexão entre contratantes e empreiteiras.',
    email: 'suporte@conectaobra.com.br',
    cnpj: '12.345.678/0001-99',
    timezone: 'America/Sao_Paulo',
    idioma: 'pt-BR',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    toast({ title: 'Alterações salvas', description: 'As configurações gerais foram atualizadas.' });
  };

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
        <Button onClick={handleSave}>
          <RiSave3Line className="w-4 h-4 mr-2" />
          Salvar alterações
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
    novoCliente: true,
    novaObra: true,
    pagamento: true,
    contrato: false,
    campanhaExpirando: true,
  });
  const [sistema, setSistema] = useState({
    manutencao: true,
    relatorioSemanal: false,
    atualizacoes: true,
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
          <div className="flex items-center gap-2">
            <RiGlobalLine className="w-4 h-4 text-gray-400" />
            <SectionTitle>Notificações por e-mail</SectionTitle>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-0">
          <SwitchRow
            label="Novo cliente cadastrado"
            description="Receba um e-mail quando um novo cliente completar o cadastro."
            checked={email.novoCliente}
            onCheckedChange={toggleEmail('novoCliente')}
          />
          <SwitchRow
            label="Nova obra criada"
            description="Notificação quando uma nova obra for cadastrada na plataforma."
            checked={email.novaObra}
            onCheckedChange={toggleEmail('novaObra')}
          />
          <SwitchRow
            label="Pagamento recebido"
            description="Confirmação de pagamento processado com sucesso."
            checked={email.pagamento}
            onCheckedChange={toggleEmail('pagamento')}
          />
          <SwitchRow
            label="Contrato assinado"
            description="Aviso quando um contrato for assinado entre as partes."
            checked={email.contrato}
            onCheckedChange={toggleEmail('contrato')}
          />
          <SwitchRow
            label="Campanha de anúncio expirando"
            description="Alerta 3 dias antes do vencimento de uma campanha ativa."
            checked={email.campanhaExpirando}
            onCheckedChange={toggleEmail('campanhaExpirando')}
          />
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <RiBellLine className="w-4 h-4 text-gray-400" />
            <SectionTitle>Notificações do sistema</SectionTitle>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-4 pt-0">
          <SwitchRow
            label="Alertas de manutenção"
            description="Avisos sobre janelas de manutenção programada."
            checked={sistema.manutencao}
            onCheckedChange={toggleSistema('manutencao')}
          />
          <SwitchRow
            label="Relatório semanal automático"
            description="Resumo de métricas enviado toda segunda-feira às 8h."
            checked={sistema.relatorioSemanal}
            onCheckedChange={toggleSistema('relatorioSemanal')}
          />
          <SwitchRow
            label="Atualizações da plataforma"
            description="Novidades e melhorias publicadas na plataforma."
            checked={sistema.atualizacoes}
            onCheckedChange={toggleSistema('atualizacoes')}
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
   SECTION: Plataforma
───────────────────────────────────────────── */

const PLAN_LIMITS = [
  { label: 'Clientes ativos', current: 47, max: 100 },
  { label: 'Obras ativas', current: 23, max: 50 },
  { label: 'Admins', current: 2, max: 5 },
];

function PlanMeterBadge({ current, max }: { current: number; max: number }) {
  const pct = current / max;
  if (pct > 0.95) return <Badge className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-0 text-xs">{current}/{max}</Badge>;
  if (pct > 0.8)  return <Badge className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-0 text-xs">{current}/{max}</Badge>;
  return <Badge className="bg-[#22846D]/10 text-[#22846D] border-0 text-xs">{current}/{max}</Badge>;
}

function SecaoPlataforma() {
  const { toast } = useToast();
  const [features, setFeatures] = useState({
    anuncios: true,
    faq: true,
    empreiteiras: true,
    clienteLogin: true,
    manutencao: false,
    relatorios: false,
  });
  const toggle = (key: keyof typeof features) => (v: boolean) =>
    setFeatures((p) => ({ ...p, [key]: v }));

  const handleSave = () => {
    toast({ title: 'Configurações salvas', description: 'As funcionalidades da plataforma foram atualizadas.' });
  };

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

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Limites do plano atual</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {PLAN_LIMITS.map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 flex flex-col gap-2"
              >
                <p className="text-xs text-gray-400">{item.label}</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.current}</p>
                  <PlanMeterBadge current={item.current} max={item.max} />
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Plano Business</p>
              <p className="text-xs text-muted-foreground">Renovação em 15/03/2026</p>
            </div>
            <Button variant="ghost" size="sm">
              Ver detalhes do plano
              <RiExternalLinkLine className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <RiSave3Line className="w-4 h-4 mr-2" />
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Segurança
───────────────────────────────────────────── */

const MOCK_SESSIONS = [
  { id: 'sess-001', device: 'Chrome · macOS', ip: '187.45.23.101', since: '24/02/2026 às 09:14', isCurrentSession: true, icon: RiComputerLine },
  { id: 'sess-002', device: 'Safari · iPhone', ip: '187.45.23.102', since: '23/02/2026 às 18:32', isCurrentSession: false, icon: RiSmartphoneLine },
  { id: 'sess-003', device: 'Firefox · Windows', ip: '201.10.55.77', since: '22/02/2026 às 14:05', isCurrentSession: false, icon: RiComputerLine },
];

function SecaoSeguranca() {
  const { toast } = useToast();
  const [politica, setPolitica] = useState({
    timeout: '30',
    maxTentativas: '5',
    senhaMinima: '8',
  });
  const [doisFatores, setDoisFatores] = useState({
    admins: false,
    todos: false,
  });

  const handleSave = () => {
    toast({ title: 'Políticas atualizadas', description: 'As configurações de segurança foram salvas.' });
  };

  const handleEncerrarSessoes = () => {
    toast({ title: 'Sessões encerradas', description: 'Todas as outras sessões foram encerradas com sucesso.' });
  };

  const doisFatoresAtivo = doisFatores.admins || doisFatores.todos;

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

      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Sessões ativas</SectionTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2 flex flex-col gap-3">
          {MOCK_SESSIONS.map((session) => {
            const Icon = session.icon;
            return (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{session.device}</p>
                    {session.isCurrentSession && (
                      <Badge className="bg-[#22846D]/10 text-[#22846D] border-0 text-xs">Sessão atual</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{session.ip} · {session.since}</p>
                </div>
              </div>
            );
          })}
          <div className="flex justify-end mt-2">
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/10" onClick={handleEncerrarSessoes}>
              Encerrar todas as outras sessões
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <RiSave3Line className="w-4 h-4 mr-2" />
          Salvar políticas
        </Button>
      </div>
    </div>
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

function SecaoIntegracoes() {
  const { toast } = useToast();
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<Set<WebhookEventId>>(
    new Set(['novo_cliente', 'pagamento_recebido'])
  );
  const [testingWebhook, setTestingWebhook] = useState(false);

  const API_KEY_MASKED = 'sk-live-••••••••••••••••••••••••';
  const API_KEY_REAL   = 'sk-live-a7f3d92e1b8c4056f9e2d3a1';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(API_KEY_REAL).catch(() => {});
    toast({ title: 'Chave copiada', description: 'A chave de API foi copiada para a área de transferência.' });
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      setRegenerating(false);
      toast({ title: 'Chave regenerada', description: 'Uma nova chave de API foi gerada. A anterior foi revogada.' });
    }, 1200);
  };

  const handleTestWebhook = () => {
    if (!webhookUrl) return;
    setTestingWebhook(true);
    setTimeout(() => {
      setTestingWebhook(false);
      toast({ title: 'Webhook testado', description: 'Evento de teste enviado com sucesso para a URL configurada.' });
    }, 1500);
  };

  const toggleEvent = (eventId: WebhookEventId) => {
    setWebhookEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const handleSaveWebhook = () => {
    toast({ title: 'Webhook salvo', description: 'As configurações de webhook foram atualizadas.' });
  };

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
              value={apiKeyVisible ? API_KEY_REAL : API_KEY_MASKED}
              readOnly
              className="font-mono text-sm bg-gray-50 dark:bg-gray-800/60"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setApiKeyVisible((v) => !v)}
              title={apiKeyVisible ? 'Ocultar chave' : 'Revelar chave'}
              className="shrink-0"
            >
              {apiKeyVisible ? (
                <RiCheckLine className="w-4 h-4" />
              ) : (
                <RiFileCopyLine className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyKey}
              title="Copiar chave"
              className="shrink-0"
            >
              <RiFileCopyLine className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Criada em 01/01/2026 · Último uso: 24/02/2026 às 14:22</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Regenerar chave</p>
              <p className="text-xs text-muted-foreground mt-0.5">A chave atual será revogada imediatamente.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-900/30 dark:hover:bg-amber-900/10"
            >
              <RiRefreshLine className={cn('w-4 h-4 mr-2', regenerating && 'animate-spin')} />
              {regenerating ? 'Gerando...' : 'Regenerar'}
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
            <Button onClick={handleSaveWebhook}>
              <RiSave3Line className="w-4 h-4 mr-2" />
              Salvar webhook
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
  geral:        SecaoGeral,
  notificacoes: SecaoNotificacoes,
  plataforma:   SecaoPlataforma,
  seguranca:    SecaoSeguranca,
  integracoes:  SecaoIntegracoes,
};

export default function AdminConfiguracoesPage() {
  const [activeSection, setActiveSection] = useState<Section>('geral');

  const SectionComponent = SECTION_COMPONENTS[activeSection];

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
