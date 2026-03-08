'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { Card, CardContent } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Textarea } from '@shared/components/ui/textarea';
import { EmpreiteiraObrasSection } from '@features/admin/empreiteiras/components/EmpreiteiraObrasSection';
import { EditarEmpreiteiraModal } from '@features/admin/empreiteiras/components/EditarEmpreiteiraModal';
import { ResetarAcessoModal } from '@features/admin/empreiteiras/components/ResetarAcessoModal';
import { BloquearEmpreiteiraModal } from '@features/admin/empreiteiras/components/BloquearEmpreiteiraModal';
import {
  useAdminEmpreiteira,
  useAdminEmpreiteiraObras,
} from '@features/admin/empreiteiras/hooks/use-empreiteiras';
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
  RiHammerLine,
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiStarFill,
  RiBuilding2Line,
  RiGlobalLine,
  RiMedalLine,
  RiUserStarLine,
} from 'react-icons/ri';
import type { EmpreiteiraStatus } from '@features/admin/empreiteiras/types';
import { formatCurrency } from '@shared/lib/formatters';

// ─── Utilities ────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('pt-BR');

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<EmpreiteiraStatus, { label: string; className: string }> = {
  ativa: {
    label: 'Ativa',
    className:
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  },
  inativa: {
    label: 'Inativa',
    className:
      'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  },
  suspensa: {
    label: 'Suspensa',
    className:
      'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  },
  pendente: {
    label: 'Pendente',
    className:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  },
};

const KPI_HOVER = {
  whileHover: {
    scale: 1.01 as number,
    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.06)',
  },
  transition: { duration: 0.2 },
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminEmpreiteiraDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [editarOpen, setEditarOpen] = useState(false);
  const [resetarOpen, setResetarOpen] = useState(false);
  const [bloquearOpen, setBloquearOpen] = useState(false);

  const { data: empreiteira, isLoading: loadingEmpreiteira } = useAdminEmpreiteira(id);
  const { data: obras = [], isLoading: loadingObras } = useAdminEmpreiteiraObras(id);

  const kpis = useMemo(() => {
    if (!empreiteira) return [];

    const obrasConcluidas =
      empreiteira.obrasConcluidas ?? obras.filter((o) => o.status === 'concluida').length;

    const notaFormatted =
      empreiteira.nota > 0
        ? `${empreiteira.nota.toFixed(1).replace('.', ',')} / 5,0`
        : '— / 5,0';

    return [
      {
        label: 'Obras Ativas',
        value: String(empreiteira.obrasEmAndamento),
        sublabel: '+2 nos últimos 3 meses',
        icon: RiHammerLine,
        iconBg: 'bg-primary/10 dark:bg-primary/20',
        iconColor: 'text-primary',
      },
      {
        label: 'Volume Contratado',
        value: formatCurrency(empreiteira.valorTotalContratado),
        sublabel: 'Obras ativas e em execução',
        icon: RiMoneyDollarCircleLine,
        iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        label: 'Obras Concluídas',
        value: String(obrasConcluidas),
        sublabel: 'Nos últimos 24 meses',
        icon: RiCheckboxCircleLine,
        iconBg: 'bg-blue-50 dark:bg-blue-900/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
      },
      {
        label: 'Índice de Desempenho',
        value: notaFormatted,
        sublabel: 'Média de avaliações dos contratantes',
        icon: RiStarFill,
        iconBg: 'bg-amber-50 dark:bg-amber-900/20',
        iconColor: 'text-amber-500 dark:text-amber-400',
      },
    ];
  }, [empreiteira, obras]);

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loadingEmpreiteira) {
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
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-52 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  // ─── Not found ────────────────────────────────────────────────────────────

  if (!empreiteira) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <Link
          href="/admin/empreiteiras"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
          data-testid="link-back-empreiteiras"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Voltar para Empreiteiras
        </Link>
        <div className="text-center py-16">
          <RiBuilding2Line className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500">Empreiteira não encontrada</h3>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[empreiteira.status];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-empreiteira-detail-page">

      {/* ① Breadcrumb */}
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/empreiteiras"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
          data-testid="link-back-empreiteiras"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Voltar para Empreiteiras
        </Link>
        <div className="flex items-center gap-1.5 text-sm">
          <Link href="/admin/empreiteiras" className="text-muted-foreground hover:text-primary transition-colors">
            Empreiteiras
          </Link>
          <RiArrowRightSLine className="w-4 h-4 text-gray-400" />
          <span className="font-bold text-gray-900 dark:text-white">{empreiteira.razaoSocial}</span>
        </div>
      </div>

      {/* ② Hero Card */}
      <Card className="rounded-3xl" data-testid="card-hero-empreiteira">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

            {/* Avatar + Dados */}
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar className="h-20 w-20 flex-shrink-0" data-testid="avatar-empreiteira-detail">
                {empreiteira.avatarUrl && (
                  <AvatarImage src={empreiteira.avatarUrl} alt={empreiteira.razaoSocial} />
                )}
                <AvatarFallback className="bg-primary text-white text-2xl font-bold rounded-full">
                  {getInitials(empreiteira.nomeFantasia || empreiteira.razaoSocial)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col gap-3">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {empreiteira.razaoSocial}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">{empreiteira.nomeFantasia}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <RiIdCardLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>CNPJ: {empreiteira.cnpj}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <RiHammerLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{empreiteira.especialidades.join(' · ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <RiMapPinLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{empreiteira.cidade} - {empreiteira.estado}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <RiCalendarLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>Cadastrado em: {formatDate(empreiteira.dataCadastro)}</span>
                  </div>
                </div>

                <div className="mt-1">
                  <Badge
                    className={cn(
                      'inline-flex rounded-full text-xs font-bold px-3 py-1 no-default-hover-elevate no-default-active-elevate',
                      status.className,
                    )}
                    data-testid="badge-status-detail"
                  >
                    {status.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 lg:flex-shrink-0">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                onClick={() => setEditarOpen(true)}
                data-testid="button-editar-dados"
              >
                <RiEdit2Line className="w-4 h-4" />
                Editar Dados
              </button>
              <button
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg border transition-colors cursor-pointer',
                  empreiteira.status === 'suspensa' || empreiteira.status === 'inativa'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/40'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40',
                )}
                onClick={() => setBloquearOpen(true)}
                data-testid="button-bloquear"
              >
                <RiIndeterminateCircleLine className="w-4 h-4" />
                {empreiteira.status === 'suspensa' || empreiteira.status === 'inativa'
                  ? 'Reativar Empreiteira'
                  : 'Bloquear Empreiteira'}
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg border transition-colors cursor-pointer bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/40"
                onClick={() => setResetarOpen(true)}
                data-testid="button-reset-acesso"
              >
                <RiLockPasswordLine className="w-4 h-4" />
                Resetar Acesso
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ③ KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <motion.div
            key={kpi.label}
            className="rounded-3xl overflow-visible"
            {...KPI_HOVER}
          >
            <Card
              className="h-full rounded-3xl"
              data-testid={`kpi-detail-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <CardContent className="p-6">
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
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ④ Dados Cadastrais e Endereço */}
      <Card className="rounded-3xl" data-testid="card-dados-cadastrais">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <RiBuilding2Line className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Dados Cadastrais e Endereço
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Esquerda: Dados da empresa */}
            <div className="flex flex-col gap-4">
              <LabelValue label="Razão Social" value={empreiteira.razaoSocial} />
              <LabelValue label="Nome Fantasia" value={empreiteira.nomeFantasia} />
              <LabelValue label="CNPJ" value={empreiteira.cnpj} />
              <LabelValue label="Inscrição Estadual" value={empreiteira.inscricaoEstadual ?? '—'} />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                  Especialidades
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {empreiteira.especialidades.map((esp) => (
                    <Badge
                      key={esp}
                      variant="outline"
                      className="rounded-full text-xs px-2.5 py-0.5 no-default-hover-elevate no-default-active-elevate"
                      data-testid={`badge-especialidade-detail-${esp}`}
                    >
                      {esp}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Direita: Endereço e contato */}
            <div className="flex flex-col gap-4">
              <LabelValue
                label="Endereço"
                value={
                  empreiteira.bairro
                    ? `${empreiteira.endereco}, ${empreiteira.bairro}`
                    : empreiteira.endereco
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <LabelValue label="Cidade" value={empreiteira.cidade} />
                <LabelValue label="Estado" value={empreiteira.estado} />
              </div>
              <LabelValue label="CEP" value={empreiteira.cep ?? '—'} />
              <LabelValue label="E-mail da empresa" value={empreiteira.email} />
              <LabelValue label="Telefone comercial" value={empreiteira.telefone} />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                  Site
                </p>
                {empreiteira.site ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <RiGlobalLine className="w-4 h-4 flex-shrink-0" />
                    <span>{empreiteira.site.replace(/^https?:\/\//, '')}</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-900 dark:text-white">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Observações internas */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
              Observações internas
            </p>
            <p className="text-[11px] text-muted-foreground mb-2">
              Visível apenas para administradores da plataforma
            </p>
            <Textarea
              className="h-32 bg-gray-50 dark:bg-gray-800/50 resize-none text-sm"
              placeholder="Adicione observações internas sobre esta empreiteira..."
              defaultValue={empreiteira.observacoes ?? ''}
              data-testid="textarea-observacoes"
            />
            <div className="flex justify-end mt-4">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                data-testid="button-salvar-observacoes"
              >
                <RiSaveLine className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⑤ Responsável Técnico */}
      <Card className="rounded-3xl" data-testid="card-responsavel-tecnico">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <RiUserStarLine className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Responsável Técnico
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarFallback className="bg-blue-600 text-white text-lg font-bold rounded-full">
                {getInitials(empreiteira.responsavel)}
              </AvatarFallback>
            </Avatar>

            {/* Dados do responsável */}
            <div className="flex flex-col gap-3 flex-1">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {empreiteira.responsavel}
                  </h3>
                  {empreiteira.responsavelProfissao && (
                    <Badge
                      variant="outline"
                      className="rounded-full text-xs px-2.5 py-0.5 no-default-hover-elevate no-default-active-elevate"
                    >
                      {empreiteira.responsavelProfissao}
                    </Badge>
                  )}
                </div>
                {empreiteira.responsavelRegistro && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <RiMedalLine className="w-4 h-4 flex-shrink-0" />
                    <span>{empreiteira.responsavelRegistro}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {empreiteira.responsavelEmail && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <RiMailLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{empreiteira.responsavelEmail}</span>
                  </div>
                )}
                {empreiteira.responsavelTelefone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <RiPhoneLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{empreiteira.responsavelTelefone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Badge className="rounded-full text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 no-default-hover-elevate no-default-active-elevate">
                  Ativo na plataforma
                </Badge>
                {empreiteira.obrasEmAndamento > 0 && (
                  <Badge className="rounded-full text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 no-default-hover-elevate no-default-active-elevate">
                    Responsável por {empreiteira.obrasEmAndamento} obras em andamento
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⑥ Obras desta empreiteira */}
      <EmpreiteiraObrasSection
        obras={obras}
        isLoading={loadingObras}
      />

      {/* Modais */}
      <EditarEmpreiteiraModal
        open={editarOpen}
        onOpenChange={setEditarOpen}
        empreiteira={empreiteira}
      />
      <ResetarAcessoModal
        open={resetarOpen}
        onOpenChange={setResetarOpen}
        empreiteiraId={empreiteira.id}
        nomeEmpreiteira={empreiteira.razaoSocial}
        emailEmpreiteira={empreiteira.email}
      />
      <BloquearEmpreiteiraModal
        open={bloquearOpen}
        onOpenChange={setBloquearOpen}
        empreiteira={empreiteira}
      />

    </div>
  );
}
