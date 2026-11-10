'use client';

import { tierLabel } from '@features/xgestao/admin/plano-label';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { RiArrowLeftLine, RiArrowRightSLine, RiDownloadLine, RiSearchLine } from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import {
  BotoesContato,
  ChipsSegmento,
  formatarDataAdmin,
  MotivosAtencao,
  SituacaoAssinanteBadge,
  UsoRecursoBarra,
} from '@features/xgestao/admin/components/AssinanteIndicadores';
import { useXgestaoAdminAssinantes } from '@features/xgestao/admin/hooks/use-admin-xgestao';
import { ROTULO_SITUACAO, SITUACOES_ASSINANTE } from '@features/xgestao/admin/lib/situacao-assinante';
import {
  aplicarSegmento,
  casaJanela,
  casaSegmento,
  filtrosDaUrl,
  filtrosParaQuery,
  JANELAS_SEGMENTO,
  ORDENS_SEGMENTO,
  ROTULO_JANELA,
  ROTULO_ORDEM,
  type FiltroSegmento,
  type FiltrosSegmento,
} from '@features/xgestao/admin/lib/segmentos-assinante';
import { formatarTelefone, ROTULO_CANAL_CONTATO } from '@features/xgestao/admin/lib/contato-assinante';
import { formatCurrency } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';

/**
 * `atencao` é um recorte transversal; os demais são as situações comerciais.
 * ADM-06: `sem_empresa` (liberado sem empresa cadastrada). ADM-02: `internas`
 * troca a base: contas internas/teste ficam fora da lista padrão.
 * CRM-06/07/08/10: janela de tempo, "nunca contatado", saída e trocas de plano;
 * o recorte inteiro mora na URL e vai junto no CSV (`segmentos-assinante.ts`).
 */
type FiltroSituacao = FiltroSegmento;

const ESTILO_CHIP_ATIVO = 'border-primary bg-primary text-primary-foreground';
const ESTILO_CHIP = 'border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary dark:border-gray-700 dark:text-gray-300';

/** `useSearchParams` exige boundary de Suspense na renderização estática. */
export default function AdminXgestaoAssinantesPage() {
  return (
    <Suspense fallback={<div className="p-6 md:p-10"><Skeleton className="h-96 rounded-2xl" /></div>}>
      <AssinantesXgestao />
    </Suspense>
  );
}

function AssinantesXgestao() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // A URL guarda o recorte: a home abre a lista já filtrada e o voltar do navegador o preserva.
  const filtros = filtrosDaUrl(searchParams);
  const filtro = filtros.situacao;
  const padrao = useXgestaoAdminAssinantes();
  const internas = useXgestaoAdminAssinantes({ internas: true });
  const { data, isLoading, isError, refetch, isFetching } = filtro === 'internas' ? internas : padrao;
  const [busca, setBusca] = useState(filtros.busca);

  const atualizar = (mudanca: Partial<FiltrosSegmento>) => {
    const query = filtrosParaQuery({ ...filtros, busca: '', ...mudanca });
    router.replace(query ? `/admin/xgestao/assinantes?${query}` : '/admin/xgestao/assinantes', { scroll: false });
  };
  const selecionarFiltro = (valor: FiltroSituacao) => atualizar({ situacao: valor });

  const linhas = data?.rows ?? [];
  const visiveis = useMemo(
    () => aplicarSegmento(linhas, { ...filtros, busca }),
    // `filtros` é derivado da URL a cada render; a chave estável é a query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linhas, searchParams.toString(), busca],
  );
  // CRM-02 — o CSV sai com o mesmo recorte da tela (situação, janela, contato, busca e ordem).
  const queryExportacao = filtrosParaQuery({ ...filtros, situacao: filtro === 'internas' ? '' : filtro, busca });

  if (isError && !data) {
    return (
      <div className="p-6 md:p-10">
        <AdminDashboardError onRetry={refetch} isRetrying={isFetching} />
      </div>
    );
  }

  // As contagens da base padrão não mudam ao abrir a lista de internas.
  const basePadrao = padrao.data?.rows ?? [];
  const contaPadrao = (f: (linha: (typeof basePadrao)[number]) => boolean) => basePadrao.filter(f).length;
  const chips: Array<{ valor: FiltroSituacao; rotulo: string; total: number | null }> = [
    { valor: '', rotulo: 'Todos', total: basePadrao.length },
    { valor: 'atencao', rotulo: 'Pedem atenção', total: contaPadrao((l) => l.atencao.length > 0) },
    { valor: 'sem_uso', rotulo: 'Sem uso', total: contaPadrao((l) => l.atencao.some((m) => m.codigo === 'sem_uso')) },
    ...SITUACOES_ASSINANTE.map((codigo) => ({ valor: codigo, rotulo: ROTULO_SITUACAO[codigo], total: contaPadrao((l) => l.situacao.codigo === codigo) })),
    // CRM-08 — já pagou e saiu, separado de quem só não assinou depois do teste.
    { valor: 'saiu', rotulo: 'Cancelou / saiu', total: contaPadrao((l) => casaSegmento(l, 'saiu')) },
    // CRM-10 — trocas de plano.
    { valor: 'descida_agendada', rotulo: 'Descida agendada', total: contaPadrao((l) => casaSegmento(l, 'descida_agendada')) },
    { valor: 'subiu_30d', rotulo: 'Subiu de plano (30 dias)', total: contaPadrao((l) => casaSegmento(l, 'subiu_30d')) },
    // XG50 — cancela e volta.
    { valor: 'voltou', rotulo: 'Voltou depois de cancelar', total: contaPadrao((l) => casaSegmento(l, 'voltou')) },
    { valor: 'cancela_volta', rotulo: 'Cancela e volta com frequência', total: contaPadrao((l) => casaSegmento(l, 'cancela_volta')) },
    { valor: 'sem_empresa', rotulo: 'Sem empresa', total: contaPadrao((l) => l.semEmpresa) },
    { valor: 'internas', rotulo: 'Contas internas', total: internas.data ? internas.data.rows.length : null },
  ];
  const baseFiltro = filtro === 'internas' ? linhas : basePadrao.filter((l) => casaSegmento(l, filtro));

  return (
    <div className="space-y-6 p-6 md:p-10">
      <div>
        <Link
          href="/admin/xgestao"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <RiArrowLeftLine /> Voltar ao resumo
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">Assinantes do xgestão</h1>
          <Button asChild variant="outline" size="sm" data-testid="xgestao-assinantes-exportar">
            <a href={`/api/admin/xgestao/export?tipo=assinantes${queryExportacao ? `&${queryExportacao}` : ''}`}><RiDownloadLine /> Exportar CSV</a>
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada linha representa uma empresa e seu responsável com acesso xgestão. Membros aparecem apenas como vínculos da equipe e não contam como nova empresa ou assinatura.
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-md">
          <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por empresa, responsável, e-mail, telefone ou cidade"
            className="pl-9"
            aria-label="Buscar assinante"
            data-testid="xgestao-assinantes-busca"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
          {chips.map((chip) => (
            <button
              key={chip.valor || 'todos'}
              type="button"
              onClick={() => selecionarFiltro(chip.valor)}
              aria-pressed={filtro === chip.valor}
              data-testid={`xgestao-assinantes-filtro-${chip.valor || 'todos'}`}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                filtro === chip.valor
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary dark:border-gray-700 dark:text-gray-300',
              )}
            >
              {chip.rotulo}{chip.total !== null && <span className="opacity-70"> ({chip.total})</span>}
            </button>
          ))}
        </div>
        {/* CRM-06 — janela de tempo (combina com o recorte acima) e CRM-07 — nunca contatado. */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por prazo">
          {JANELAS_SEGMENTO.map((janela) => (
            <button
              key={janela}
              type="button"
              onClick={() => atualizar({ janela: filtros.janela === janela ? '' : janela })}
              aria-pressed={filtros.janela === janela}
              data-testid={`xgestao-assinantes-janela-${janela}`}
              className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition-colors', filtros.janela === janela ? ESTILO_CHIP_ATIVO : ESTILO_CHIP)}
            >
              {ROTULO_JANELA[janela]}
              <span className="opacity-70"> ({baseFiltro.filter((l) => casaJanela(l, janela)).length})</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => atualizar({ nuncaContatado: !filtros.nuncaContatado })}
            aria-pressed={filtros.nuncaContatado}
            data-testid="xgestao-assinantes-nunca-contatado"
            className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition-colors', filtros.nuncaContatado ? ESTILO_CHIP_ATIVO : ESTILO_CHIP)}
          >
            Nunca contatado
            <span className="opacity-70"> ({baseFiltro.filter((l) => !l.ultimoContato).length})</span>
          </button>
          {/* XG52 — só quem aceitou e-mail de marketing (o CSV sai com o mesmo recorte). */}
          <button
            type="button"
            onClick={() => atualizar({ somenteMarketing: !filtros.somenteMarketing })}
            aria-pressed={Boolean(filtros.somenteMarketing)}
            data-testid="xgestao-assinantes-marketing"
            className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition-colors', filtros.somenteMarketing ? ESTILO_CHIP_ATIVO : ESTILO_CHIP)}
          >
            Aceita e-mail de marketing
            <span className="opacity-70"> ({baseFiltro.filter((l) => l.marketing?.aceito).length})</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ordenar">
          <span className="text-xs font-semibold text-muted-foreground">Ordenar por:</span>
          {(['', ...ORDENS_SEGMENTO] as const).map((ordem) => (
            <button
              key={ordem || 'padrao'}
              type="button"
              onClick={() => atualizar({ ordem })}
              aria-pressed={filtros.ordem === ordem}
              data-testid={`xgestao-assinantes-ordem-${ordem || 'padrao'}`}
              className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition-colors', filtros.ordem === ordem ? ESTILO_CHIP_ATIVO : ESTILO_CHIP)}
            >
              {ROTULO_ORDEM[ordem]}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}
        </div>
      ) : linhas.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-muted-foreground dark:border-gray-800"
          data-testid={filtro === 'internas' ? 'xgestao-assinantes-vazio-internas' : undefined}
        >
          {filtro === 'internas'
            ? 'Nenhuma conta marcada como interna ou de teste.'
            : 'Ainda não há empresas com responsáveis assinantes xgestão.'}
        </div>
      ) : visiveis.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-muted-foreground dark:border-gray-800"
          data-testid="xgestao-assinantes-vazio-filtro"
        >
          Nenhum assinante neste filtro.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Empresa / responsável</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">Contato</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">Plano e situação</th>
                  <th className="hidden min-w-[190px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">Uso do plano</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Obras</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 xl:table-cell">Último acesso</th>
                  <th className="w-8 px-3 py-3" aria-hidden />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {visiveis.map((assinante) => {
                  const href = `/admin/xgestao/assinantes/${assinante.userId}`;
                  return (
                    <tr
                      key={assinante.userId}
                      className="align-top hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      data-testid={`xgestao-assinante-${assinante.userId}`}
                      data-situacao={assinante.situacao.codigo}
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={href}
                          className="font-semibold text-gray-900 hover:text-primary dark:text-white"
                          data-testid={`xgestao-assinante-link-${assinante.userId}`}
                        >
                          {assinante.empreiteiraNome}
                        </Link>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          Responsável: {assinante.nome || 'não informado'}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">{assinante.email}</p>
                        {(assinante.semEmpresa || assinante.contaInterna) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {assinante.semEmpresa && (
                              <span
                                className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                                data-testid={`xgestao-assinante-sem-empresa-${assinante.userId}`}
                              >
                                Sem empresa
                              </span>
                            )}
                            {assinante.contaInterna && (
                              <span
                                className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                data-testid={`xgestao-assinante-interna-${assinante.userId}`}
                              >
                                Conta interna
                              </span>
                            )}
                          </div>
                        )}
                        {/* Reinjeta no mobile o que as colunas escondidas mostram. */}
                        <div className="mt-2 md:hidden">
                          <SituacaoAssinanteBadge situacao={assinante.situacao} />
                        </div>
                        {assinante.membros.length > 0 && (
                          <p className="mt-1 text-xs text-gray-400">{assinante.membros.length} vínculo(s) de equipe</p>
                        )}
                        <div className="mt-2">
                          <MotivosAtencao motivos={assinante.atencao} testId={`xgestao-assinante-atencao-${assinante.userId}`} />
                        </div>
                        <div className="mt-1">
                          <ChipsSegmento
                            saida={assinante.saida}
                            trocas={assinante.trocas}
                            totalPago={assinante.totalPago}
                            motivoCancelamento={assinante.cancelamento?.motivo}
                            retorno={assinante.retorno}
                            testId={`xgestao-assinante-chips-${assinante.userId}`}
                          />
                        </div>
                      </td>
                      {/* CRM-01 — telefone compacto e atalhos de contato. */}
                      <td className="hidden px-4 py-3 sm:table-cell" data-testid={`xgestao-assinante-contato-${assinante.userId}`}>
                        <p className="whitespace-nowrap text-xs font-semibold text-gray-700 dark:text-gray-200">
                          {assinante.contato.telefone ? formatarTelefone(assinante.contato.telefone) : 'sem telefone'}
                        </p>
                        {(assinante.contato.cidade || assinante.contato.uf) && (
                          <p className="mt-0.5 text-[11px] text-gray-400">{[assinante.contato.cidade, assinante.contato.uf].filter(Boolean).join(' - ')}</p>
                        )}
                        <div className="mt-1">
                          <BotoesContato compacto telefone={assinante.contato.telefone} email={assinante.email} testId={`xgestao-assinante-botoes-${assinante.userId}`} />
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {tierLabel(assinante.plano.tier)}
                        </span>
                        {!assinante.plano.emTeste && assinante.plano.valorMensal > 0 && (
                          <span className="ml-1 text-xs text-gray-400">{formatCurrency(assinante.plano.valorMensal)}/mês</span>
                        )}
                        <div className="mt-2">
                          <SituacaoAssinanteBadge
                            situacao={assinante.situacao}
                            detalhe
                            testId={`xgestao-assinante-situacao-${assinante.userId}`}
                          />
                        </div>
                      </td>
                      <td className="hidden space-y-2 px-4 py-3 lg:table-cell" data-testid={`xgestao-assinante-uso-${assinante.userId}`}>
                        <UsoRecursoBarra compacto rotulo="Obras em aberto" uso={assinante.usoPlano.obras} testId={`xgestao-uso-obras-${assinante.userId}`} />
                        <UsoRecursoBarra compacto rotulo="Pessoas" uso={assinante.usoPlano.pessoas} testId={`xgestao-uso-pessoas-${assinante.userId}`} />
                        <UsoRecursoBarra compacto rotulo="Links por obra" uso={assinante.usoPlano.links} testId={`xgestao-uso-links-${assinante.userId}`} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold">{assinante.obrasGerenciadas}</span>
                        {assinante.obrasAtivas > 0 && (
                          <span className="ml-1 text-xs font-normal text-gray-400">({assinante.obrasAtivas} ativas)</span>
                        )}
                        <p className="mt-1 text-xs text-gray-400">{formatCurrency(assinante.consolidado.orcamento)}</p>
                        {(assinante.consolidado.obrasAtrasadas > 0 || assinante.consolidado.obrasParadas > 0) && (
                          <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
                            {[
                              assinante.consolidado.obrasAtrasadas > 0 && `${assinante.consolidado.obrasAtrasadas} atrasada(s)`,
                              assinante.consolidado.obrasParadas > 0 && `${assinante.consolidado.obrasParadas} parada(s)`,
                            ].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-gray-500 xl:table-cell">
                        {assinante.ultimoAcessoEm ? formatarDataAdmin(assinante.ultimoAcessoEm) : 'nunca'}
                        <p className="mt-0.5 text-xs text-gray-400">Entrada {formatarDataAdmin(String(assinante.entradaEm))}</p>
                        {/* CRM-07 — último contato registrado pelo admin. */}
                        <p className="mt-0.5 text-xs text-gray-400" data-testid={`xgestao-assinante-ultimo-contato-${assinante.userId}`}>
                          {assinante.ultimoContato
                            ? `Contato ${formatarDataAdmin(assinante.ultimoContato.em)} (${ROTULO_CANAL_CONTATO[assinante.ultimoContato.canal]})`
                            : 'Nunca contatado'}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400" data-testid={`xgestao-assinante-marketing-${assinante.userId}`}>
                          {assinante.marketing?.aceito ? 'Aceita e-mail de marketing' : 'Sem e-mail de marketing'}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-gray-400">
                        <Link href={href} aria-label={`Ver detalhes de ${assinante.empreiteiraNome}`} className="hover:text-primary">
                          <RiArrowRightSLine className="size-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
