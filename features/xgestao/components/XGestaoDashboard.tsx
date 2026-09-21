'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  RiBuilding2Line,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiMoneyDollarCircleLine,
  RiToolsLine,
  RiWallet3Line,
} from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { StatsCard } from '@features/shared/components/StatsCard';
import {
  semaforoFinanceiro,
  semaforoPrazo,
  type Semaforo,
} from '@features/xgestao/lib/indicadores-obra';
import { useMinhasObras } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import type { MinhaObra } from '@features/empreiteiro/minhas-obras/types';
import { NovaObraModal } from './NovaObraModal';
import { SinalObra, textoOrcamento, textoPrazo } from '@features/shared/components/SinalObra';
import { XGESTAO_OBRAS } from '../routes';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Button } from '@shared/components/ui/button';
// XG28 — o arquivo mantinha uma `formatCurrency` local idêntica a esta; a cópia
// privada saiu.
import { formatCurrencyRounded } from '@shared/lib/formatters';
import { OBRA_STATUS_DB_BADGE_CLASSES, obraStatusDbLabel } from '@shared/constants/status';
import { cn } from '@shared/lib/utils';

// XG29 — `SEMAFORO_DOT` e `LinhaSemaforo` moravam aqui e viraram
// `./SinalObra`, quando o card da listagem passou a exibir os mesmos sinais.

/** As variantes que o `StatsCard` já conhece (`BADGE_CLASSES`). */
const SEMAFORO_BADGE: Record<Semaforo, 'success' | 'warning' | 'error' | 'neutral'> = {
  ok: 'success',
  atencao: 'warning',
  critico: 'error',
  sem_dado: 'neutral',
};


/**
 * XG28 — uma obra na tabela de visão geral.
 *
 * **A linha inteira é clicável**, e isso não tinha precedente no projeto: as
 * tabelas do admin usam link ou botão por célula. Inaugurar o padrão custa o
 * cuidado que está aqui — sem ele, "clicar na linha" vira uma funcionalidade
 * que só existe para quem usa mouse:
 *
 * - o nome da obra continua sendo um `<Link>` de verdade, então o leitor de
 *   tela anuncia um destino e o ctrl+clique/"abrir em nova aba" funciona;
 * - a linha tem `onClick` só para ampliar a área de acerto — decisivo no
 *   celular, que é onde o dono da obra abre isso, em campo;
 * - o clique da linha é ignorado quando a origem já é um link, senão o
 *   `router.push` roubaria o ctrl+clique do `<Link>` de dentro dela.
 *
 * A linha **não** recebe `role="link"` nem `tabIndex`: duplicar o alvo de
 * teclado faria o leitor de tela anunciar a mesma obra duas vezes. O `<Link>`
 * da primeira célula já é a rota acessível.
 */
function ObraRow({ obra }: { obra: MinhaObra }) {
  const router = useRouter();
  const href = `/xgestao/obras/${obra.id}`;
  const prazo = semaforoPrazo(obra.diasAtraso);
  const financeiro = semaforoFinanceiro(obra.consumoOrcamento);

  return (
    <TableRow
      className="cursor-pointer"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('a')) return;
        router.push(href);
      }}
    >
      <TableCell className="max-w-[16rem]">
        {/* `block` porque `truncate` não corta um inline: sem ele o nome de uma
            obra comprida estouraria a largura da célula. */}
        <Link
          href={href}
          className="block truncate font-semibold text-foreground hover:text-primary hover:underline"
        >
          {obra.titulo}
        </Link>
        <p className="truncate text-xs text-muted-foreground">{obra.endereco}</p>
        {/* XG28 — o que as colunas escondem no celular reaparece aqui, para a
            informação não sumir junto com a coluna. Padrão de
            `app/admin/obras/page.tsx`. */}
        <p className="mt-1 text-xs text-muted-foreground sm:hidden">
          {obra.ocorrenciasAbertas > 0
            ? `${obra.ocorrenciasAbertas} ocorrência${obra.ocorrenciasAbertas > 1 ? 's' : ''} em aberto`
            : 'Sem ocorrências'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground lg:hidden">
          {obra.dataPrevisaoFim && obra.dataPrevisaoFim !== '—'
            ? `Entrega ${obra.dataPrevisaoFim}`
            : 'Sem prazo definido'}
        </p>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <span
          className={cn(
            'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
            OBRA_STATUS_DB_BADGE_CLASSES[obra.statusObra ?? 'em_andamento'],
          )}
        >
          {obraStatusDbLabel(obra.statusObra ?? 'em_andamento')}
        </span>
      </TableCell>

      <TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">
        {obra.dataPrevisaoFim || '—'}
      </TableCell>

      <TableCell className="whitespace-nowrap">
        <SinalObra estado={prazo}>{textoPrazo(obra.diasAtraso)}</SinalObra>
      </TableCell>

      <TableCell className="hidden whitespace-nowrap text-right tabular-nums xl:table-cell">
        {formatCurrencyRounded(obra.custoReal)}
      </TableCell>

      <TableCell className="whitespace-nowrap">
        <SinalObra estado={financeiro}>
          {textoOrcamento(obra.consumoOrcamento, true)}
        </SinalObra>
      </TableCell>

      {/* Zero vira traço, não "0": a ausência de problema não é um número a
          contar, e o traço deixa a coluna quieta quando está tudo bem. */}
      <TableCell className="hidden text-right tabular-nums sm:table-cell">
        {obra.ocorrenciasAbertas > 0 ? (
          <span className="font-semibold text-red-600 dark:text-red-400">
            {obra.ocorrenciasAbertas}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export function XGestaoDashboard() {
  const { data: obras, isLoading, isError } = useMinhasObras();
  const obrasProprias = useMemo(() => (obras ?? []).filter((obra) => obra.isObraPropria), [obras]);

  const resumo = useMemo(() => {
    const concluidas = obrasProprias.filter((obra) => obra.status === 'finalizada').length;
    const ativas = obrasProprias.length - concluidas;
    const orcamento = obrasProprias.reduce((total, obra) => total + obra.orcamento, 0);
    const custoReal = obrasProprias.reduce((total, obra) => total + obra.custoReal, 0);
    /**
     * XG27 — razão de somas, não média de percentuais.
     *
     * Média de percentuais daria a uma obra de R$ 5 mil o mesmo peso de uma de
     * R$ 500 mil, e o card responde "quanto da minha carteira já gastei?". Sem
     * orçamento lançado não há denominador: `null` vira o badge cinza, nunca
     * um verde que afirmaria folga que ninguém verificou.
     */
    const consumo = orcamento > 0 ? Math.round((custoReal / orcamento) * 100) : null;
    const atrasadas = obrasProprias.filter((obra) => obra.diasAtraso > 0).length;
    // XG17 — a contagem por status de saúde saiu junto com o `HealthSummary`.
    // XG27 — e o "Progresso médio" saiu daqui a pedido do cliente: lia
    // `obras.progresso`, coluna sem escritor desde a XG23, e mostrava 0% para
    // obra em pleno andamento.
    return { ativas, concluidas, orcamento, custoReal, consumo, atrasadas };
  }, [obrasProprias]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 md:p-10">
        <Skeleton className="h-20 w-full max-w-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-36 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <RiErrorWarningLine className="size-10 text-destructive" />
            <h1 className="text-xl font-bold">Não foi possível carregar o dashboard</h1>
            <p className="text-sm text-muted-foreground">Atualize a página para tentar novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (obrasProprias.length === 0) {
    return (
      <div className="space-y-8 p-6 md:p-10">
        <PageHeader
          title="Painel de Visão Geral"
          subtitle="Acompanhe os principais indicadores das suas próprias obras."
        />
        <Card className="luminous-section border-transparent shadow-none">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
              <RiBuilding2Line className="size-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Comece pela sua primeira obra</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Assim que uma obra própria for cadastrada, os indicadores de execução aparecerão aqui automaticamente.
            </p>
            <div className="mt-6"><NovaObraModal /></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-10" data-testid="xgestao-dashboard-page">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Painel de Visão Geral"
          subtitle="Acompanhe os principais indicadores das suas próprias obras."
        />
        <NovaObraModal />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* XG13 — `luminous` (em todos os quatro cards) já existia no `StatsCard`
            e só não era passado aqui: o painel do xgestão renderizava card liso
            enquanto o dashboard do empreiteiro tinha o acabamento completo. Prop
            opt-in, nenhum arquivo compartilhado alterado.
            XG27 — `badge` é a segunda prop nesse mesmo caso: já existia, nunca
            tinha sido usada aqui, e é o que evitou criar componente de semáforo. */}
        {/* XG27 — o outro sinal que o cliente pediu ("se está no prazo"), no card
            que já contava as obras em andamento. Sem atraso nenhum o badge some:
            um "0 atrasadas" verde seria ruído constante para dizer "tudo normal". */}
        <StatsCard
          luminous
          label="Obras ativas"
          value={resumo.ativas}
          icon={RiToolsLine}
          iconBgColor="bg-primary/10 text-primary"
          badge={
            resumo.atrasadas > 0
              ? {
                  label: `${resumo.atrasadas} atrasada${resumo.atrasadas > 1 ? 's' : ''}`,
                  variant: 'error' as const,
                }
              : undefined
          }
        />
        <StatsCard luminous label="Obras concluídas" value={resumo.concluidas} icon={RiCheckboxCircleLine} iconBgColor="bg-success/10 text-success" />
        {/* XG27 — no lugar do "Progresso médio": quanto do orçamento da carteira
            já virou custo, com a cor do estado. Reusa a prop `badge` que o
            `StatsCard` já aceita — nenhum componente novo. */}
        <StatsCard
          luminous
          label="Saúde financeira"
          value={formatCurrencyRounded(resumo.custoReal)}
          icon={RiWallet3Line}
          iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
          badge={{
            label: resumo.consumo === null ? 'orçamento não lançado' : `${resumo.consumo}% do orçamento`,
            variant: SEMAFORO_BADGE[semaforoFinanceiro(resumo.consumo)],
          }}
        />
        {/* XG28 — era "Orçamento gerenciado". É a soma do orçamento de todas as
            obras da carteira, e "gerenciado" sugeria uma distinção inexistente:
            o próprio cliente perguntou se era o valor de uma obra só. */}
        <StatsCard luminous label="Orçamento total" value={formatCurrencyRounded(resumo.orcamento)} icon={RiMoneyDollarCircleLine} iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20" />
      </div>

      {/* XG17 — o resumo de Saúde saiu do dashboard do xgestão junto com o card
          e a aba do console: mesma razão, mesma reversão. Ele linkava para
          `/xgestao/obras?saude=…`, filtro que também foi retirado da lista. O
          `HealthSummary` segue servindo o dashboard do marketplace. */}

      <Card className="luminous-section border-transparent shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Obras recentes</CardTitle>
          <Button asChild variant="ghost" size="sm"><Link href={XGESTAO_OBRAS}>Ver todas</Link></Button>
        </CardHeader>
        {/* XG28 — era uma lista de duas colunas (nome à esquerda, sinais à
            direita). Sem cabeçalho, cada sinal só significava algo para quem já
            sabia o que era, e não dava para comparar obras entre si — foi a
            queixa do cliente. Vira tabela de verdade, com as colunas nomeadas. */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Entrega</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="hidden text-right xl:table-cell">Gasto</TableHead>
                <TableHead>Orçamento</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Ocorrências</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obrasProprias.slice(0, 5).map((obra) => (
                <ObraRow key={obra.id} obra={obra} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}