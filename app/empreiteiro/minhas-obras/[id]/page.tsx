'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useMinhaObraDetalhe } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import type { MinhaObraDetalhe } from '@features/empreiteiro/minhas-obras/types';
import {
  STATUS_LABELS,
  PROGRESS_COLORS,
  OBRA_STATUS_DB_BADGE_CLASSES,
  obraStatusDbLabel,
} from '@shared/constants/status';
import { TaskManagerSection } from '@features/empreiteiro/minhas-obras/components/TaskManagerSection';
import { ChecklistsSection } from '@features/empreiteiro/minhas-obras/components/ChecklistsSection';
import { TimelineSection } from '@features/empreiteiro/minhas-obras/components/TimelineSection';
import { DocumentosSection } from '@features/empreiteiro/minhas-obras/components/DocumentosSection';
import { EquipeSection } from '@features/empreiteiro/minhas-obras/components/EquipeSection';
import { ContatoContratanteCard } from '@features/empreiteiro/minhas-obras/components/ContatoContratanteCard';
import { ContratoCard } from '@features/contratos/components/ContratoCard';
import { EtapasJ06Card } from '@features/obras/medicoes/components/EtapasJ06Card';
import { DiarioJ06Card } from '@features/obras/medicoes/components/DiarioJ06Card';
import { OcorrenciasJ06Card } from '@features/obras/medicoes/components/OcorrenciasJ06Card';
import { TabDisputas, type DisputaAlvoOption } from '@features/disputas/components/TabDisputas';
import { FotosJ06Card } from '@features/obras/medicoes/components/FotosJ06Card';
import { useAuthStore } from '@features/auth/store/auth-store';
import { LocalizacaoCard } from '@features/shared/components/LocalizacaoCard';
import { RegistrarMedicaoModal } from '@features/empreiteiro/minhas-obras/components/RegistrarMedicaoModal';
import { cn } from '@shared/lib/utils';
import React from 'react';
import { IconArrowBack, IconChevronRight, IconLocationOn, IconEvent, IconGroups, IconAddTask, IconCheckCircle, IconSchedule, IconTaskAlt, IconErrorOutline, IconFactCheck, IconTimeline, IconPhotoLibrary, IconFolderOpen, IconCalendarMonth, IconChecklist, IconWarning, IconConstruction, IconPayments, IconHealthAndSafety, IconHelpOutline, IconTrendingUp, IconHistory, IconPhotoCamera } from '@shared/components/icons';
import { HealthDetailPanel, computeHealthFromObra } from '@features/shared/health';
import { computeProfitFromObra } from '@features/shared/profit';
import { FinanceiroTab } from '@features/empreiteiro/minhas-obras/components/FinanceiroTab';
import { CronogramaGanttCard } from '@features/empreiteiro/minhas-obras/components/CronogramaGanttCard';
import { AtualizacoesTab } from '@features/empreiteiro/minhas-obras/components/AtualizacoesTab';
import { useObraMedicoes } from '@features/empreiteiro/minhas-obras/hooks/use-obra-medicoes';
import { CompartilharModal } from '@features/empreiteiro/minhas-obras/components/CompartilharModal';
import { TrocarCapaModal } from '@features/xgestao/components/TrocarCapaModal';
import { EditarInformacoesModal } from '@features/xgestao/components/EditarInformacoesModal';
import { EditarLocalizacaoModal } from '@features/xgestao/components/EditarLocalizacaoModal';
import { ExcluirObraDialog } from '@features/xgestao/components/ExcluirObraDialog';
import { GuidedTour, type TourStep } from '@features/xgestao/components/GuidedTour';
import { useGuidedTour } from '@features/xgestao/hooks/use-guided-tour';
import { useObraShares, toAbsoluteShareUrl } from '@features/xgestao/obra-publica/hooks/use-obra-share';
import { useToast } from '@shared/hooks/use-toast';

const STATUS_BG: Record<string, string> = {
  em_execucao: 'bg-primary text-white',
  com_atrasos: 'bg-red-500 text-white',
  com_pendencias: 'bg-amber-500 text-white',
  planejamento: 'bg-blue-500 text-white',
  finalizada: 'bg-green-500 text-white',
};

const PROGRESS_BAR_COLORS: Record<string, string> = {
  primary: 'bg-primary',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  success: 'bg-green-500',
};

type ObraTab = 'atualizacoes' | 'tarefas' | 'checklists' | 'timeline' | 'fotos' | 'diario' | 'documentos' | 'etapas' | 'cronograma' | 'ocorrencias' | 'disputas' | 'saude' | 'financeiro';

/**
 * XG12 — ordem por frequência de uso, com adjacência semântica preservada.
 *
 * "Atualizações" abre a lista porque é o ciclo central do produto: registrar
 * avanço e conferir o histórico. Tarefas→Etapas→Cronograma ficam juntas (a
 * tarefa pertence à etapa, o cronograma é a mesma etapa no eixo do tempo), e
 * Fotos↔Diário também. "Saúde" fica no fim: é resumo derivado de tudo acima —
 * e, desde a XG17, só aparece em obra de marketplace (ver `tabsVisiveis`).
 */
const TABS: { key: ObraTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  // XG12 — a aba que faltava. O botão "Adicionar Atualização" gravava em
  // `medicoes` e nenhuma tela autenticada lia a tabela: o dono via menos da
  // própria obra do que o cliente dele, que tem esta lista no link público.
  { key: 'atualizacoes', label: 'Atualizações', Icon: IconTrendingUp },
  { key: 'tarefas', label: 'Tarefas', Icon: IconTaskAlt },
  // XG10 — o que se chamava "Cronograma" sempre foi cadastro de etapas
  // ("o nome cronograma está errado, isso aqui não é um cronograma, é uma
  // etapa", 08:11). O cronograma de verdade, com datas, é a aba ao lado.
  { key: 'etapas', label: 'Etapas', Icon: IconChecklist },
  { key: 'cronograma', label: 'Cronograma', Icon: IconCalendarMonth },
  { key: 'fotos', label: 'Fotos', Icon: IconPhotoLibrary },
  { key: 'diario', label: 'Diário', Icon: IconHistory },
  { key: 'ocorrencias', label: 'Ocorrências', Icon: IconWarning },
  { key: 'checklists', label: 'Checklists', Icon: IconFactCheck },
  { key: 'documentos', label: 'Documentos', Icon: IconFolderOpen },
  { key: 'timeline', label: 'Timeline', Icon: IconTimeline },
  { key: 'financeiro', label: 'Financeiro', Icon: IconPayments },
  { key: 'disputas', label: 'Disputas', Icon: IconWarning },
  { key: 'saude', label: 'Saúde', Icon: IconHealthAndSafety },
];

/**
 * XG10 — a aba Disputas sai do xgestão: "a gente não vai decidir nada para
 * ninguém aqui como plataforma... a única interação que tem aqui é do
 * prestador, não tem por que a gente se envolver" (13:24–13:34).
 *
 * Ocultada, não apagada: `features/disputas/` e as rotas seguem servindo o
 * marketplace, onde a mediação entre contratante e empreiteiro faz sentido
 * (princípio do README §3 — reversibilidade é entregável).
 */
function tabsVisiveis(isObraPropria: boolean, obra?: MinhaObraDetalhe) {
  /*
   * XG17 — "Saúde" sai junto com "Disputas" na obra própria, pelo mesmo
   * mecanismo: ocultar por filtro, não apagar a aba. Em obra de marketplace
   * as duas continuam, e restaurar é remover a chave desta lista.
   *
   * XG23 — "Atualizações" e "Tarefas" entram na lista pelo mesmo caminho:
   *
   *   "exclui essa aba atualizações, exclui essa aba tarefas e exclui essa
   *    barra de porcentagem (...) tira isso tudo, e deixa só a etapas, e a
   *    etapa deixa com uma barrinha manual mesmo"
   *
   * O motivo dele é concreto: a etapa fechava sozinha quando a única tarefa
   * dela era concluída (média não-ponderada em `tarefas/[tarefaId]`). Na obra
   * própria o avanço passa a ser digitado na etapa, então as duas abas que
   * alimentavam o cálculo antigo saem da frente.
   *
   * Só na obra própria: no marketplace a atualização é medição contratual —
   * o contratante aprova e isso libera pagamento. Lá nada muda.
   */
  const ocultasNaObraPropria: ObraTab[] = ['disputas', 'saude', 'atualizacoes', 'tarefas'];
  const tabsBase = isObraPropria
    ? TABS.filter((t) => !ocultasNaObraPropria.includes(t.key))
    : TABS;

  // O endpoint expõe as permissões da obra explicitamente. O teste de presença
  // abaixo fica como compatibilidade para respostas anteriores sem metadados;
  // campos de dados ausentes nunca devem decidir sobre uma permissão que veio
  // declarada no contrato.
  if (!isObraPropria || !obra) return tabsBase;
  const possui = (campo: keyof MinhaObraDetalhe) => Object.prototype.hasOwnProperty.call(obra, campo);
  const permissoes = obra.permissoesXgestao;
  const areaPermitida = (
    area: 'cronograma' | 'diario' | 'ocorrencias' | 'financeiro' | 'equipe',
    campoFallback: keyof MinhaObraDetalhe,
  ) => permissoes
    ? permissoes.areasPermitidas === null || permissoes.areasPermitidas.includes(area)
    : possui(campoFallback);
  const areasIndisponiveis = new Set<ObraTab>();
  if (!areaPermitida('cronograma', 'etapas')) {
    ['etapas', 'cronograma', 'checklists'].forEach((tab) => areasIndisponiveis.add(tab as ObraTab));
  }
  if (!areaPermitida('diario', 'timeline') || (!permissoes && !possui('fotos'))) {
    ['diario', 'fotos', 'timeline'].forEach((tab) => areasIndisponiveis.add(tab as ObraTab));
  }
  if (!areaPermitida('ocorrencias', 'ocorrencias')) areasIndisponiveis.add('ocorrencias');
  if (!areaPermitida('equipe', 'equipe')) areasIndisponiveis.add('documentos');
  const categoriasFinanceiro = permissoes?.categoriasFinanceiroPermitidas;
  if (
    !areaPermitida('financeiro', 'financeiro') ||
    (categoriasFinanceiro !== undefined && categoriasFinanceiro !== null && categoriasFinanceiro.length === 0)
  ) areasIndisponiveis.add('financeiro');
  return tabsBase.filter((tab) => !areasIndisponiveis.has(tab.key));
}

/**
 * Roteiro do console, na ordem do ciclo real de trabalho.
 *
 * XG24 — o roteiro passou a cobrir a obra inteira. Antes tinha 6 passos: batia
 * na barra de abas por fora, entrava só em Etapas e deixava de lado Cronograma,
 * Fotos, Diário, Ocorrências, Checklists, Documentos, Timeline, Financeiro,
 * Equipe e Localização. O cliente reparou — "não passou por algumas abas, não
 * passou por equipe nem edição de localização".
 *
 * Não foi descuido: o roteiro ENCOLHEU na XG23, quando três passos perderam o
 * alvo de uma vez (a barra "Progresso geral" saiu da obra própria, a aba
 * "Atualizações" foi removida) e entraram dois sobre Etapas. Ficou correto e
 * curto, e ninguém o reavaliou contra a tela que sobrou.
 *
 * Os alvos miram a RAIZ de cada card, não o conteúdo: `gantt-svg` só existe
 * com etapas datadas, `valores-do-contrato` depende de contrato. Obra
 * recém-criada é exatamente quem vê o tour — alvo condicional a dados quebra
 * para o público certo. Onde a raiz também é condicional (Localização só
 * renderiza sob `obra.localizacao`), o `GuidedTour` pula o passo sozinho.
 */
function tourConsole(irParaAba: (aba: ObraTab) => void): TourStep[] {
  return [
    {
      target: '[data-tour="abas-obra"]',
      title: 'Tudo da obra em um lugar',
      description:
        'Cada aba guarda um tipo de registro. Vamos passar por todas — leva um minuto, e depois você sabe onde encontrar cada coisa.',
      onEnter: () => irParaAba('etapas'),
    },
    {
      target: '[data-testid="card-etapas-j06"]',
      title: 'Etapas: as fases da obra',
      description:
        'Cadastre fundação, alvenaria, acabamento — o que fizer sentido para esta obra. É daqui que sai o cronograma.',
      onEnter: () => irParaAba('etapas'),
    },
    {
      target: '[data-tour="etapa-progresso"]',
      title: 'O avanço é você quem marca',
      description:
        'Arraste a barrinha da etapa ou digite a porcentagem ao lado. Vale na hora, aparece no cronograma e é o que o seu cliente vê no link.',
      onEnter: () => irParaAba('etapas'),
    },
    {
      target: '[data-tour="aba-cronograma"]',
      title: 'Cronograma',
      description:
        'As etapas que têm data viram uma linha do tempo, com o dia de hoje marcado. Serve para ver o que atrasou sem abrir planilha.',
      onEnter: () => irParaAba('cronograma'),
    },
    {
      target: '[data-testid="card-fotos-j06"]',
      title: 'Fotos da obra',
      description:
        'O registro visual do andamento. As fotos daqui também alimentam a capa da obra e o link do cliente.',
      onEnter: () => irParaAba('fotos'),
    },
    {
      target: '[data-testid="card-diario-j06"]',
      title: 'Diário de obra',
      description:
        'O que aconteceu no dia: clima, equipe em campo, o que avançou. Escreve e publica — fica registrado com data e autor.',
      onEnter: () => irParaAba('diario'),
    },
    {
      target: '[data-testid="card-ocorrencias-j06"]',
      title: 'Ocorrências',
      description:
        'O que saiu do previsto: atraso de material, chuva, retrabalho. Registrar aqui é o que sustenta a conversa depois.',
      onEnter: () => irParaAba('ocorrencias'),
    },
    {
      target: '[data-tour="aba-checklists"]',
      title: 'Checklists',
      description:
        'Segurança, conformidade e qualidade. Dá para criar checklists que se repetem sozinhos, todo dia ou toda semana.',
      onEnter: () => irParaAba('checklists'),
    },
    {
      target: '[data-tour="aba-documentos"]',
      title: 'Documentos',
      description:
        'Projeto, ART, licença, contrato. Envie os arquivos da obra e encontre todos organizados por categoria.',
      onEnter: () => irParaAba('documentos'),
    },
    {
      target: '[data-tour="aba-timeline"]',
      title: 'Timeline',
      description:
        'O histórico de tudo que aconteceu na obra, em ordem. Útil para lembrar quando algo foi feito e por quem.',
      onEnter: () => irParaAba('timeline'),
    },
    {
      // Painel da aba, não o card "Valores do contrato": aquele só existe com
      // contrato lançado, e obra sem contrato é o caso comum aqui.
      target: '[data-tour="painel-aba"]',
      title: 'Financeiro',
      description:
        'Entradas, saídas e o saldo a receber. Lance o que entrou e o que saiu para acompanhar o lucro da obra de verdade.',
      onEnter: () => irParaAba('financeiro'),
    },
    {
      target: '[data-tour="equipe-obra"]',
      title: 'Equipe e colaboradores',
      description:
        'Quem trabalha nesta obra. Cadastre o membro com o PIX e o valor combinado, e gere o contrato do prestador direto daqui.',
    },
    {
      target: '[data-tour="trocar-capa"]',
      title: 'A cara da obra',
      description:
        'Troque a foto de capa sem sair daqui: envie uma nova ou escolha uma já registrada na aba Fotos.',
    },
    {
      target: '[data-tour="detalhes-obra"]',
      title: 'Detalhes da obra',
      description:
        'Descrição, tipo, área e prazos — o mesmo conteúdo que o cliente vê. Clique em "Editar informações" para ajustar sem trocar de tela.',
    },
    {
      target: '[data-tour="localizacao-obra"]',
      title: 'Endereço e mapa',
      description:
        'O endereço do terreno, com mapa. Use "Editar endereço" para corrigir — o cliente vê a região no link, nunca o endereço exato.',
    },
    {
      // XG18 — aponta para o bloco dentro do card de detalhes: o botão que
      // ficava sobre a capa saiu, e é ali que o link agora vive por inteiro.
      target: '[data-tour="compartilhar-link"]',
      title: 'Compartilhar com o cliente',
      description:
        'Gere o link para o cliente acompanhar sem criar conta, copie aqui mesmo e escolha, em "Gerenciar", o que ele vê. Valores, equipe e endereço exato nunca são compartilhados. Dá para revogar quando quiser.',
    },
  ];
}

function BotaoAjuda({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-primary/40 hover:text-primary dark:border-gray-700 dark:text-gray-300"
      data-testid="botao-ajuda"
    >
      <IconHelpOutline className="text-base" />
      Ajuda
    </button>
  );
}

function formatAreaM2(value: string): string {
  const area = Number(value);
  if (!Number.isFinite(area)) return `${value} m²`;
  return `${area.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`;
}

/**
 * XG13 — casca dos KPIs com o acabamento "luminous" que o resto do produto já usa
 * (`app/globals.css` §Luminous card border, `LuminousHoverCard`): borda em gradiente
 * mascarado — transparente nos cantos, opaca no meio —, linha primary no topo e
 * fundo sutil ao passar o mouse.
 *
 * Por que não reusar `LuminousHoverCard` direto: ele envolve o `<Card>` do shadcn,
 * que traz padding e estrutura próprios. Estes cinco KPIs são `div`s com layout
 * próprio (barra de progresso, legenda, badge condicional) que o `<Card>` quebraria.
 * As duas `<span>` decorativas abaixo são as mesmas de `LuminousHoverCard.tsx:58-66`.
 *
 * `luminous` é opt-in e fica ligado só na obra própria do xgestão: o console é
 * arquivo compartilhado, e o marketplace não muda de aparência.
 */
function KpiCardShell({
  luminous,
  className,
  children,
}: {
  luminous: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all dark:bg-gray-900 sm:p-5',
        luminous
          ? 'luminous-card group overflow-hidden border-gray-100 hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-gray-800/40'
          : 'border-gray-100 dark:border-gray-800',
        className,
      )}
    >
      {luminous && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-[2]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
          />
        </>
      )}
      {/* Acima dos decorativos: o gradiente de fundo é z-0. */}
      <div className="relative z-10 flex flex-col gap-3">{children}</div>
    </div>
  );
}

/** Caixa do ícone do KPI. `border-transparent` em repouso evita salto de layout
 *  quando a borda aparece no hover (mesmo cuidado de `StatsCard.tsx:45`). */
function kpiIconClasses(luminous: boolean, cor: string) {
  return cn(
    'p-2.5 rounded-lg transition-all duration-300',
    cor,
    luminous && 'border border-transparent group-hover:border-primary/40 group-hover:scale-105',
  );
}

/**
 * Espelha a seção "Detalhes da obra" do link público. O que o dono preenche na
 * edição precisa reaparecer aqui — antes `descricao` e `areaM2` eram salvos e
 * só existiam na página pública, o que lia como "a edição não salvou".
 */
/**
 * XG17 — o link público passa a viver no card de detalhes.
 *
 * Antes só existia como botão sobre a capa: para saber se havia link ativo,
 * quantas visualizações tinha ou qual era a URL, era preciso abrir o modal ou
 * ir até a antiga tela de edição (removida na XG18). O painel herdou o layout
 * dela com uma melhora: lá a URL era texto puro e copiar exigia selecionar na
 * mão; aqui usa o `Input readOnly` + botão "Copiar" do `CompartilharModal`.
 *
 * Lê a mesma query (`useObraShares`) que o modal consome, então criar ou
 * revogar em qualquer um dos dois reflete no outro sem callback.
 *
 * XG30 — a obra pode ter um link por público; o bloco lista todos, cada um
 * com o próprio botão de copiar. Escolher o que cada um mostra fica no modal.
 */
function LinkPublicoBloco({
  obraId,
  onGerenciar,
}: {
  obraId: string;
  onGerenciar?: () => void;
}) {
  const { data, isLoading, error } = useObraShares(obraId);
  const shareError = error as (Error & { status?: number }) | null;
  if (shareError?.status === 403 || shareError?.status === 404) return null;
  const shares = data?.shares ?? [];
  const { toast } = useToast();
  const [copiado, setCopiado] = useState<string | null>(null);

  const copiar = async (linkId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(linkId);
      toast({ title: 'Link copiado!', description: 'URL copiada para a área de transferência.' });
      setTimeout(() => setCopiado(null), 2500);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível copiar o link.', variant: 'destructive' });
    }
  };

  return (
    <div
      className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50"
      data-testid="detalhes-link-publico"
      data-tour="compartilhar-link"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            shares.length > 0
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
          )}
          data-testid="detalhes-link-status"
        >
          {isLoading
            ? 'Consultando…'
            : shares.length === 0
              ? 'Nenhum link gerado'
              : shares.length === 1
                ? '1 link ativo'
                : `${shares.length} links ativos`}
        </span>
      </div>

      {shares.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {shares.map((share) => {
            const url = toAbsoluteShareUrl(share);
            return (
              <li
                key={share.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center"
                data-testid={`detalhes-link-${share.id}`}
              >
                <div className="flex min-w-0 items-baseline gap-2 sm:w-40 sm:shrink-0 sm:flex-col sm:gap-0">
                  <span className="truncate text-sm font-bold text-gray-900 dark:text-white">{share.nome}</span>
                  <span className="text-[11px] text-gray-500" data-testid="detalhes-link-metricas">
                    {share.visualizacoes === 0
                      ? 'Ainda não foi aberto'
                      : `${share.visualizacoes} ${share.visualizacoes === 1 ? 'visualização' : 'visualizações'}`}
                    {share.secoes.pagamentos ? ' · mostra pagamentos' : ''}
                  </span>
                </div>
                <input
                  readOnly
                  value={url}
                  onClick={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  data-testid="detalhes-link-url"
                />
                <button
                  type="button"
                  onClick={() => copiar(share.id, url)}
                  className="shrink-0 cursor-pointer rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                  data-testid="detalhes-link-copiar"
                >
                  {copiado === share.id ? 'Copiado' : 'Copiar'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Quem recebe acompanha a obra somente leitura, sem criar conta. {onGerenciar
          ? 'Crie um link por pessoa (cliente, arquiteto…) para escolher o que cada uma vê.'
          : 'Cada link pode mostrar informações diferentes para seu destinatário.'} Valores só aparecem no link com
        Pagamentos ligado; custos, lucro, equipe e o endereço exato nunca são compartilhados.
      </p>
      {onGerenciar && <button
        type="button"
        onClick={onGerenciar}
        className="mt-3 cursor-pointer text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-80"
        data-testid="detalhes-link-gerenciar"
      >
        {shares.length > 0 ? 'Gerenciar links públicos' : 'Gerar link público'}
      </button>}
    </div>
  );
}

function DetalhesObraCard({
  obra,
  onEditar,
  mostrarLinks,
  onGerenciarLink,
  onExcluir,
}: {
  obra: MinhaObraDetalhe;
  onEditar?: () => void;
  mostrarLinks?: boolean;
  onGerenciarLink?: () => void;
  onExcluir?: () => void;
}) {
  // O adapter devolve "—" para data ausente; tratar como vazio evita um card
  // que anuncia um travessão como se fosse informação.
  const preenchido = (valor: string | undefined) =>
    valor && valor !== '—' ? valor : null;

  const itens = [
    { label: 'Tipo de obra', value: obra.tipo && obra.tipo !== 'Obra' ? obra.tipo : null },
    { label: 'Área', value: obra.areaM2 ? formatAreaM2(obra.areaM2) : null },
    { label: 'Início', value: preenchido(obra.dataInicio) },
    { label: 'Previsão de término', value: preenchido(obra.dataPrevisaoFim) },
  ].filter((item) => Boolean(item.value));

  const vazio = itens.length === 0 && !obra.descricao;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      // XG13 — `luminous-section` é o acabamento dos cards grandes no resto do
      // produto: borda em gradiente + degradê interno. Este card só existe em obra
      // própria (ver a condição no chamador), então não alcança o marketplace.
      className="luminous-section rounded-2xl border border-transparent bg-white p-5 shadow-none dark:bg-gray-900 sm:p-6"
      aria-labelledby="detalhes-obra-console"
      data-testid="detalhes-obra-card"
      data-tour="detalhes-obra"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="detalhes-obra-console" className="text-lg font-extrabold text-gray-900 dark:text-white">
            Detalhes da obra
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Estas informações também aparecem para quem abrir o link público.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onEditar && <button
            type="button"
            onClick={onEditar}
            className="cursor-pointer text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-80"
            data-testid="detalhes-editar-informacoes"
          >
            Editar informações
          </button>}
          {/* XG18 — o link "Cadastro completo" saiu junto com a tela `/editar`.
              Os 14 campos que ela editava vivem nos modais deste console, pelas
              mesmas funções de `use-editar-obra`; manter os dois caminhos era
              manter duas portas para o mesmo dado. */}
        </div>
      </div>

      {vazio ? (
        <p className="mt-4 text-sm text-gray-500" data-testid="detalhes-obra-vazio">
          Nenhum detalhe preenchido ainda. Adicione descrição, tipo, área e prazos para que o
          acompanhamento fique mais completo.
        </p>
      ) : (
        <>
          {obra.descricao && (
            <p
              className="mt-3 max-w-4xl whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300"
              data-testid="detalhes-obra-descricao"
            >
              {obra.descricao}
            </p>
          )}
          {itens.length > 0 && (
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {itens.map((item) => (
                <div key={item.label} className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                  <dt className="text-xs font-bold uppercase tracking-wider text-gray-500">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}

      {/* Fica fora do `vazio`: o link público independe de a obra ter
          descrição ou prazos preenchidos. */}
      {mostrarLinks && <LinkPublicoBloco obraId={obra.id} onGerenciar={onGerenciarLink} />}

      {/*
        XG18 — a exclusão desce para cá junto com o fim da tela `/editar`, que
        era seu único ponto de entrada em todo o produto.

        Fica no rodapé, discreta e separada por uma borda: apagar a obra leva
        junto tarefas, etapas, fotos, diário, documentos e lançamentos, então
        não pode disputar atenção com "Editar informações". A proteção real
        continua no diálogo, que exige digitar o nome da obra — um clique
        acidental não apaga meses de registro.
      */}
      {onExcluir && <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
        <button
          type="button"
          onClick={onExcluir}
          className="cursor-pointer text-xs font-semibold text-red-600 underline underline-offset-2 transition-opacity hover:opacity-80 dark:text-red-400"
          data-testid="detalhes-excluir-obra"
        >
          Excluir obra
        </button>
      </div>}
    </motion.section>
  );
}

export function ObraConsoleView({
  basePath,
  showMarketplaceContact = true,
  allowOwnWorkEdit = false,
}: {
  basePath: string;
  showMarketplaceContact?: boolean;
  allowOwnWorkEdit?: boolean;
}) {
  const params = useParams();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const id = params.id as string;
  const { data: obra, isLoading } = useMinhaObraDetalhe(id);
  const [activeTab, setActiveTab] = useState<ObraTab>('atualizacoes');
  /*
   * XG23 — a aba ativa tem de existir na lista visível.
   *
   * O estado nasce em 'atualizacoes', que é a primeira aba do marketplace mas
   * está oculta na obra própria. Sem esta correção a tela abriria com a barra
   * de abas montada e a área de conteúdo vazia, porque todo `activeTab === x`
   * falharia. Vale também para quem chega por um caminho que força uma aba
   * oculta (o painel de Saúde, por exemplo), em vez de tratar caso a caso.
   */
  const abasVisiveis = tabsVisiveis(Boolean(obra?.isObraPropria), obra);
  const abaAtual = abasVisiveis.some((t) => t.key === activeTab)
    ? activeTab
    : (abasVisiveis[0]?.key ?? activeTab);
  const categoriasFinanceiro = obra?.permissoesXgestao?.categoriasFinanceiroPermitidas;
  const somenteMaoDeObra = Boolean(
    obra?.isObraPropria &&
    categoriasFinanceiro?.length === 1 &&
    categoriasFinanceiro[0] === 'mao_de_obra',
  );
  const equipeAreaPermitida = !obra?.isObraPropria
    ? true
    : obra.permissoesXgestao
      ? obra.permissoesXgestao.areasPermitidas === null || obra.permissoesXgestao.areasPermitidas.includes('equipe')
      : Object.prototype.hasOwnProperty.call(obra, 'equipe');
  const linksAreaPermitida = !obra?.permissoesXgestao ||
    obra.permissoesXgestao.areasPermitidas === null ||
    obra.permissoesXgestao.areasPermitidas.includes('links');
  const podeEscreverConteudo = !obra?.isObraPropria || allowOwnWorkEdit;
  const [showAtualizacao, setShowAtualizacao] = useState(false);
  const [showShare, setShowShare] = useState(false);
  // XG12 — a edição da obra vem para a tela do console, em modais.
  const [showCapa, setShowCapa] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showLocal, setShowLocal] = useState(false);
  // XG18 — a exclusão vinha da tela `/editar`, que deixou de existir.
  const [showExcluir, setShowExcluir] = useState(false);
  // Ref para scroll até seção de medições via ?tab=medicoes (deep-link de notificações).
  const medicoesSectionRef = useRef<HTMLDivElement>(null);
  // O tour só faz sentido na obra própria do xgestão; a de marketplace tem
  // outro fluxo e outra contraparte.
  // XG12 — `console-v2`: a tela foi reorganizada (abas novas, edição em modal),
  // então quem viu o roteiro anterior viu uma tela que não existe mais. A chave
  // nova reexibe o tour uma vez, e é o custo certo de uma tela reorganizada.
  // XG23 — `console-v3` pelo mesmo motivo: a barra de progresso e duas abas
  // saíram, e três passos do roteiro apontavam para o que não existe mais.
  // XG24 — `console-v4`: o roteiro passou de 6 para 16 passos e agora cobre a
  // obra inteira. Sem chave nova, quem já usa o produto nunca veria o que foi
  // acrescentado — que é justamente o ponto da mudança.
  const tour = useGuidedTour('console-v4', Boolean(allowOwnWorkEdit && obra?.isObraPropria));
  // `useMemo` mantém a identidade dos passos estável: o `useLayoutEffect` do
  // tour depende de `step`, e um array recriado a cada render remediria o
  // alvo em loop.
  const passosDoTour = React.useMemo(() => tourConsole(setActiveTab), []);

  // Deep-link de notificação. XG12 — antes rolava até o bloco solto de
  // medições no rodapé; agora abre a aba que de fato lista as atualizações,
  // que é o que quem clica na notificação estava procurando.
  // `obra?.id` nas dependências, e não só `searchParams`: enquanto carrega, a
  // página faz early-return e o ref é `null` — o efeito saía pelo guard e
  // nunca mais rodava, deixando o deep-link dependente de cache quente.
  // XG23 — só no marketplace: na obra própria a aba 'atualizacoes' está oculta,
  // e forçá-la deixaria a área de conteúdo vazia. A notificação que gera este
  // link é a de medição, que é fluxo de marketplace de qualquer modo.
  useEffect(() => {
    if (obra?.isObraPropria) return;
    if (searchParams?.get('tab') !== 'medicoes' || !medicoesSectionRef.current) return;
    setActiveTab('atualizacoes');
    // Aguarda a renderização completa antes de rolar.
    const timer = setTimeout(() => {
      medicoesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchParams, obra?.id]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-10 animate-pulse space-y-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-40" />
        <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="p-4 sm:p-6 lg:p-10 text-center py-20">
        <IconConstruction className="text-5xl text-gray-300 block mb-4" />
        <h3 className="text-lg font-bold text-gray-500">Obra não encontrada</h3>
        <Link href={basePath} className="text-primary font-semibold mt-2 inline-block" data-testid="link-back-not-found">
          Voltar para Minhas Obras
        </Link>
      </div>
    );
  }

  const progressColor = PROGRESS_COLORS[obra.status] || 'primary';
  const progressBarColor = PROGRESS_BAR_COLORS[progressColor] || 'bg-primary';
  // Obra própria do xgestão mostra o status que o dono escolheu; obra de
  // marketplace segue com o status derivado (que sinaliza atraso e pendências).
  const mostrarStatusProprio = Boolean(obra.isObraPropria && obra.statusObra);
  const statusBg = mostrarStatusProprio
    ? OBRA_STATUS_DB_BADGE_CLASSES[obra.statusObra!]
    : STATUS_BG[obra.status] || 'bg-gray-500/20 text-gray-200';
  const statusLabel = mostrarStatusProprio
    ? obraStatusDbLabel(obra.statusObra!)
    : STATUS_LABELS[obra.status];
  // XG13 — o acabamento luminous é exclusivo do xgestão. O console é o mesmo
  // arquivo do marketplace, que segue com a aparência atual.
  const kpiLuminous = Boolean(obra.isObraPropria);

  return (
    <div className="p-4 sm:p-6 lg:p-10 flex flex-col gap-6 sm:gap-8">

      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <Link
          href={basePath}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
          data-testid="link-back"
        >
          <IconArrowBack className="text-lg" />
          Voltar
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link href={basePath} className="text-gray-400 hover:text-primary transition-colors">
              Minhas Obras
            </Link>
            <IconChevronRight className="text-gray-300 text-base" />
            <span className="text-primary font-semibold" data-testid="text-breadcrumb-title">{obra.titulo}</span>
          </nav>
          {allowOwnWorkEdit && obra.isObraPropria && <BotaoAjuda onClick={tour.abrir} />}
        </div>
      </motion.div>

      {/* BLOCO 1: Hero da Obra */}
      {/*
        XG17 — este hero NÃO deve ser `relative`.

        O bloco de título/entrega é `md:absolute md:bottom-0` e precisa ancorar
        no rodapé da CAPA, não do card. Ancorado aqui, o `bottom-0` miraria o fim
        do card inteiro — e o bloco cairia em cima da barra de progresso. A
        âncora correta é o wrapper logo abaixo, que contém só capa + bloco.
      */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm"
        data-testid="hero-minha-obra"
      >
        {/*
          XG12 — "Trocar capa" volta ao hero, agora persistindo de verdade.
          O controle antigo (J40 P0 #3) usava `URL.createObjectURL`, um blob
          local que sumia no F5, e a capa era do contratante. Na obra própria do
          xgestão o `PATCH` aceita `fotoCapaFileId` — com anti-IDOR: o arquivo
          precisa ser do dono e já vinculado a esta obra. Em obra de marketplace
          o botão nem aparece, e o backend seguiria recusando.
        */}
        {/*
          XG13 — no celular o conteúdo do hero sai de cima da capa.
          Antes, título, endereço, metadados e quatro botões viviam todos em
          `absolute` dentro de uma capa 16:7: num aparelho de 360px isso dá ~157px
          de altura útil, e o texto acabava espremido contra a imagem. A partir de
          `md` nada muda — a sobreposição continua igual ao desktop de hoje.
        */}
        {/*
          XG17 — o wrapper que ancora a sobreposição.

          Ele existe por um motivo só: ser o containing block do bloco de
          título/entrega, que é `md:absolute md:bottom-0`. Envolve a capa e o
          bloco, e NÃO a barra de progresso — é exatamente essa fronteira que
          faz o `bottom-0` mirar o rodapé da imagem em vez do rodapé do card.

          Por breakpoint:
          • `<md`  — sem efeito: o wrapper fica em fluxo e cresce com a capa
                     mais o bloco, que também está em fluxo (XG13 preservada).
          • `md+`  — o bloco vira `absolute` e sai do fluxo, então o wrapper
                     colapsa para a altura da capa. `bottom-0` = rodapé da capa.

          Não precisa de `overflow-hidden` (o hero já recorta o arredondamento)
          nem de altura própria: ela vem da capa.
        */}
        <div className="relative">
        {/*
          XG17 — altura fixa no lugar de `md:aspect-[16/7] md:h-auto`.

          A proporção veio dos heros do marketplace, onde o container é estreito.
          No console do xgestão o conteúdo ocupa a largura toda: num monitor de
          ~1650px, 16:7 rendia ~720px de capa — quase toda a área rolável do
          shell (`h-screen` menos a topbar `h-20`).

          420px comporta o bloco sobreposto (badge + título `md:text-5xl` +
          endereço + `md:p-8` ≈ 200px) sem espremer o texto contra a imagem, e
          sem voltar ao tamanho que ocupava a tela inteira.
        */}
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 sm:h-56 md:h-[420px]">
          {obra.imagemUrl && (
            <img
              src={obra.imagemUrl}
              alt={obra.titulo}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {allowOwnWorkEdit && obra.isObraPropria && (
            <button
              type="button"
              onClick={() => setShowCapa(true)}
              className="absolute right-4 top-4 z-10 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/25 bg-black/40 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/60"
              data-testid="xgestao-trocar-capa"
              data-tour="trocar-capa"
            >
              <IconPhotoCamera className="text-base" />
              Trocar capa
            </button>
          )}
        </div>

        {/*
          Abaixo de `md` este bloco fica em fluxo normal, logo abaixo da capa, com
          texto sobre o fundo do card. De `md` para cima ele volta a sobrepor a
          imagem, exatamente como antes (`absolute` + texto branco).

          ⚠️ O `md:absolute` depende do wrapper `relative` que envolve este bloco
          e a capa. Se aquele wrapper sair, o `absolute` sobe a cadeia procurando
          âncora: se achar o hero, cai sobre a barra de progresso; se não achar
          nenhuma, ancora no viewport e passa a acompanhar a rolagem. Os dois
          cenários já aconteceram — o wrapper é o que fecha a fronteira certa.
        */}
        <div className="relative bg-white p-4 text-gray-900 dark:bg-gray-900 dark:text-white sm:p-6 md:absolute md:bottom-0 md:left-0 md:right-0 md:bg-transparent md:p-8 md:text-white md:dark:bg-transparent">
          <div className="md:relative">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span
                    className={cn('text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block backdrop-blur-sm', statusBg)}
                    data-testid="badge-status"
                  >
                    {statusLabel}
                  </span>
                  {/* Na obra própria o badge acima mostra o status escolhido pelo
                      dono; o atraso vira sinal adicional em vez de substituí-lo. */}
                  {mostrarStatusProprio && obra.diasAtraso > 0 && (
                    <span
                      className="inline-block rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm"
                      data-testid="badge-atraso"
                    >
                      {obra.diasAtraso} {obra.diasAtraso === 1 ? 'dia' : 'dias'} de atraso
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight break-words mb-3" data-testid="text-titulo">
                  {obra.titulo}
                </h1>
                <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 md:items-center md:text-white/90">
                  <IconLocationOn className="text-lg shrink-0" />
                  <span>{obra.endereco}</span>
                </div>
              </div>
              {/*
                XG13 — no celular estes metadados e os botões empilham em coluna
                única, e cada botão ocupa a largura toda: é o alvo de toque de quem
                está em obra, com uma mão ("o cara não vai pegar um computador pra
                lançar", 17:11). De `md` em diante volta a ser a linha do desktop.
              */}
              <div className="flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-end md:gap-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 md:text-white/90">
                  <IconEvent className="text-lg shrink-0" />
                  <div className="leading-tight">
                    <p className="text-xs text-gray-500 dark:text-gray-400 md:text-white/60">Entrega prevista</p>
                    {/* O adapter devolve "—" quando não há data; exibir o
                        travessão sozinho parece campo quebrado. */}
                    <p className="font-bold text-sm">
                      {obra.dataPrevisaoFim && obra.dataPrevisaoFim !== '—'
                        ? obra.dataPrevisaoFim
                        : 'A definir'}
                    </p>
                  </div>
                </div>
                {obra.temContratante && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 md:text-white/90">
                    <IconGroups className="text-lg" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 md:text-white/60">Contratante</p>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold', obra.contratante.cor)}>
                          {obra.contratante.iniciais}
                        </div>
                        <p className="font-bold text-sm">{obra.contratante.nome}</p>
                      </div>
                    </div>
                  </div>
                )}
                {/*
                  XG18 — o hero não tem mais botão nenhum.

                  "Editar obra" e "Adicionar Atualização" saíram na XG17, por
                  já existirem no caminho natural de cada um. Agora sai também
                  "Compartilhar link": o card "Detalhes da obra", logo abaixo,
                  mostra o link inteiro com botão "Copiar" e o status do
                  compartilhamento. O botão sobre a capa repetia, com menos
                  informação, o que o card entrega melhor.

                  Sobre a capa fica só "Trocar capa", que age sobre a própria
                  imagem e não tem outro lugar onde caiba.
                */}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/*
          Progress bar section — fica FORA do wrapper `relative` fechado acima
          (capa + bloco de título). Se entrasse nele, o `md:bottom-0` do bloco
          miraria o rodapé desta barra e o texto cairia por cima dela.
        */}
        {/*
          XG23 — a barra sai da obra própria: "exclui essa barra de porcentagem,
          pode excluir, deixa 100".

          Ela consolidava as medições, e as medições eram justamente o caminho
          que o cliente pediu para remover. Sem escritor, o número ficaria
          parado na tela — pior que não mostrar. O avanço agora se lê nas
          etapas, cada uma com a sua porcentagem digitada.

          No marketplace continua: lá `obras.progresso` é a soma das medições
          aprovadas pelo contratante, e tem peso contratual.
        */}
        {!obra.isObraPropria && (
          <div className="border-t border-gray-100 p-4 dark:border-gray-800 sm:p-6 md:border-t-0 md:p-8 bg-gray-50 dark:bg-gray-800/50" data-testid="progress-bar-section">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Progresso Geral</span>
                <p className="mt-1 text-xs text-gray-400">Avanço consolidado da execução da obra</p>
              </div>
              <div className="flex shrink-0 items-baseline gap-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{obra.progresso}</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">%</span>
              </div>
            </div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${obra.progresso}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                className={cn('h-full rounded-full', progressBarColor)}
              />
            </div>
          </div>
        )}
      </motion.div>

      {allowOwnWorkEdit && obra.isObraPropria && (
        <GuidedTour
          steps={passosDoTour}
          open={tour.open}
          onClose={tour.fechar}
          onDismiss={tour.dispensar}
        />
      )}

      {/* BLOCO 2.5: Detalhes da obra — espelha a seção do link público, para
          que o dono veja aqui exatamente o que preencheu na edição. */}
      {obra.isObraPropria && (
        <DetalhesObraCard
          obra={obra}
          onEditar={allowOwnWorkEdit ? () => setShowInfo(true) : undefined}
          mostrarLinks={linksAreaPermitida}
          onGerenciarLink={linksAreaPermitida ? (allowOwnWorkEdit ? () => setShowShare(true) : undefined) : undefined}
          onExcluir={allowOwnWorkEdit ? () => setShowExcluir(true) : undefined}
        />
      )}

      {/* BLOCO 3: KPIs Operacionais */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        // XG13 — duas colunas já no celular: o big number é curto, cabe lado a
        // lado e corta metade do scroll até as abas. Antes o `md` de 2 colunas
        // ainda deixava o quinto card sozinho numa linha.
        // XG23 — na obra própria sobram 3 cards (Progresso e Tarefas saíram),
        // então o grid acompanha para não deixar duas colunas vazias.
        className={cn(
          'grid grid-cols-2 gap-3 sm:gap-4',
          obra.isObraPropria ? 'lg:grid-cols-3' : 'lg:grid-cols-5',
        )}
      >
        {/* Progresso Real — XG23: sai junto com a barra na obra própria, pelo
            mesmo motivo (lê o mesmo `obra.progresso`, que lá não tem escritor). */}
        {!obra.isObraPropria && (
          <KpiCardShell luminous={kpiLuminous}>
            <div className="flex justify-between items-start">
              <div className={kpiIconClasses(kpiLuminous, 'bg-success/10 text-success')}>
                <IconCheckCircle />
              </div>
              <span className="text-success text-xs font-bold bg-success/10 px-2 py-1 rounded-full">Atual</span>
            </div>
            <div>
              {/* XG10 — "Real" não distinguia de nada: só existe um progresso. */}
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Progresso</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{obra.progresso}%</p>
            </div>
            <div className="h-1.5 w-full bg-success/20 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: `${obra.progresso}%` }} />
            </div>
          </KpiCardShell>
        )}

        {/* Dias de Atraso */}
        {/* O `border-l-4` âmbar é sinal de estado, não decoração: fica mesmo com
            o acabamento luminous ligado. */}
        <KpiCardShell
          luminous={kpiLuminous}
          className={obra.diasAtraso > 0 ? 'border-l-4 border-l-amber-500' : undefined}
        >
          <div className="flex justify-between items-start">
            <div className={kpiIconClasses(kpiLuminous, obra.diasAtraso > 0 ? 'bg-amber-50 text-amber-600' : 'bg-success/10 text-success')}>
              <IconSchedule />
            </div>
            {obra.diasAtraso > 0 && (
              <span className="text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded-full">Alerta</span>
            )}
          </div>
          {/* XG10 — antes mostrava "Dias em Atraso: 0" em obra no prazo, dando
              ênfase a um problema inexistente ("tá dando ênfase em atraso...
              não, tipo, tá no prazo", 25:00). O número de dias só aparece
              quando há atraso de fato. */}
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Prazo da obra</p>
            {obra.diasAtraso > 0 ? (
              <p className="text-2xl sm:text-3xl font-extrabold mt-1 text-amber-600">
                {obra.diasAtraso}
                <span className="text-base font-bold ml-1">
                  {obra.diasAtraso === 1 ? 'dia' : 'dias'}
                </span>
              </p>
            ) : (
              <p className="text-xl sm:text-2xl font-extrabold mt-1 text-success flex items-center gap-1.5">
                <IconCheckCircle className="text-2xl" />
                No prazo
              </p>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {obra.diasAtraso > 0
              ? `Em atraso desde ${obra.dataPrevisaoFim || 'a data prevista'}`
              : obra.dataPrevisaoFim
                ? `Previsão: ${obra.dataPrevisaoFim}`
                : 'Sem data de previsão definida'}
          </p>
        </KpiCardShell>

        {/* Tarefas Pendentes — XG23: escondido na obra própria junto com a aba.
            Sem a aba, o número vira um dado sem destino: o usuário lê "2 total"
            e não tem para onde clicar. Os contadores seguem vindo do servidor,
            então basta reexibir o card se as tarefas voltarem. */}
        {!obra.isObraPropria && (
        <KpiCardShell luminous={kpiLuminous}>
          <div className="flex justify-between items-start">
            <div className={kpiIconClasses(kpiLuminous, 'bg-purple-50 dark:bg-purple-900/20 text-purple-600')}>
              <IconTaskAlt />
            </div>
            <span className="text-purple-600 text-xs font-bold bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full">
              {obra.tarefasTotal} total
            </span>
          </div>
          {/* XG10 — o card contava tudo que não estava concluído e chamava de
              "pendente", então tarefa em execução entrava no número ("eu tô
              executando, ele coloca como tarefa pendente", 25:39). Agora mostra
              o que está em andamento. */}
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Em andamento</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {obra.tarefasEmAndamento ?? 0}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            {obra.tarefasTotal - obra.tarefasPendentes} concluídas de {obra.tarefasTotal}
          </p>
        </KpiCardShell>
        )}

        {/* Problemas Abertos */}
        <KpiCardShell luminous={kpiLuminous}>
          <div className="flex justify-between items-start">
            <div className={kpiIconClasses(kpiLuminous, 'bg-red-50 dark:bg-red-900/20 text-red-600')}>
              <IconErrorOutline />
            </div>
            {obra.problemasAbertos > 0 && (
              <span className="text-red-600 text-xs font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">Atenção</span>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Problemas Abertos</p>
            <p className={cn('text-2xl sm:text-3xl font-extrabold mt-1', obra.problemasAbertos > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white')}>
              {obra.problemasAbertos}
            </p>
          </div>
          {/* XG10 — o subtítulo era "1 crítico, 2 médios" fixo no código. */}
          <p className="text-xs text-gray-500">
            {obra.problemasAbertos > 0
              ? [
                  obra.problemasPorGravidade?.critico
                    ? `${obra.problemasPorGravidade.critico} crítico${obra.problemasPorGravidade.critico > 1 ? 's' : ''}`
                    : null,
                  obra.problemasPorGravidade?.medio
                    ? `${obra.problemasPorGravidade.medio} médio${obra.problemasPorGravidade.medio > 1 ? 's' : ''}`
                    : null,
                  obra.problemasPorGravidade?.baixo
                    ? `${obra.problemasPorGravidade.baixo} baixo${obra.problemasPorGravidade.baixo > 1 ? 's' : ''}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(', ') || 'Em aberto'
              : 'Nenhum problema'}
          </p>
        </KpiCardShell>

        {/* Equipe no Canteiro */}
        <KpiCardShell luminous={kpiLuminous}>
          <div className="flex justify-between items-start">
            <div className={kpiIconClasses(kpiLuminous, 'bg-blue-50 dark:bg-blue-900/20 text-blue-600')}>
              <IconGroups />
            </div>
            {/* XG10 — o badge dizia "Hoje", mas o número é de cadastros na
                equipe, não de presença no dia. Rótulo agora diz o que mede. */}
            <span className="text-blue-600 text-xs font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
              Cadastrados
            </span>
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Equipe da obra</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{obra.equipeAtiva}</p>
          </div>
          <p className="text-xs text-gray-500">
            {obra.equipeAtiva === 1 ? 'pessoa registrada' : 'pessoas registradas'}
          </p>
        </KpiCardShell>
      </motion.div>

      {/*
        XG17 — o indicador de Saúde saiu do console do xgestão.

        O score e os rótulos ("Requer atenção", fatores ponderados) exigem
        entender a régua por trás para significar alguma coisa; para o dono da
        obra viravam alarme sem ação. Sai do xgestão inteiro — card, aba,
        resumo do dashboard e filtro da lista — e volta quando houver uma
        leitura que o usuário final consiga interpretar sozinho.

        Nada em `features/shared/health/**` foi removido: admin e contratante
        seguem usando, e a XG15 continua coberta pelos testes.
      */}

      {/* BLOCOs 4–10: Tabs */}
      <motion.div
        ref={medicoesSectionRef}
        id="secao-medicoes"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          'bg-white dark:bg-gray-900 rounded-2xl overflow-hidden',
          kpiLuminous
            ? 'luminous-section border border-transparent shadow-none'
            : 'border border-gray-100 dark:border-gray-800 shadow-sm',
        )}
      >
        {/*
          Tab bar — 12 abas não cabem numa tela de celular, então a barra rola na
          horizontal. O degradê à direita é a dica de que há mais: sem ele, a
          última aba visível parece ser a última que existe. `mask-image` não
          intercepta clique, ao contrário de um overlay posicionado por cima.
        */}
        <div
          className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] md:[mask-image:none]"
          data-tour="abas-obra"
        >
          {abasVisiveis.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-4 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer flex-shrink-0',
                abaAtual === tab.key
                  ? 'text-primary border-b-2 border-primary bg-white dark:bg-gray-900'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              )}
            >
              <tab.Icon className="text-[18px]" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {/* XG24 — âncora do painel da aba corrente. Vale para a aba cujo
                conteúdo é condicional a dados: o Financeiro só monta o card
                "Valores do contrato" quando há contrato, e uma obra sem
                contrato é o caso comum de quem está vendo o tour. O painel
                monta sempre. */}
            <motion.div
              key={abaAtual}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              data-tour="painel-aba"
            >
              {abaAtual === 'atualizacoes' && (
                <AtualizacoesTab
                  obraId={obra.id}
                  isOwnWork={obra.isObraPropria}
                  onRegistrar={() => setShowAtualizacao(true)}
                />
              )}
              {abaAtual === 'tarefas' && <TaskManagerSection obra={obra} />}
              {abaAtual === 'diario' && (
                <DiarioJ06Card obraId={obra.id} canWrite={podeEscreverConteudo} currentUserId={user?.id ?? null} />
              )}
              {abaAtual === 'checklists' && <ChecklistsSection obra={obra} readOnly={obra.isObraPropria && !allowOwnWorkEdit} />}
              {abaAtual === 'timeline' && <TimelineSection obraId={obra.id} fallbackEvents={obra.timeline} />}
              {abaAtual === 'fotos' && (
                <FotosJ06Card
                  obraId={obra.id}
                  canWrite={podeEscreverConteudo}
                  currentUserId={user?.id ?? null}
                  currentUserRole={user?.role}
                />
              )}
              {abaAtual === 'documentos' && <DocumentosSection obra={obra} readOnly={obra.isObraPropria && !allowOwnWorkEdit} />}
              {abaAtual === 'etapas' && (
                <EtapasJ06Card
                  obraId={obra.id}
                  canWrite={podeEscreverConteudo}
                  canEditScope={obra.isObraPropria && allowOwnWorkEdit}
                />
              )}
              {abaAtual === 'cronograma' && (
                <CronogramaGanttCard
                  obraId={obra.id}
                  onIrParaEtapas={() => setActiveTab('etapas')}
                  readOnly={obra.isObraPropria && !allowOwnWorkEdit}
                />
              )}
              {/* XG12 — `OcorrenciasSection` era `useState` puro: o que o
                  usuário criava ali evaporava no F5. Quem persiste é este
                  card, que estava escondido no rodapé. O arquivo antigo fica
                  no repo (reversibilidade), fora da árvore de render. */}
              {abaAtual === 'ocorrencias' && <OcorrenciasJ06Card obraId={obra.id} canWrite={podeEscreverConteudo} />}
              {abaAtual === 'disputas' && <DisputasTab obraId={obra.id} />}
              {/* XG17 — inalcançável na obra própria (`tabsVisiveis` filtra a
                  aba), mas mantido para o marketplace, onde a Saúde continua. */}
              {abaAtual === 'saude' && (
                <HealthDetailPanel
                  health={computeHealthFromObra(obra)}
                  actionsByFactor={{
                    atraso: { label: 'Ver cronograma', onClick: () => setActiveTab('cronograma') },
                    financeiro: { label: 'Ver financeiro', onClick: () => setActiveTab('financeiro') },
                    tarefas: { label: 'Ver tarefas', onClick: () => setActiveTab('tarefas') },
                  }}
                />
              )}
              {abaAtual === 'financeiro' && (
                <FinanceiroTab
                  obraId={obra.id}
                  metrics={somenteMaoDeObra ? undefined : computeProfitFromObra(obra)}
                  somenteMaoDeObra={somenteMaoDeObra}
                  // XG12 — os KPIs de contrato (contratado, aditivos, total,
                  // saldo) vinham do "Resumo Financeiro" solto no rodapé.
                  financeiro={somenteMaoDeObra ? undefined : obra.financeiro}
                  // Marketplace: o dinheiro da obra é do contratante, então o
                  // empreiteiro atribuído lê mas não lança.
                  podeLancar={allowOwnWorkEdit && obra.isObraPropria}
                  // XG29 — mesmo valor, propósito distinto: este decide o que a
                  // aba **exibe** (a barra "Percentual executado" sai na obra
                  // própria), aquele decide o que ela deixa **escrever**.
                  isObraPropria={obra.isObraPropria}
                  // XG20 — a mesma equipe do bloco abaixo, para o modal de saída
                  // oferecer quem recebeu. Já vem no detalhe, sem fetch novo.
                  equipe={obra.equipe}
                  // XG18 — mesmo acabamento dos KPIs do topo. Sem isto os cards
                  // de resultado ficavam com o hover antigo, destoando deles.
                  luminous={kpiLuminous}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/*
        XG12 — o bloco "Medições e diário da obra" e o "Resumo Financeiro"
        saíram daqui. Diário, Fotos e Ocorrências já eram abas (os cards de
        baixo eram as mesmas instâncias, duplicadas), e os KPIs de contrato
        migraram para o topo da aba Financeiro. O que sobra abaixo das abas é
        contexto da obra — equipe, contrato, localização —, não fluxo de
        trabalho.
      */}

      {/* BLOCO 12: Equipe e Colaboradores */}
      {equipeAreaPermitida && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {/* XG10 — equipe deixa de ser somente leitura na obra própria. O
              backend sempre aceitou membro sem conta na plataforma
              (`obra_equipe.user_id` é nullable), e era só a UI que travava:
              "os empreiteiros na obra... eu coloco o Jefferson, o telefone do
              cara. Eu não preciso cadastrar ele na plataforma" (27:25–27:33). */}
          <EquipeSection obra={obra} readOnly={obra.isObraPropria && !allowOwnWorkEdit} />
        </motion.div>
      )}

      {/* J58 — Contrato entre as partes (auto-oculta se a obra não tem contrato). */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
        <ContratoCard obraId={obra.id} />
      </motion.div>

      {/* O xgestão não expõe o chat do marketplace; obras próprias não têm contratante. */}
      {showMarketplaceContact && obra.temContratante && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}>
          <ContatoContratanteCard contratante={obra.contratante} obraId={obra.id} obraTitulo={obra.titulo} />
        </motion.div>
      )}

      {/* BLOCO 15: Localização */}
      {obra.localizacao && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <LocalizacaoCard
            localizacao={obra.localizacao}
            onEditar={
              allowOwnWorkEdit && obra.isObraPropria ? () => setShowLocal(true) : undefined
            }
          />
        </motion.div>
      )}

      <RegistrarMedicaoModal
        open={showAtualizacao}
        onOpenChange={setShowAtualizacao}
        obraId={obra.id}
        obraTitulo={obra.titulo}
        isOwnWork={obra.isObraPropria}
      />
      {allowOwnWorkEdit && obra.isObraPropria && (
        <>
          <CompartilharModal
            open={showShare}
            onOpenChange={setShowShare}
            obra={obra}
          />
          <TrocarCapaModal obraId={obra.id} open={showCapa} onOpenChange={setShowCapa} />
          <EditarInformacoesModal obraId={obra.id} open={showInfo} onOpenChange={setShowInfo} />
          <EditarLocalizacaoModal obraId={obra.id} open={showLocal} onOpenChange={setShowLocal} />
          <ExcluirObraDialog
            obraId={obra.id}
            obraNome={obra.titulo}
            open={showExcluir}
            onOpenChange={setShowExcluir}
            redirectTo={basePath}
          />
        </>
      )}

    </div>
  );
}

export default function MinhaObraDetalhePage() {
  return <ObraConsoleView basePath="/empreiteiro/minhas-obras" />;
}

/**
 * XG12 — as disputas passam a apontar para medições de verdade.
 *
 * Antes os alvos vinham de `obra.financeiro.medicoes`, que apesar do nome
 * lista linhas da tabela `financeiro` — o `numero` era o índice do array. A
 * disputa recebia um ID de lançamento rotulado `tipo: 'medicao'`, e o
 * validador da rota não tinha como casá-lo com nada.
 *
 * Marketplace apenas: no xgestão a aba é ocultada por `tabsVisiveis`.
 */
function DisputasTab({ obraId }: { obraId: string }) {
  const { data: medicoes = [] } = useObraMedicoes(obraId);
  return (
    <TabDisputas
      obraId={obraId}
      alvos={medicoes.map<DisputaAlvoOption>((m) => ({
        tipo: 'medicao',
        id: m.id,
        label: `Medição #${m.numero} — ${m.etapa}`,
      }))}
    />
  );
}
