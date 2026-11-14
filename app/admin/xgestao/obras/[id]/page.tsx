'use client';

import Link from 'next/link';
import { use } from 'react';
import { RiArrowLeftLine, RiLinkM } from 'react-icons/ri';
import { Skeleton } from '@shared/components/ui/skeleton';
import { ProfitCard } from '@features/shared/profit';
import { StatsCard } from '@features/shared/components/StatsCard';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import { ObraPublicaShell } from '@features/xgestao/obra-publica/components/ObraPublicaShell';
import { useXgestaoAdminObra } from '@features/xgestao/admin/hooks/use-admin-xgestao';
import type { XgestaoObraAdministrativo } from '@features/xgestao/admin/server/obra-detalhe';
import { cn } from '@shared/lib/utils';
import { formatCurrency } from '@shared/lib/formatters';
import {
  RiBuilding2Line,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

function formatarData(valor: string | null): string {
  if (!valor) return '—';
  const somenteData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (somenteData) return `${somenteData[3]}/${somenteData[2]}/${somenteData[1]}`;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? '—' : dateFormatter.format(data);
}

export default function AdminXgestaoObraDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminObra(id);

  if (isError && !data) {
    return (
      <div className="p-6 md:p-10">
        <AdminDashboardError onRetry={refetch} isRetrying={isFetching} />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6 p-6 md:p-10">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const { obra, assinante, lucro, linkPublico, linksPublicos, conteudo, administrativo } = data;

  return (
    <div className="space-y-6 p-6 md:p-10">
      <div>
        <Link
          href="/admin/xgestao/obras"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <RiArrowLeftLine /> Voltar para as obras
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">{obra.nome}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {/* XG44 — da obra (micro) para o assinante (visão da conta inteira). */}
          <Link
            href={`/admin/xgestao/assinantes/${assinante.userId}`}
            className="font-semibold text-primary hover:underline"
            data-testid="xgestao-obra-assinante-link"
          >
            {assinante.empreiteira}
          </Link>
          {assinante.responsavel && ` · ${assinante.responsavel}`} · {assinante.email}
        </p>
      </div>

      {/* XG34 — o card "Progresso" saiu: lia `obras.progresso`, coluna sem escritor desde a XG23. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          label="Orçamento"
          value={formatCurrency(obra.valorTotal)}
          icon={RiMoneyDollarCircleLine}
          iconBgColor="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300"
        />
        <StatsCard
          label="Custo real"
          value={formatCurrency(obra.valorPago)}
          icon={RiBuilding2Line}
          iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
        />
        <StatsCard
          label="Previsão"
          value={formatarData(obra.dataPrevisao)}
          icon={RiCalendarLine}
          iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300"
        />
      </div>

      {/* O lucro é leitura administrativa: não vai para o link público, porque
          revela a margem do assinante. A Saúde saiu na XG34 (dado morto). */}
      <div className="grid gap-4">
        <ProfitCard
          metrics={lucro.metrics}
          title="Lucro desta obra"
          description="Receita menos custos lançados pelo assinante."
        />
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-border dark:bg-card">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">Link público</h2>
        {linkPublico.ativo ? (
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
              <RiLinkM /> Ativo
            </span>
            <span>
              {linkPublico.visualizacoes === 0
                ? 'Ainda não foi aberto'
                : `${linkPublico.visualizacoes} ${linkPublico.visualizacoes === 1 ? 'visualização' : 'visualizações'}`}
            </span>
            {linkPublico.ultimoAcessoEm && <span>Último acesso: {formatarData(linkPublico.ultimoAcessoEm)}</span>}
          </p>
        ) : null}
        {/* XG36 — um link por público (XG30). ADM-01: todos, com status e seções. */}
        {linksPublicos.length > 0 && (
          <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100 text-sm dark:divide-border dark:border-border" data-testid="xgestao-obra-links">
            {linksPublicos.map((link, index) => (
              <li key={`${link.nome}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2" data-status={link.status}>
                <span className="font-medium">
                  {link.nome}
                  <span className="ml-2 text-xs font-semibold text-muted-foreground">{ROTULO_STATUS_LINK[link.status]}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {link.visualizacoes} {link.visualizacoes === 1 ? 'visualização' : 'visualizações'}
                  {link.ultimoAcessoEm && ` · último acesso ${formatarData(link.ultimoAcessoEm)}`}
                  {link.expiraEm && ` · ${link.status === 'expirado' ? 'expirou' : 'expira'} ${formatarData(link.expiraEm)}`}
                </span>
                <span className="w-full text-xs text-gray-400 dark:text-muted-foreground">
                  Mostra: {link.secoes.length ? link.secoes.map((secao) => ROTULO_SECAO[secao] ?? secao).join(', ') : 'nenhuma seção'}
                </span>
              </li>
            ))}
          </ul>
        )}
        {!linkPublico.ativo && (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum link público ativo para esta obra.</p>
        )}
      </section>

      <ProjecaoAdministrativa dados={administrativo} />

      {conteudo && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
            Acompanhamento da obra
          </h2>
          {/* Reusa a visão de leitura do link público, com todas as seções
              liberadas: o administrador vê o conteúdo operacional completo,
              e nenhuma ação de escrita existe neste componente. */}
          <ObraPublicaShell view={conteudo} />
        </section>
      )}
    </div>
  );
}

const ROTULO_STATUS_LINK: Record<'ativo' | 'expirado' | 'revogado', string> = {
  ativo: 'Ativo',
  expirado: 'Expirado',
  revogado: 'Revogado',
};

const ROTULO_SECAO: Record<string, string> = {
  etapas: 'Etapas',
  cronograma: 'Cronograma',
  fotos: 'Fotos',
  pagamentos: 'Pagamentos',
  diario: 'Diário',
  ocorrencias: 'Ocorrências',
  localizacao: 'Localização',
};

const ROTULO_STATUS_LANCAMENTO: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
};

const CARTAO = 'rounded-2xl border border-gray-100 bg-white p-5 dark:border-border dark:bg-card';
const TITULO = 'text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-muted-foreground';
const LISTA = 'mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100 text-sm dark:divide-border dark:border-border';

/**
 * ADM-01 — o que a obra tem por dentro, em leitura: financeiro interno, equipe
 * (PIX mascarado), acessos da empresa, anexos, checklists e ocorrências. Sem
 * botão de edição: o admin consulta, quem altera é o assinante.
 */
function ProjecaoAdministrativa({ dados }: { dados: XgestaoObraAdministrativo }) {
  const vazio = (texto: string) => <p className="mt-2 text-sm text-muted-foreground">{texto}</p>;
  return (
    <div className="space-y-6" data-testid="xgestao-obra-administrativo">
      <section className={CARTAO} data-testid="xgestao-obra-financeiro">
        <h2 className={TITULO}>Financeiro da obra</h2>
        {dados.financeiro.length === 0 ? vazio('Nenhum lançamento.') : (
          <ul className={LISTA}>
            {dados.financeiro.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2" data-status={l.status} data-lado={l.lado ?? ''}>
                <span className="min-w-0">
                  <span className="block font-medium">{l.descricao}</span>
                  <span className="block text-xs text-muted-foreground">
                    {l.lado === 'receita' ? 'Entrada' : l.lado === 'custo' ? 'Saída' : l.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    {l.fornecedor && ` · ${l.fornecedor}`}
                    {l.categoria && ` · ${l.categoria}`}
                    {l.vencimento && ` · vence ${formatarData(l.vencimento)}`}
                    {l.pagoEm && ` · pago ${formatarData(l.pagoEm)}`}
                    {l.metodoPagamento && ` · ${l.metodoPagamento}`}
                  </span>
                </span>
                <span className="flex items-center gap-3 text-right">
                  {l.comprovanteUrl && (
                    <a href={l.comprovanteUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">
                      Comprovante
                    </a>
                  )}
                  <span className={cn('text-xs font-semibold', l.status === 'atrasado' && 'text-red-600 dark:text-red-400')}>
                    {ROTULO_STATUS_LANCAMENTO[l.status] ?? l.status}
                  </span>
                  <span className="font-bold">{formatCurrency(l.valor)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {dados.aditivos.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Aditivos: {dados.aditivos.map((a) => `${a.descricao} (${formatCurrency(a.valor)})`).join(' · ')}
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={CARTAO} data-testid="xgestao-obra-equipe">
          <h2 className={TITULO}>Equipe da obra</h2>
          {dados.equipe.length === 0 ? vazio('Ninguém cadastrado na equipe.') : (
            <ul className={LISTA}>
              {dados.equipe.map((m) => (
                <li key={m.id} className="px-3 py-2">
                  <span className="block font-medium">{m.nome}{!m.ativo && <span className="ml-2 text-xs text-muted-foreground">inativo</span>}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[m.papel, m.telefone, m.email, m.pixMascarado && `PIX ${m.pixMascarado}`, m.valorContrato !== null && `contrato ${formatCurrency(m.valorContrato)}`]
                      .filter(Boolean).join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">Acesso da empresa</h3>
          {dados.acessos.length === 0 ? vazio('Só o titular acessa esta obra.') : (
            <ul className={LISTA} data-testid="xgestao-obra-acessos">
              {dados.acessos.map((a) => (
                <li key={a.userId} className="px-3 py-2">
                  <span className="block font-medium">{a.nome}</span>
                  <span className="block text-xs text-muted-foreground">{a.email} · {a.papel} · {a.status} · {a.permissao}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={CARTAO} data-testid="xgestao-obra-anexos">
          <h2 className={TITULO}>Anexos</h2>
          {dados.anexos.length === 0 ? vazio('Nenhum anexo.') : (
            <ul className={LISTA}>
              {dados.anexos.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block font-medium">{a.nome}</span>
                    <span className="block text-xs text-muted-foreground">{a.tipo}{a.observacao && ` · ${a.observacao}`}</span>
                  </span>
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">Abrir</a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={CARTAO} data-testid="xgestao-obra-checklists">
          <h2 className={TITULO}>Checklists</h2>
          {dados.checklists.length === 0 ? vazio('Nenhum checklist.') : (
            <ul className={LISTA}>
              {dados.checklists.map((c) => (
                <li key={c.id} className="px-3 py-2">
                  <span className="block font-medium">{c.nome}</span>
                  <span className="block text-xs text-muted-foreground">
                    {c.tipo} · {c.status} · {c.itens.filter((i) => i.concluida).length} de {c.itens.length} itens
                    {c.recorrencia !== 'nenhuma' && ` · ${c.recorrencia}`}
                    {c.assinadoPor && ` · assinado por ${c.assinadoPor}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={CARTAO} data-testid="xgestao-obra-ocorrencias">
          <h2 className={TITULO}>Ocorrências</h2>
          {dados.ocorrencias.length === 0 ? vazio('Nenhuma ocorrência.') : (
            <ul className={LISTA}>
              {dados.ocorrencias.map((o) => (
                <li key={o.id} className="px-3 py-2" data-status={o.status}>
                  <span className="block font-medium">{o.titulo}</span>
                  <span className="block text-xs text-muted-foreground">
                    {o.gravidade} · {o.status === 'resolvida' ? `resolvida ${formatarData(o.resolvidaEm)}` : 'aberta'} · {formatarData(o.criadaEm)}
                  </span>
                  {o.observacaoResolucao && <span className="mt-0.5 block text-xs text-gray-500 dark:text-muted-foreground">Resolução: {o.observacaoResolucao}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
