'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiArrowRightLine,
  RiSearchLine,
  RiCalendarLine,
} from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Input } from '@shared/components/ui/input';
import { StatsCard } from '@features/empreiteiro/dashboard/components/StatsCard';
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
  usePagamentosEmpreiteiro,
  usePagamentosEmpriteiroKPI,
} from '@features/empreiteiro/pagamentos/hooks/use-pagamentos-empreiteiro';
import { RecebimentosBreakdown } from '@features/empreiteiro/pagamentos/components/RecebimentosBreakdown';
import { RecebimentosEvolutionChart } from '@features/empreiteiro/pagamentos/components/RecebimentosEvolutionChart';
import {
  ITEMS_PER_PAGE,
  MEDICAO_STATUS_LABELS,
  MEDICAO_STATUS_BADGE_CLASSES,
  MEDICAO_STATUS_DOT_CLASSES,
} from '@features/empreiteiro/pagamentos/constants';
import type { MedicaoStatus } from '@features/empreiteiro/pagamentos/types';

const VALID_STATUSES: MedicaoStatus[] = [
  'recebido',
  'aguardando_aprovacao',
  'pendente',
  'rejeitado',
];

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function PagamentosEmpreteiroPage() {
  const { data: medicoes } = usePagamentosEmpreiteiro();
  const { data: kpi } = usePagamentosEmpriteiroKPI();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusSelected, setStatusSelected] = useState<MedicaoStatus[]>(() => {
    const param = searchParams?.get('status');
    if (!param) return [];
    return param
      .split(',')
      .map((s) => s.trim() as MedicaoStatus)
      .filter((s) => VALID_STATUSES.includes(s));
  });
  const [obraSelected, setObraSelected] = useState<string[]>([]);
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [dataMin, setDataMin] = useState('');
  const [dataMax, setDataMax] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const valorMinNum = valorMin === '' ? undefined : Number(valorMin);
  const valorMaxNum = valorMax === '' ? undefined : Number(valorMax);

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setCurrentPage(1);
  };

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    (medicoes ?? []).forEach((m) => {
      counts[m.status] = (counts[m.status] || 0) + 1;
    });
    return VALID_STATUSES.map((value) => ({
      value,
      label: `${MEDICAO_STATUS_LABELS[value]} (${counts[value] || 0})`,
    }));
  }, [medicoes]);

  const obraOptions = useMemo(() => {
    const set = new Set((medicoes ?? []).map((m) => m.obraNome));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((nome) => ({ value: nome, label: nome }));
  }, [medicoes]);

  const filteredMedicoes = useMemo(() => {
    if (!medicoes) return [];
    let result = medicoes;
    if (statusSelected.length > 0) {
      result = result.filter((m) => statusSelected.includes(m.status));
    }
    if (obraSelected.length > 0) {
      result = result.filter((m) => obraSelected.includes(m.obraNome));
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
          String(m.numero).includes(q),
      );
    }
    return result;
  }, [
    medicoes,
    statusSelected,
    obraSelected,
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

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (obraSelected.length > 0 ? 1 : 0) +
    (valorMinNum !== undefined || valorMaxNum !== undefined ? 1 : 0) +
    (dataMin || dataMax ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    setObraSelected([]);
    setValorMin('');
    setValorMax('');
    setDataMin('');
    setDataMax('');
    setCurrentPage(1);
  };

  const progressoRecebido =
    kpi && kpi.totalContratado > 0
      ? Math.round((kpi.totalRecebido / kpi.totalContratado) * 100)
      : 0;

  return (
    <div className="p-6 md:p-10 flex flex-col gap-10" data-testid="pagamentos-empreiteiro-page">
      <PageHeader
        title="Meus Recebimentos"
        subtitle="Acompanhe medições, prazos e o status financeiro de todas as suas obras."
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
          label="Total Recebido"
          value={kpi ? formatCurrencyRounded(kpi.totalRecebido) : '—'}
          icon={RiCheckboxCircleLine}
          iconBgColor="bg-green-100 text-green-600 dark:bg-green-900/30"
          badge={{ label: `${progressoRecebido}% do total`, variant: 'success' }}
          href="/empreiteiro/pagamentos?status=recebido"
          testId="kpi-total-recebido"
        />
        <StatsCard
          label="Aguardando Aprovação"
          value={kpi ? formatCurrencyRounded(kpi.aguardandoAprovacao) : '—'}
          icon={RiTimeLine}
          iconBgColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30"
          badge={{ label: 'Em análise', variant: 'amber' }}
          href="/empreiteiro/pagamentos?status=aguardando_aprovacao"
          testId="kpi-aguardando-aprovacao"
        />
        <StatsCard
          label="A Liberar"
          value={kpi ? formatCurrencyRounded(kpi.aLiberar) : 'R$ 0'}
          icon={RiArrowRightLine}
          iconBgColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30"
          href="/empreiteiro/pagamentos?status=pendente"
          testId="kpi-a-liberar"
        />
        <StatsCard
          label="Prazo Médio Recebimento"
          value={kpi ? `${kpi.prazoMedioRecebimentoDias} dias` : '—'}
          icon={RiCalendarLine}
          iconBgColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30"
          badge={
            kpi && kpi.prazoMedioRecebimentoDias > 0
              ? {
                  label: kpi.prazoMedioRecebimentoDias <= 15 ? 'No prazo' : 'Atenção',
                  variant: kpi.prazoMedioRecebimentoDias <= 15 ? 'success' : 'amber',
                }
              : undefined
          }
          testId="kpi-prazo-medio"
        />
      </div>

      {kpi && <RecebimentosBreakdown kpi={kpi} />}

      {medicoes && <RecebimentosEvolutionChart medicoes={medicoes} />}

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
              placeholder="Buscar por obra, número ou descrição..."
              value={searchQuery}
              onChange={(e) => onFilterChange(setSearchQuery)(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="input-search-recebimentos"
            />
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {statusSelected.map((s) => (
              <ActiveFilterChip
                key={s}
                label={`Status: ${MEDICAO_STATUS_LABELS[s]}`}
                onRemove={() =>
                  onFilterChange(setStatusSelected)(statusSelected.filter((x) => x !== s))
                }
                dotClassName={MEDICAO_STATUS_DOT_CLASSES[s]}
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
            {(dataMin || dataMax) && (
              <ActiveFilterChip
                label={`Envio: ${formatRange(
                  dataMin ? formatDateBR(dataMin) : '',
                  dataMax ? formatDateBR(dataMax) : '',
                )}`}
                onRemove={() => {
                  onFilterChange(setDataMin)('');
                  setDataMax('');
                }}
                testId="active-chip-data-envio"
              />
            )}
            {(valorMinNum !== undefined || valorMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Valor: ${formatRange(valorMin, valorMax, { prefix: 'R$ ' })}`}
                onRemove={() => {
                  onFilterChange(setValorMin)('');
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
              <span>Obra</span>
              <span>Medição</span>
              <span>Período</span>
              <span>Envio</span>
              <span>Valor</span>
              <span>Status</span>
              <span />
            </div>

            {paginatedMedicoes.map((medicao) => (
              <Link
                key={medicao.id}
                href={`/empreiteiro/minhas-obras/${medicao.obraId}`}
                className="grid grid-cols-1 md:grid-cols-[2fr_auto_1fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                data-testid={`medicao-row-${medicao.id}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                    {medicao.obraNome}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">{medicao.descricao}</span>
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
                      MEDICAO_STATUS_BADGE_CLASSES[medicao.status],
                    )}
                  >
                    {MEDICAO_STATUS_LABELS[medicao.status]}
                  </span>
                </div>

                <div className="hidden md:flex items-center">
                  <RiArrowRightLine className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
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
                data-testid="recebimentos-pagination-prev"
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
                    data-testid={`recebimentos-pagination-page-${item}`}
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
                data-testid="recebimentos-pagination-next"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
