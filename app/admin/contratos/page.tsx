'use client';

import { useMemo, useState } from 'react';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import { StatsCard } from '@features/shared/components/StatsCard';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { useContratosKpi, useContratosAceites } from '@features/admin/contratos/hooks/use-contratos';
import { CONTRATO_DOCUMENTOS, DOCUMENTO_LABEL } from '@features/admin/contratos/constants';
import type { ContratoDocumento } from '@features/admin/contratos/types';
import { RiFileList3Line, RiSearchLine, RiCloseLine } from 'react-icons/ri';

const DOCUMENTO_OPTIONS = CONTRATO_DOCUMENTOS.map((d) => ({ value: d, label: DOCUMENTO_LABEL[d] }));

function formatDataHora(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data}, ${hora}`;
}

export default function AdminContratosPage() {
  const [documentoSelected, setDocumentoSelected] = useState<ContratoDocumento[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: kpis, isLoading: kpiLoading } = useContratosKpi();
  const { data: aceites, isLoading: aceitesLoading } = useContratosAceites({
    documento: documentoSelected[0],
    q: searchQuery.trim() || undefined,
  });

  const advancedActiveCount = documentoSelected.length > 0 ? 1 : 0;
  const linhas = aceites ?? [];

  const kpiCards = useMemo(() => {
    return (kpis ?? []).map((k) => ({
      label: DOCUMENTO_LABEL[k.documento],
      value: k.totalAceites,
      versaoLabel:
        k.versaoVigente != null
          ? `v${k.versaoVigente} vigente · ${k.aceitesVigentes} na atual`
          : 'sem versão publicada',
    }));
  }, [kpis]);

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-contratos-page">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Contratos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro de aceites de termos e contratos por usuário
        </p>
      </div>

      {kpiLoading && !kpis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {kpiCards.map((c) => (
            <StatsCard
              key={c.label}
              label={c.label}
              value={c.value}
              icon={RiFileList3Line}
              iconBgColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20"
              badge={{ label: c.versaoLabel, variant: 'info' }}
              testId={`kpi-${c.label.toLowerCase().replace(/\s/g, '-')}`}
              luminous
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <AdvancedFiltersPopover activeCount={advancedActiveCount} onClearAll={() => setDocumentoSelected([])}>
            <MultiSelectDropdown
              label="Tipo de documento"
              options={DOCUMENTO_OPTIONS}
              values={documentoSelected}
              onChange={setDocumentoSelected}
              placeholder="Todos os tipos"
              testIdPrefix="filter-documento"
            />
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome ou email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="input-search-contratos"
            />
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {documentoSelected.map((d) => (
              <ActiveFilterChip
                key={d}
                label={`Tipo: ${DOCUMENTO_LABEL[d]}`}
                onRemove={() => setDocumentoSelected(documentoSelected.filter((x) => x !== d))}
                testId={`active-chip-documento-${d}`}
              />
            ))}
          </div>
        )}
      </div>

      {aceitesLoading && !aceites ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : linhas.length > 0 ? (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Usuário</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden md:table-cell">Papel</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Documento</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Versão</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Aceito em</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden lg:table-cell">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {linhas.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" data-testid={`row-aceite-${a.id}`}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{a.usuario}</p>
                      {a.email && <p className="text-xs text-gray-400 mt-0.5">{a.email}</p>}
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{a.role ?? '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {DOCUMENTO_LABEL[a.documento] ?? a.documento}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">v{a.versao}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDataHora(a.aceitoEm)}</td>
                    <td className="px-4 py-4 hidden lg:table-cell text-xs text-gray-400 font-mono">{a.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <RiCloseLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhum aceite encontrado</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Os aceites de contrato aparecem aqui conforme os usuários assinam.
          </p>
        </div>
      )}
    </div>
  );
}
