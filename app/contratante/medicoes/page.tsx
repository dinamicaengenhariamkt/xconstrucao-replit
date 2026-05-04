'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiCloseCircleLine,
  RiCalendarLine,
  RiSearchLine,
  RiArrowRightLine,
  RiCheckLine,
  RiCloseLine,
} from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Input } from '@shared/components/ui/input';
import { StatsCard } from '@features/shared/components/StatsCard';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
import { RangeDateInput } from '@features/shared/components/filters/RangeDateInput';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@shared/components/ui/pagination';
import { getPaginationRange } from '@shared/lib/pagination';
import { formatCurrencyRounded, formatRange } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';
import {
  useMedicoesContratante,
  useMedicoesContratanteKPI,
} from '@features/contratante/medicoes/hooks/use-medicoes';
import { RejeitarMedicaoDialog } from '@features/contratante/medicoes/components/RejeitarMedicaoDialog';
import {
  ITEMS_PER_PAGE,
  MEDICAO_CONTRATANTE_STATUS_LABELS,
  MEDICAO_CONTRATANTE_STATUS_BADGE_CLASSES,
  MEDICAO_CONTRATANTE_STATUS_DOT_CLASSES,
} from '@features/contratante/medicoes/constants';
import type {
  MedicaoContratante,
  MedicaoContratanteStatus,
  MedicoesContratanteKPI,
} from '@features/contratante/medicoes/types';

const VALID_STATUSES: MedicaoContratanteStatus[] = [
  'aguardando_aprovacao',
  'aprovada',
  'rejeitada',
  'paga',
];

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface LocalOverride {
  status: MedicaoContratanteStatus;
  dataAvaliacao: string;
  motivoRejeicao?: string;
}

function recomputeKPI(
  base: MedicoesContratanteKPI,
  raw: MedicaoContratante[],
  overrides: Record<string, LocalOverride>,
): MedicoesContratanteKPI {
  if (Object.keys(overrides).length === 0) return base;

  const merged = raw.map((m) => {
    const o = overrides[m.id];
    return o ? { ...m, ...o } : m;
  });

  const totalContratado = merged.reduce((acc, m) => acc + m.valor, 0);
  const totalAprovado = merged
    .filter((m) => m.status === 'aprovada' || m.status === 'paga')
    .reduce((acc, m) => acc + m.valor, 0);
  const aguardandoLista = merged.filter((m) => m.status === 'aguardando_aprovacao');
  const aguardandoMinhaAprovacao = aguardandoLista.reduce((acc, m) => acc + m.valor, 0);
  const rejeitado = merged
    .filter((m) => m.status === 'rejeitada')
    .reduce((acc, m) => acc + m.valor, 0);

  return {
    ...base,
    totalContratado,
    totalAprovado,
    aguardandoMinhaAprovacao,
    rejeitado,
    countAguardando: aguardandoLista.length,
  };
}

export default function MedicoesContratantePage() {
  const { data: rawMedicoes } = useMedicoesContratante();
  const { data: rawKPI } = useMedicoesContratanteKPI();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusSelected, setStatusSelected] = useState<MedicaoContratanteStatus[]>(() => {
    const param = searchParams?.get('status');
    if (!param) return [];
    return param
      .split(',')
      .map((s) => s.trim() as MedicaoContratanteStatus)
      .filter((s) => VALID_STATUSES.includes(s));
  });
  const [obraSelected, setObraSelected] = useState<string[]>([]);
  const [empreiteiroSelected, setEmpreiteiroSelected] = useState<string[]>([]);
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [dataMin, setDataMin] = useState('');
  const [dataMax, setDataMax] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [overrides, setOverrides] = useState<Record<string, LocalOverride>>({});
  const [rejeitando, setRejeitando] = useState<MedicaoContratante | null>(null);

  const valorMinNum = valorMin === '' ? undefined : Number(valorMin);
  const valorMaxNum = valorMax === '' ? undefined : Number(valorMax);

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setCurrentPage(1);
  };

  const medicoes = useMemo<MedicaoContratante[]>(() => {
    if (!rawMedicoes) return [];
    return rawMedicoes.map((m) => {
      const o = overrides[m.id];
      return o ? { ...m, ...o } : m;
    });
  }, [rawMedicoes, overrides]);

  const kpi = useMemo<MedicoesContratanteKPI | undefined>(() => {
    if (!rawKPI || !rawMedicoes) return rawKPI;
    return recomputeKPI(rawKPI, rawMedicoes, overrides);
  }, [rawKPI, rawMedicoes, overrides]);

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    medicoes.forEach((m) => {
      counts[m.status] = (counts[m.status] || 0) + 1;
    });
    return VALID_STATUSES.map((value) => ({
      value,
      label: `${MEDICAO_CONTRATANTE_STATUS_LABELS[value]} (${counts[value] || 0})`,
    }));
  }, [medicoes]);

  const obraOptions = useMemo(() => {
    const set = new Set(medicoes.map((m) => m.obraNome));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((nome) => ({ value: nome, label: nome }));
  }, [medicoes]);

  const empreiteiroOptions = useMemo(() => {
    const set = new Set(medicoes.map((m) => m.empreiteiroNome));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((nome) => ({ value: nome, label: nome }));
  }, [medicoes]);

  const filteredMedicoes = useMemo(() => {
    let result = medicoes;
    if (statusSelected.length > 0) {
      result = result.filter((m) => statusSelected.includes(m.status));
    }
    if (obraSelected.length > 0) {
      result = result.filter((m) => obraSelected.includes(m.obraNome));
    }
    if (empreiteiroSelected.length > 0) {
      result = result.filter((m) => empreiteiroSelected.includes(m.empreiteiroNome));
    }
    if (valorMinNum !== undefined) {
      result = result.filter((m) => m.valor >= valorMinNum);
    }
    if (valorMaxNum !== undefined) {
      result = result.filter((m) => m.valor <= valorMaxNum);
    }
    if (dataMin) {
      result = result.filter((m) => m.dataEnvio >= dataMin);
    }
    if (dataMax) {
      result = result.filter((m) => m.dataEnvio <= dataMax);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.obraNome.toLowerCase().includes(q) ||
          m.descricao.toLowerCase().includes(q) ||
          m.periodo.toLowerCase().includes(q) ||
          m.empreiteiroNome.toLowerCase().includes(q) ||
          String(m.numero).includes(q),
      );
    }
    return result;
  }, [
    medicoes,
    statusSelected,
    obraSelected,
    empreiteiroSelected,
    valorMinNum,
    valorMaxNum,
    dataMin,
    dataMax,
    searchQuery,
  ]);

  const totalPages = Math.ceil(filteredMedicoes.length / ITEMS_PER_PAGE);
  const paginatedMedicoes = filteredMedicoes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Mantém currentPage válido se a lista encolher por filtros.
  useEffect(() => {
    if (currentPage > 1 && currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (obraSelected.length > 0 ? 1 : 0) +
    (empreiteiroSelected.length > 0 ? 1 : 0) +
    (valorMinNum !== undefined || valorMaxNum !== undefined ? 1 : 0) +
    (dataMin || dataMax ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    setObraSelected([]);
    setEmpreiteiroSelected([]);
    setValorMin('');
    setValorMax('');
    setDataMin('');
    setDataMax('');
    setCurrentPage(1);
  };

  const aprovar = (m: MedicaoContratante) => {
    setOverrides((prev) => ({
      ...prev,
      [m.id]: { status: 'aprovada', dataAvaliacao: todayIso() },
    }));
  };

  const confirmarRejeicao = (motivo: string) => {
    if (!rejeitando) return;
    setOverrides((prev) => ({
      ...prev,
      [rejeitando.id]: {
        status: 'rejeitada',
        dataAvaliacao: todayIso(),
        motivoRejeicao: motivo,
      },
    }));
    setRejeitando(null);
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-10" data-testid="medicoes-contratante-page">
      <PageHeader
        title="Medições"
        subtitle="Aprove ou rejeite medições enviadas pelos empreiteiros das suas obras."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatsCard
          label="Total Contratado"
          value={kpi ? formatCurrencyRounded(kpi.totalContratado) : '—'}
          icon={RiMoneyDollarCircleLine}
          iconBgColor="bg-primary/10 text-primary"
          testId="kpi-total-contratado"
        />
        <StatsCard
          label="Aguardando minha aprovação"
          value={kpi ? formatCurrencyRounded(kpi.aguardandoMinhaAprovacao) : '—'}
          icon={RiTimeLine}
          iconBgColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30"
          badge={
            kpi && kpi.countAguardando > 0
              ? {
                  label: `${kpi.countAguardando} pendente${kpi.countAguardando !== 1 ? 's' : ''}`,
                  variant: 'amber',
                }
              : undefined
          }
          href="/contratante/medicoes?status=aguardando_aprovacao"
          testId="kpi-aguardando"
        />
        <StatsCard
          label="Aprovado"
          value={kpi ? formatCurrencyRounded(kpi.totalAprovado) : '—'}
          icon={RiCheckboxCircleLine}
          iconBgColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30"
          href="/contratante/medicoes?status=aprovada,paga"
          testId="kpi-aprovado"
        />
        <StatsCard
          label="Rejeitado"
          value={kpi ? formatCurrencyRounded(kpi.rejeitado) : '—'}
          icon={RiCloseCircleLine}
          iconBgColor="bg-red-100 text-red-600 dark:bg-red-900/30"
          href="/contratante/medicoes?status=rejeitada"
          testId="kpi-rejeitado"
        />
        <StatsCard
          label="Prazo Médio Avaliação"
          value={kpi ? `${kpi.prazoMedioAvaliacaoDias} dias` : '—'}
          icon={RiCalendarLine}
          iconBgColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30"
          badge={
            kpi && kpi.prazoMedioAvaliacaoDias > 0
              ? {
                  label: kpi.prazoMedioAvaliacaoDias <= 7 ? 'Rápido' : 'Atenção',
                  variant: kpi.prazoMedioAvaliacaoDias <= 7 ? 'success' : 'amber',
                }
              : undefined
          }
          testId="kpi-prazo-medio"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <AdvancedFiltersPopover
            activeCount={advancedActiveCount}
            onClearAll={clearAllAdvanced}
          >
            <MultiSelectDropdown
              label="Status"
              options={statusOptions}
              values={statusSelected}
              onChange={onFilterChange(setStatusSelected)}
              placeholder="Todos os status"
              testIdPrefix="filter-status"
            />
            <MultiSelectDropdown
              label="Obra"
              options={obraOptions}
              values={obraSelected}
              onChange={onFilterChange(setObraSelected)}
              placeholder="Todas as obras"
              searchPlaceholder="Buscar obra..."
              testIdPrefix="filter-obra"
            />
            <MultiSelectDropdown
              label="Empreiteiro"
              options={empreiteiroOptions}
              values={empreiteiroSelected}
              onChange={onFilterChange(setEmpreiteiroSelected)}
              placeholder="Todos os empreiteiros"
              searchPlaceholder="Buscar empreiteiro..."
              testIdPrefix="filter-empreiteiro"
            />
            <RangeDateInput
              label="Data de envio"
              min={dataMin}
              max={dataMax}
              onMinChange={onFilterChange(setDataMin)}
              onMaxChange={onFilterChange(setDataMax)}
              testIdPrefix="filter-data"
            />
            <RangeNumberInput
              label="Valor"
              min={valorMin}
              max={valorMax}
              onMinChange={onFilterChange(setValorMin)}
              onMaxChange={onFilterChange(setValorMax)}
              prefix="R$ "
              placeholderMin="10.000"
              placeholderMax="500.000"
              testIdPrefix="filter-valor"
            />
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por obra, empreiteiro, número ou descrição..."
              value={searchQuery}
              onChange={(e) => onFilterChange(setSearchQuery)(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="input-search-medicoes"
            />
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {statusSelected.map((s) => (
              <ActiveFilterChip
                key={s}
                label={`Status: ${MEDICAO_CONTRATANTE_STATUS_LABELS[s]}`}
                onRemove={() =>
                  onFilterChange(setStatusSelected)(statusSelected.filter((x) => x !== s))
                }
                dotClassName={MEDICAO_CONTRATANTE_STATUS_DOT_CLASSES[s]}
                testId={`active-chip-status-${s}`}
              />
            ))}
            {obraSelected.map((o) => (
              <ActiveFilterChip
                key={o}
                label={`Obra: ${o}`}
                onRemove={() =>
                  onFilterChange(setObraSelected)(obraSelected.filter((x) => x !== o))
                }
                testId={`active-chip-obra-${o}`}
              />
            ))}
            {empreiteiroSelected.map((e) => (
              <ActiveFilterChip
                key={e}
                label={`Empreiteiro: ${e}`}
                onRemove={() =>
                  onFilterChange(setEmpreiteiroSelected)(
                    empreiteiroSelected.filter((x) => x !== e),
                  )
                }
                testId={`active-chip-empreiteiro-${e}`}
              />
            ))}
            {(dataMin || dataMax) && (
              <ActiveFilterChip
                label={`Envio: ${formatRange(
                  dataMin ? formatDateBR(dataMin) : '',
                  dataMax ? formatDateBR(dataMax) : '',
                )}`}
                onRemove={() => {
                  setDataMin('');
                  setDataMax('');
                }}
                testId="active-chip-data"
              />
            )}
            {(valorMinNum !== undefined || valorMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Valor: ${formatRange(valorMin, valorMax, { prefix: 'R$ ' })}`}
                onRemove={() => {
                  setValorMin('');
                  setValorMax('');
                }}
                testId="active-chip-valor"
              />
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {paginatedMedicoes.length === 0 ? (
          <div className="text-center py-16">
            <RiMoneyDollarCircleLine className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">Nenhuma medição encontrada</p>
            <p className="text-xs text-gray-400 mt-1">Tente ajustar os filtros.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <div className="hidden md:grid grid-cols-[2fr_auto_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
              <span>Obra · Empreiteiro</span>
              <span>Medição</span>
              <span>Período</span>
              <span>Envio</span>
              <span>Valor</span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            {paginatedMedicoes.map((medicao) => {
              const isAguardando = medicao.status === 'aguardando_aprovacao';
              return (
                <div
                  key={medicao.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_auto_1fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  data-testid={`medicao-row-${medicao.id}`}
                >
                  <div className="flex flex-col">
                    <Link
                      href={`/contratante/minhas-obras/${medicao.obraId}`}
                      className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors"
                    >
                      {medicao.obraNome}
                    </Link>
                    <span className="text-xs text-gray-400 mt-0.5">
                      {medicao.empreiteiroNome} · {medicao.descricao}
                    </span>
                    {medicao.motivoRejeicao && (
                      <span className="text-[11px] text-red-600 dark:text-red-400 mt-1 italic">
                        Motivo: {medicao.motivoRejeicao}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                      #{medicao.numero}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {medicao.periodo}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                      {formatDateBR(medicao.dataEnvio)}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                      {formatCurrencyRounded(medicao.valor)}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span
                      className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-full',
                        MEDICAO_CONTRATANTE_STATUS_BADGE_CLASSES[medicao.status],
                      )}
                    >
                      {MEDICAO_CONTRATANTE_STATUS_LABELS[medicao.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isAguardando ? (
                      <>
                        <button
                          type="button"
                          onClick={() => aprovar(medicao)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 text-xs font-semibold transition-colors cursor-pointer"
                          aria-label={`Aprovar medição ${medicao.numero}`}
                          data-testid={`btn-aprovar-${medicao.id}`}
                        >
                          <RiCheckLine className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejeitando(medicao)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 text-xs font-semibold transition-colors cursor-pointer"
                          aria-label={`Rejeitar medição ${medicao.numero}`}
                          data-testid={`btn-rejeitar-${medicao.id}`}
                        >
                          <RiCloseLine className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </>
                    ) : (
                      <Link
                        href={`/contratante/minhas-obras/${medicao.obraId}`}
                        className="inline-flex items-center text-gray-300 hover:text-primary transition-colors p-1.5"
                        aria-label="Ver obra"
                      >
                        <RiArrowRightLine className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                data-testid="medicoes-pagination-prev"
              />
            </PaginationItem>
            {getPaginationRange(currentPage, totalPages).map((item, idx) =>
              item === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === item}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(item);
                    }}
                    data-testid={`medicoes-pagination-page-${item}`}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                data-testid="medicoes-pagination-next"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <RejeitarMedicaoDialog
        open={rejeitando !== null}
        onOpenChange={(open) => {
          if (!open) setRejeitando(null);
        }}
        medicao={rejeitando}
        onConfirmar={confirmarRejeicao}
      />
    </div>
  );
}
