'use client';

import { useObraMedicoes, type ObraMedicaoApi } from '../hooks/use-obra-medicoes';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';
import {
  IconAddTask,
  IconPerson,
  IconPhotoLibrary,
  IconTrendingUp,
} from '@shared/components/icons';

/**
 * XG12 — o histórico de atualizações da obra.
 *
 * Fecha o relato que abriu a jornada: o botão "Adicionar Atualização" existia
 * no hero, gravava em `medicoes`, e nenhuma aba lia a tabela. O dono via menos
 * da própria obra do que o cliente dele, que tem esta lista no link público.
 *
 * O formato espelha `TabAtualizacoesPublica` de propósito — quem publica
 * reconhece o que o cliente vê. A diferença é o que o dono pode ver a mais:
 * as fotos em si, o autor e o valor.
 */

const STATUS_BADGE: Record<ObraMedicaoApi['status'], { label: string; classes: string }> = {
  aguardando_aprovacao: {
    label: 'Aguardando aprovação',
    classes: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  },
  aprovada: {
    label: 'Aprovada',
    classes: 'bg-success/10 text-success',
  },
  rejeitada: {
    label: 'Contestada',
    classes: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  },
  paga: {
    label: 'Paga',
    classes: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  },
};

function formatDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * O botão do hero usa `data-tour="adicionar-atualizacao"`; este usa o sufixo
 * `-aba`. Alvos distintos porque o `querySelector` do tour pega o primeiro do
 * DOM — o do hero — e o passo precisa destacar o botão daqui, junto da lista
 * que ele alimenta.
 */
function BotaoAdicionar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
      data-testid="btn-adicionar-atualizacao"
      data-tour="adicionar-atualizacao-aba"
    >
      <IconAddTask className="text-lg" />
      Adicionar atualização
    </button>
  );
}

/**
 * Sem prop de permissão: quem abre esta tela é o empreiteiro da obra — dono no
 * xgestão, atribuído no marketplace — e nos dois casos ele registra. É a mesma
 * regra do botão no hero. O contratante tem outra tela.
 */
export function AtualizacoesTab({
  obraId,
  isOwnWork,
  onRegistrar,
}: {
  obraId: string;
  isOwnWork: boolean;
  onRegistrar: () => void;
}) {
  const { data, isLoading, isError, refetch } = useObraMedicoes(obraId);

  const cabecalho = (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Atualizações da obra</h3>
        <p className="mt-1 text-sm text-gray-500">
          {isOwnWork
            ? 'Cada avanço registrado, com fotos e responsável. É o que move o progresso e aparece para o cliente.'
            : 'Medições enviadas ao contratante, com o parecer de cada uma.'}
        </p>
      </div>
      <BotaoAdicionar onClick={onRegistrar} />
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {cabecalho}
        <div className="space-y-3" aria-hidden>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        {cabecalho}
        <div className="rounded-xl border border-gray-100 py-10 text-center dark:border-gray-800">
          <p className="text-sm text-gray-500">Não foi possível carregar as atualizações.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 cursor-pointer text-sm font-semibold text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const atualizacoes = data ?? [];

  if (atualizacoes.length === 0) {
    return (
      <div>
        {cabecalho}
        <div
          className="rounded-xl border border-dashed border-gray-200 py-12 text-center dark:border-gray-700"
          data-testid="atualizacoes-vazio"
        >
          <IconTrendingUp className="mb-3 block text-4xl text-gray-300" />
          <p className="font-semibold text-gray-700 dark:text-gray-200">
            Nenhuma atualização registrada ainda
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {isOwnWork
              ? 'Registre o que foi executado — percentual, descrição e fotos. O progresso da obra sobe a partir daqui.'
              : 'As medições enviadas ao contratante aparecem nesta lista.'}
          </p>
          <div className="mt-5 flex justify-center">
            <BotaoAdicionar onClick={onRegistrar} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {cabecalho}
      <div className="space-y-4" data-testid="lista-atualizacoes">
        {atualizacoes.map((item) => {
          const badge = STATUS_BADGE[item.status];
          return (
            <article
              key={item.id}
              className="rounded-xl border border-gray-100 p-4 transition-colors hover:border-primary/30 dark:border-gray-800"
              data-testid={`atualizacao-${item.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      <IconTrendingUp />+{item.percentual}% de avanço
                    </span>
                    {/* Na obra própria toda atualização nasce aprovada — o
                        badge só informa onde existe um contratante decidindo. */}
                    {!isOwnWork && (
                      <span
                        className={cn('rounded-full px-2.5 py-1 text-xs font-bold', badge.classes)}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-2 font-bold text-gray-900 dark:text-white">{item.etapa}</h4>
                </div>
                <div className="text-right">
                  <time dateTime={item.dataEnvio} className="block text-xs text-gray-500">
                    {formatDate(item.dataEnvio)}
                  </time>
                  {item.valor > 0 && (
                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(item.valor)}
                    </p>
                  )}
                </div>
              </div>

              {item.descricao && (
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {item.descricao}
                </p>
              )}

              {item.motivoRejeicao && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                  <span className="font-semibold">Motivo da contestação:</span>{' '}
                  {item.motivoRejeicao}
                </p>
              )}

              {item.fotos.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                    <IconPhotoLibrary />
                    {item.fotos.length} {item.fotos.length === 1 ? 'foto' : 'fotos'}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {item.fotos.map((url, index) => (
                      <a
                        key={`${item.id}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-100 transition-opacity hover:opacity-80 dark:border-gray-800"
                      >
                        <img
                          src={url}
                          alt={`Foto ${index + 1} de ${item.etapa}`}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                <IconPerson className="text-sm" />
                Registrado por {item.autorNome}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
