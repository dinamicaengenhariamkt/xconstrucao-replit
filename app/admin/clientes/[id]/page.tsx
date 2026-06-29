'use client';

import { useMemo, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { Card, CardContent } from '@shared/components/ui/card';
import { LuminousHoverCard } from '@shared/components/ui/LuminousHoverCard';
import { Badge } from '@shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Textarea } from '@shared/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs';
import { Button } from '@shared/components/ui/button';
import { ClienteObrasTab } from '@features/admin/clientes/components/ClienteObrasTab';
import { ClienteFinanceiroTab } from '@features/admin/clientes/components/ClienteFinanceiroTab';
import { ClienteDocumentosTab } from '@features/admin/clientes/components/ClienteDocumentosTab';
import { ClienteHistoricoTab } from '@features/admin/clientes/components/ClienteHistoricoTab';
import { HistoricoBloqueiosTimeline } from '@features/admin/shared/components/HistoricoBloqueiosTimeline';
import { EditarClienteModal } from '@features/admin/clientes/components/EditarClienteModal';
import { EditarObraModal } from '@features/admin/clientes/components/EditarObraModal';
import { AdicionarDocumentoModal } from '@features/admin/clientes/components/AdicionarDocumentoModal';
import { ResetarSenhaModal } from '@features/admin/clientes/components/ResetarSenhaModal';
import { BloquearClienteModal } from '@features/admin/clientes/components/BloquearClienteModal';
import {
  useAdminCliente,
  useAdminClienteObras,
  useAdminClienteFinanceiro,
  useAdminClienteDocumentos,
  useAdminClienteAtividades,
  useAprovarCliente,
} from '@features/admin/clientes/hooks/use-clientes';
import {
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiMailLine,
  RiPhoneLine,
  RiIdCardLine,
  RiCalendarLine,
  RiEdit2Line,
  RiLockPasswordLine,
  RiIndeterminateCircleLine,
  RiMapPinLine,
  RiSaveLine,
  RiLoaderLine,
  RiHammerLine,
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiUserLine,
  RiBuilding2Line,
  RiCheckLine,
  RiCloseCircleLine,
} from 'react-icons/ri';
import { useToast } from '@shared/hooks/use-toast';
import type { ClienteStatus, ClienteAtividade, AdminClienteObra, ClienteDocumento } from '@features/admin/clientes/types';
import { formatCurrency, getInitials } from '@shared/lib/formatters';

const STATUS_CONFIG: Record<ClienteStatus, { label: string; className: string }> = {
  ativo: {
    label: 'Ativo',
    className:
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  },
  inativo: {
    label: 'Inativo',
    className:
      'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  },
  pendente: {
    label: 'Pendente',
    className:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  },
  aprovacao: {
    label: 'Aguardando curadoria',
    className:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  },
};

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return `Há ${diffDays} dias`;
}

const TAB_LABELS: Record<string, string> = {
  obras: 'Obras',
  financeiro: 'Financeiro',
  documentos: 'Documentos',
  historico: 'Histórico',
  bloqueios: 'Bloqueios',
};

const TABS = ['obras', 'financeiro', 'documentos', 'historico', 'bloqueios'] as const;

export default function AdminClienteDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { toast } = useToast();
  const [editarOpen, setEditarOpen] = useState(false);
  const [resetarOpen, setResetarOpen] = useState(false);
  const [bloquearOpen, setBloquearOpen] = useState(false);
  const [obsValue, setObsValue] = useState<string | null>(null);
  const [isSavingObs, setIsSavingObs] = useState(false);
  const [localAtividades, setLocalAtividades] = useState<ClienteAtividade[]>([]);
  const [editarObraOpen, setEditarObraOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<AdminClienteObra | null>(null);
  const [obraOverrides, setObraOverrides] = useState<Record<string, AdminClienteObra>>({});
  const [addDocumentoOpen, setAddDocumentoOpen] = useState(false);
  const [addedDocumentos, setAddedDocumentos] = useState<ClienteDocumento[]>([]);
  const [deletedDocumentoIds, setDeletedDocumentoIds] = useState<string[]>([]);

  const { data: cliente, isLoading: loadingCliente } = useAdminCliente(id);
  const { mutateAsync: aprovarCliente, isPending: aprovando } = useAprovarCliente();

  const handleCuradoria = useCallback(
    async (decisao: 'aprovar' | 'reprovar') => {
      try {
        await aprovarCliente({ id, decisao });
        toast({
          title: decisao === 'aprovar' ? 'Cliente aprovado' : 'Cliente reprovado',
          description:
            decisao === 'aprovar'
              ? 'O cliente agora está ativo na plataforma.'
              : 'O cliente foi marcado como inativo.',
        });
      } catch (err) {
        toast({
          title: 'Erro',
          description: err instanceof Error ? err.message : 'Não foi possível atualizar a curadoria.',
          variant: 'destructive',
        });
      }
    },
    [aprovarCliente, id, toast],
  );
  const { data: obras = [], isLoading: loadingObras } = useAdminClienteObras(id);
  const { data: financeiro, isLoading: loadingFinanceiro } = useAdminClienteFinanceiro(id);
  const { data: documentos = [], isLoading: loadingDocumentos } = useAdminClienteDocumentos(id);
  const { data: atividades = [], isLoading: loadingAtividades } = useAdminClienteAtividades(id);

  const allAtividades = [...localAtividades, ...atividades];
  const obrasComOverrides = obras.map((o) => obraOverrides[o.id] ?? o);
  const allDocumentos = [
    ...addedDocumentos,
    ...documentos.filter((d) => !deletedDocumentoIds.includes(d.id)),
  ];

  function handleEditObraClick(obra: AdminClienteObra) {
    setEditingObra(obra);
    setEditarObraOpen(true);
  }

  function handleSaveObra(updated: AdminClienteObra) {
    setObraOverrides((prev) => ({ ...prev, [updated.id]: updated }));
  }

  function handleAddDocumento(doc: ClienteDocumento) {
    setAddedDocumentos((prev) => [doc, ...prev]);
  }

  function handleDeleteDocumento(id: string) {
    setAddedDocumentos((prev) => prev.filter((d) => d.id !== id));
    setDeletedDocumentoIds((prev) => [...prev, id]);
  }

  const handleSalvarObservacoes = useCallback(async () => {
    setIsSavingObs(true);
    await new Promise((r) => setTimeout(r, 800));
    const saved = obsValue ?? '';
    setIsSavingObs(false);
    setLocalAtividades((prev) => [
      {
        id: `nota-${Date.now()}`,
        tipo: 'nota' as const,
        titulo: 'Observação atualizada',
        descricao: saved.length > 80 ? `${saved.slice(0, 80)}...` : saved || 'Observação removida.',
        dataHora: new Date().toISOString(),
      },
      ...prev,
    ]);
    toast({ title: 'Observações salvas', description: 'Alterações registradas com sucesso.' });
  }, [obsValue, toast]);

  const kpis = useMemo(() => {
    const obrasAtivas = obras.filter((o) => o.status === 'em_andamento').length;
    const obrasConcluidas = obras.filter((o) => o.status === 'concluida').length;
    const ultimaAtividade = allAtividades[0];

    return [
      {
        label: 'Obras Ativas',
        value: String(obrasAtivas),
        sublabel: obrasAtivas > 0 ? `${obrasAtivas} em andamento` : 'Nenhuma ativa',
        icon: RiHammerLine,
        iconBg: 'bg-primary/10 dark:bg-primary/20',
        iconColor: 'text-primary',
      },
      {
        label: 'Volume Financeiro',
        value: cliente ? formatCurrency(cliente.valorTotalContratado) : '—',
        sublabel: 'Total contratado',
        icon: RiMoneyDollarCircleLine,
        iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        label: 'Obras Concluídas',
        value: String(obrasConcluidas),
        sublabel: 'Histórico completo',
        icon: RiCheckboxCircleLine,
        iconBg: 'bg-blue-50 dark:bg-blue-900/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
      },
      {
        label: 'Última Atividade',
        value: ultimaAtividade ? formatRelativeDate(ultimaAtividade.dataHora) : '—',
        sublabel: ultimaAtividade ? ultimaAtividade.titulo : 'Sem atividades',
        icon: RiTimeLine,
        iconBg: 'bg-amber-50 dark:bg-amber-900/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
      },
    ];
  }, [obras, allAtividades, cliente]);

  if (loadingCliente) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-52 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-52 rounded-3xl" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <Link href="/admin/clientes" data-testid="link-back-clientes">
          <Button variant="ghost" size="sm">
            <RiArrowLeftLine className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="text-center py-16">
          <RiUserLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500">Cliente não encontrado</h3>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[cliente.status];

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-cliente-detail-page">

      {/* ① Navegação + Breadcrumb */}
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/clientes"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
          data-testid="link-back-clientes"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-1.5 text-sm">
          <Link href="/admin/clientes" className="text-muted-foreground hover:text-primary transition-colors">
            Clientes
          </Link>
          <RiArrowRightSLine className="w-4 h-4 text-gray-400" />
          <span className="font-bold text-gray-900 dark:text-white">{cliente.nome}</span>
        </div>
      </div>

      {/* ② Hero Card */}
      <Card className="rounded-3xl" data-testid="card-hero-cliente">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Avatar + Dados */}
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar className="h-20 w-20 flex-shrink-0" data-testid="avatar-cliente-detail">
                {cliente.avatarUrl && <AvatarImage src={cliente.avatarUrl} alt={cliente.nome} />}
                <AvatarFallback className="bg-primary text-white text-2xl font-bold rounded-full">
                  {getInitials(cliente.nome)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col gap-3">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {cliente.nome}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    {cliente.tipo === 'pessoa_juridica' ? (
                      <RiBuilding2Line className="w-4 h-4" />
                    ) : (
                      <RiUserLine className="w-4 h-4" />
                    )}
                    {cliente.tipo === 'pessoa_juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <RiMailLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{cliente.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <RiPhoneLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{cliente.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <RiIdCardLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{cliente.tipo === 'pessoa_juridica' ? 'CNPJ' : 'CPF'}: {cliente.cpfCnpj}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap mt-1">
                  <Badge
                    className={cn(
                      'rounded-full text-xs font-bold px-3 py-1 no-default-hover-elevate no-default-active-elevate',
                      status.className,
                    )}
                    data-testid="badge-status-detail"
                  >
                    {status.label}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RiCalendarLine className="w-3.5 h-3.5" />
                    <span>Cadastrado em: {new Date(cliente.dataCadastro).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-wrap gap-3 lg:flex-shrink-0">
              {(cliente.status === 'pendente' || cliente.status === 'aprovacao') && (
                <>
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg border transition-colors cursor-pointer bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/40 disabled:opacity-50"
                    onClick={() => handleCuradoria('aprovar')}
                    disabled={aprovando}
                    data-testid="button-aprovar-cliente"
                  >
                    <RiCheckLine className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg border transition-colors cursor-pointer bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40 disabled:opacity-50"
                    onClick={() => handleCuradoria('reprovar')}
                    disabled={aprovando}
                    data-testid="button-reprovar-cliente"
                  >
                    <RiCloseCircleLine className="w-4 h-4" />
                    Reprovar
                  </button>
                </>
              )}
              <button
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                onClick={() => setEditarOpen(true)}
                data-testid="button-editar-dados"
              >
                <RiEdit2Line className="w-4 h-4" />
                Editar Dados
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg border transition-colors cursor-pointer bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/40"
                onClick={() => setResetarOpen(true)}
                data-testid="button-reset-senha"
              >
                <RiLockPasswordLine className="w-4 h-4" />
                Resetar Senha
              </button>
              <button
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg border transition-colors cursor-pointer',
                  cliente.status === 'inativo'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/40'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40',
                )}
                onClick={() => setBloquearOpen(true)}
                data-testid="button-bloquear"
              >
                <RiIndeterminateCircleLine className="w-4 h-4" />
                {cliente.status === 'inativo' ? 'Desbloquear' : 'Bloquear Acesso'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ③ KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <LuminousHoverCard
            key={kpi.label}
            className="rounded-3xl"
            cardClassName="rounded-3xl"
            testId={`kpi-detail-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}
          >
              <CardContent className="relative z-10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm text-muted-foreground font-medium">{kpi.label}</p>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2 leading-tight tabular-nums">
                      {kpi.value}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-1 truncate">{kpi.sublabel}</p>
                  </div>
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', kpi.iconBg)}>
                    <kpi.icon className={cn('w-6 h-6', kpi.iconColor)} />
                  </div>
                </div>
              </CardContent>
          </LuminousHoverCard>
        ))}
      </div>

      {/* ④ Tabs */}
      <Card className="rounded-3xl" data-testid="card-tabs-cliente">
        <CardContent className="p-8">
          <Tabs defaultValue="obras">
            <TabsList className="w-full justify-start bg-transparent border-b border-gray-100 dark:border-gray-800 rounded-none h-auto p-0 gap-6 mb-6">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className={cn(
                    'relative pb-3 px-0 rounded-none bg-transparent shadow-none',
                    'border-b-2 border-transparent',
                    'data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-bold',
                    'data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                    'text-sm font-medium text-muted-foreground cursor-pointer hover:text-primary transition-colors',
                    'whitespace-nowrap',
                  )}
                  data-testid={`tab-${tab}`}
                >
                  {TAB_LABELS[tab]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="obras" className="mt-0">
              <ClienteObrasTab
                obras={obrasComOverrides}
                isLoading={loadingObras}
                onEditObra={handleEditObraClick}
              />
            </TabsContent>
            <TabsContent value="financeiro" className="mt-0">
              <ClienteFinanceiroTab financeiro={financeiro} isLoading={loadingFinanceiro} />
            </TabsContent>
            <TabsContent value="documentos" className="mt-0">
              <ClienteDocumentosTab
                documentos={allDocumentos}
                isLoading={loadingDocumentos}
                onAddDocumento={() => setAddDocumentoOpen(true)}
                onDeleteDocumento={handleDeleteDocumento}
              />
            </TabsContent>
            <TabsContent value="historico" className="mt-0">
              <ClienteHistoricoTab atividades={allAtividades} isLoading={loadingAtividades} />
            </TabsContent>
            <TabsContent value="bloqueios" className="mt-0">
              <div className="py-2">
                <HistoricoBloqueiosTimeline
                  historico={cliente.historicoBloqueios}
                  emptyMessage="Este cliente nunca foi bloqueado."
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ⑤ Endereço e Informações Adicionais */}
      <Card className="rounded-3xl" data-testid="card-endereco-cliente">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <RiMapPinLine className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Endereço e Informações Adicionais
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Endereço */}
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                  Endereço Completo
                </p>
                <p className="text-sm text-gray-900 dark:text-white">{cliente.endereco}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                    Cidade
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">{cliente.cidade}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                    Estado
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">{cliente.estado}</p>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                Observações
              </p>
              <Textarea
                className="h-32 bg-gray-50 dark:bg-gray-800/50 resize-none text-sm"
                placeholder="Adicione observações sobre este cliente..."
                value={obsValue ?? (cliente.observacoes ?? '')}
                onChange={(e) => setObsValue(e.target.value)}
                data-testid="textarea-observacoes"
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSalvarObservacoes}
                  disabled={isSavingObs || (obsValue ?? (cliente.observacoes ?? '')) === (cliente.observacoes ?? '')}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-salvar-observacoes"
                >
                  {isSavingObs ? (
                    <>
                      <RiLoaderLine className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <RiSaveLine className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <EditarClienteModal
        open={editarOpen}
        onOpenChange={setEditarOpen}
        cliente={cliente}
      />
      <ResetarSenhaModal
        open={resetarOpen}
        onOpenChange={setResetarOpen}
        clienteId={cliente.id}
        nomeCliente={cliente.nome}
        emailCliente={cliente.email}
      />
      <BloquearClienteModal
        open={bloquearOpen}
        onOpenChange={setBloquearOpen}
        cliente={cliente}
      />
      {editingObra && (
        <EditarObraModal
          open={editarObraOpen}
          onOpenChange={setEditarObraOpen}
          obra={editingObra}
          onSave={handleSaveObra}
        />
      )}
      <AdicionarDocumentoModal
        open={addDocumentoOpen}
        onOpenChange={setAddDocumentoOpen}
        onSave={handleAddDocumento}
      />

    </div>
  );
}
