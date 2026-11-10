'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RiCheckLine, RiErrorWarningLine, RiVipCrownLine } from 'react-icons/ri';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Textarea } from '@shared/components/ui/textarea';
import {
  MOTIVO_CANCELAMENTO_TEXTO_MAX,
  MOTIVOS_CANCELAMENTO,
  ROTULO_MOTIVO_CANCELAMENTO,
  type MotivoCancelamento,
} from '@features/xgestao/lib/motivo-cancelamento';
import { cn } from '@shared/lib/utils';
import { AvisoAmbienteTeste } from '@features/shared/components/AvisoAmbienteTeste';
import { useToast } from '@shared/hooks/use-toast';
import {
  useCancelarAssinatura,
  useCheckout,
  useConfirmarTroca,
  usePreviaTroca,
  type PreviaTroca,
  type TrocaError,
  usePerfilPlano,
  usePlanos,
  type CheckoutError,
  type PlanoApi,
} from '@features/planos/ui/use-planos';
import type { PlanoTier } from '@shared/lib/plans-catalog';

const ORDER: PlanoTier[] = ['basic', 'basic_plus', 'premium'];

function money(value: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function reais(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value);
}

function novaChave() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function alternar(lista: string[], id: string, marcado: boolean, limite: number) {
  if (!marcado) return lista.filter((item) => item !== id);
  if (lista.includes(id) || lista.length >= limite) return lista;
  return [...lista, id];
}

function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function PlanCard({
  plano,
  currentTier,
  onChoose,
  pending,
  canChoosePaid,
  emTeste,
  somenteLeitura,
  cancelamentoAgendado,
  modoTroca,
  tierAgendado,
  ciclo,
}: {
  plano: PlanoApi;
  currentTier: PlanoTier;
  onChoose: (plano: PlanoApi) => void;
  pending: boolean;
  canChoosePaid: boolean;
  /** XG35 — no teste grátis o plano testado continua assinável. */
  emTeste: boolean;
  somenteLeitura: boolean;
  /** XG43 — cancelada e ainda no período pago: pode assinar de novo, inclusive o mesmo plano. */
  cancelamentoAgendado: boolean;
  /** XG48 — assinatura paga: o botão muda de plano sem checkout. */
  modoTroca: boolean;
  /** XG48 — tier da descida agendada, se houver. */
  tierAgendado: string | null;
  /** XG50 — ciclo escolhido na chave (anual só quando ligado). */
  ciclo: 'mensal' | 'anual';
}) {
  const isCurrent = plano.tier === currentTier && !emTeste && !somenteLeitura && !cancelamentoAgendado;
  const isAgendado = modoTroca && plano.tier === tierAgendado;
  const isFeatured = plano.tier === 'basic_plus';
  const blockedByDocument = !canChoosePaid;

  return (
    <article
      className={[
        'relative flex min-w-0 flex-col rounded-2xl border p-5 shadow-sm',
        isFeatured ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border bg-card',
      ].join(' ')}
      data-testid={`xgestao-plano-${plano.tier}`}
    >
      {isFeatured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 hover:bg-amber-400">
          Mais escolhido
        </Badge>
      )}
      <div className="mb-5">
        <p className={isFeatured ? 'text-xs font-semibold text-primary-foreground/80' : 'text-xs font-semibold text-muted-foreground'}>
          xgestão
        </p>
        <h3 className="mt-1 text-xl font-bold">{plano.nome}</h3>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl font-extrabold" data-testid={`xgestao-preco-${plano.tier}`}>
            {money(ciclo === 'anual' && plano.valorAnual ? plano.valorAnual : plano.valorMensal)}
          </span>
          <span className={isFeatured ? 'text-xs text-primary-foreground/75' : 'text-xs text-muted-foreground'}>{ciclo === 'anual' ? '/ano' : '/mês'}</span>
        </div>
      </div>

      <ul className="mb-6 flex flex-1 flex-col gap-2.5">
        {plano.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <RiCheckLine className="mt-0.5 size-4 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant={isFeatured ? 'secondary' : 'outline'}
        className={isFeatured ? 'text-primary' : ''}
        disabled={isCurrent || isAgendado || pending || blockedByDocument}
        onClick={() => onChoose(plano)}
        data-testid={`xgestao-assinar-${plano.tier}`}
      >
        {isCurrent
          ? 'Plano atual'
          : isAgendado
            ? 'Mudança agendada'
            : pending
              ? 'Processando…'
              : blockedByDocument
                ? 'Informe o CPF ou CNPJ'
                : modoTroca
                  ? 'Mudar para este plano'
                  : 'Escolher plano'}
      </Button>
    </article>
  );
}

export function XGestaoPlanosSection() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: planos, isLoading: loadingPlanos, isError: planosError } = usePlanos('xgestao');
  const { data: perfil, isLoading: loadingPerfil, isError: perfilError } = usePerfilPlano('xgestao');
  const checkout = useCheckout('xgestao');
  const cancelar = useCancelarAssinatura('xgestao');
  const [activeRequest, setActiveRequest] = useState<string | null>(null);
  // XG50 — anual preparado e desligado: a chave só aparece quando o dono ligar
  // (`platform_settings.xgestao.anualAtivo`) e algum plano tiver preço anual.
  const [cicloEscolhido, setCicloEscolhido] = useState<'mensal' | 'anual'>('mensal');
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);
  // CRM-03 — motivo opcional do cancelamento.
  const [motivoCancelamento, setMotivoCancelamento] = useState<MotivoCancelamento | null>(null);
  const [motivoTexto, setMotivoTexto] = useState('');
  const currentTier = perfil?.plano ?? 'free';
  const emTeste = perfil?.teste?.emTeste === true;
  const cancelamentoAgendado = perfil?.cancelamentoAgendado === true;
  // XG43 — assinatura paga e vigente, ainda não cancelada: pode cancelar.
  // Regra de 10/11/2026: no mês bônus sem 1º pagamento o acesso não vai até a 1ª cobrança.
  const acessoSeCancelar = perfil?.acessoSeCancelar ?? perfil?.renovaEm ?? null;
  const bonusSemPagamento = Boolean(
    perfil?.acessoSeCancelar && perfil.renovaEm && perfil.acessoSeCancelar !== perfil.renovaEm,
  );
  const podeCancelar = Boolean(perfil && !emTeste && !perfil.somenteLeitura && !cancelamentoAgendado && !perfil.inadimplente && perfil.plano !== 'free');
  // XG48 — com assinatura paga vigente, trocar de plano não passa pelo checkout.
  const modoTroca = Boolean(perfil?.assinaturaPaga && !emTeste && !perfil?.somenteLeitura && !cancelamentoAgendado);
  const trocaAgendada = perfil?.trocaAgendada ?? null;
  // Troca de plano segue o ciclo da assinatura atual; a chave é só para assinar.
  const mostrarAnual = Boolean(perfil?.anualDisponivel && !modoTroca && planos?.some((p) => p.valorAnual && Number(p.valorAnual) > 0));
  const cicloCards: 'mensal' | 'anual' = modoTroca && perfil?.cobranca?.ciclo === 'anual'
    ? 'anual'
    : mostrarAnual ? cicloEscolhido : 'mensal';
  const cobranca = perfil?.cobranca ?? null;
  const previaTroca = usePreviaTroca();
  const confirmarTroca = useConfirmarTroca();
  const [troca, setTroca] = useState<{ previa: PreviaTroca; chave: string; planoId: string } | null>(null);
  const [obrasMantidas, setObrasMantidas] = useState<string[]>([]);
  const [membrosMantidos, setMembrosMantidos] = useState<string[]>([]);
  const [ciente, setCiente] = useState(false);

  function erroTroca(error: TrocaError) {
    if (error.code === 'SESSION_EXPIRED') {
      window.location.assign(`/login?perfil=xgestao&next=${encodeURIComponent('/xgestao/configuracoes?tab=plano')}&reason=session_expired`);
      return;
    }
    toast({ title: 'Não foi possível mudar de plano', description: error.message, variant: 'destructive' });
  }

  function abrirTroca(plano: PlanoApi) {
    setActiveRequest(plano.id);
    previaTroca.mutate({ planoId: plano.id }, {
      onSuccess: (previa) => {
        setObrasMantidas([]);
        setMembrosMantidos([]);
        setCiente(false);
        setTroca({ previa, chave: novaChave(), planoId: plano.id });
      },
      onError: erroTroca,
      onSettled: () => setActiveRequest(null),
    });
  }

  function confirmar() {
    if (!troca) return;
    const ex = troca.previa.excedentes;
    confirmarTroca.mutate({
      planoId: troca.planoId,
      chave: troca.chave,
      ...(ex?.obras.precisaEscolher ? { obras: obrasMantidas } : {}),
      ...(ex?.membros.precisaEscolher ? { membros: membrosMantidos } : {}),
      ...(ex ? { ciente } : {}),
    }, {
      onSuccess: (data) => {
        const previa = troca.previa;
        setTroca(null);
        toast({
          title: previa.tipo === 'desfazer' ? 'Mudança desfeita' : data.status === 'agendada' ? 'Mudança agendada' : 'Plano alterado',
          description: previa.tipo === 'desfazer'
            ? `Você continua no plano ${previa.planoAtual.nome}.`
            : data.status === 'agendada'
              ? `O plano ${previa.planoNovo.nome} começa em ${dataCurta(previa.efetivaEm)}.`
              : `O plano ${previa.planoNovo.nome} já está valendo.`,
        });
      },
      onError: erroTroca,
    });
  }

  function cicloDoCheckout(plano: PlanoApi): 'mensal' | 'anual' {
    return mostrarAnual && cicloEscolhido === 'anual' && plano.valorAnual && Number(plano.valorAnual) > 0 ? 'anual' : 'mensal';
  }

  function choosePlan(plano: PlanoApi) {
    if (checkout.isPending || (plano.tier === currentTier && !emTeste && !perfil?.somenteLeitura && !cancelamentoAgendado)) return;
    if (modoTroca) {
      if (!previaTroca.isPending && !confirmarTroca.isPending) abrirTroca(plano);
      return;
    }
    if (plano.tier !== 'free' && perfil?.hasCpfCnpj !== true) {
      toast({
        title: 'CPF ou CNPJ necessário',
        description: 'Informe o CPF ou CNPJ nos dados da empresa antes de assinar um plano pago.',
        variant: 'destructive',
      });
      router.push('/xgestao/configuracoes?tab=empresa');
      return;
    }

    setActiveRequest(plano.id);
    checkout.mutate(
      { planoId: plano.id, ciclo: cicloDoCheckout(plano) },
      {
        // XG16 — só anuncia ativação quando ela de fato ocorreu. Com o gateway
        // Asaas o retorno é `kind: 'redirect'`: o usuário é levado ao checkout
        // e ainda não pagou — a ativação só acontece no webhook. O toast antigo
        // era incondicional e dizia "está ativo" a caminho da tela de pagamento.
        // Mesmo guard já usado no marketplace (app/empreiteiro/planos/page.tsx).
        onSuccess: (data) => {
          if (data.kind !== 'activated') return;
          toast({
            title: 'Plano ativado',
            description: data.primeiraCobrancaEm
              ? `${plano.nome} está ativo para sua conta xgestão. A 1ª cobrança será em ${dataCurta(data.primeiraCobrancaEm)}.`
              : `${plano.nome} está ativo para sua conta xgestão.`,
          });
        },
        onError: (error: CheckoutError) => {
          if (error.code === 'SESSION_EXPIRED') {
            window.location.assign(
              `/login?perfil=xgestao&next=${encodeURIComponent('/xgestao/configuracoes?tab=plano')}&reason=session_expired`,
            );
            return;
          }
          if (error.code === 'PERFIL_INCOMPLETO') {
            toast({
              title: 'CPF ou CNPJ necessário',
              description: 'Informe o CPF ou CNPJ nos dados da empresa em Configurações antes de assinar.',
              variant: 'destructive',
            });
            router.push('/xgestao/configuracoes?tab=empresa');
            return;
          }
          toast({
            title: 'Não foi possível iniciar o pagamento',
            description: error.message || 'Tente novamente em instantes.',
            variant: 'destructive',
          });
        },
        onSettled: () => setActiveRequest(null),
      },
    );
  }

  if (loadingPlanos || loadingPerfil) {
    return (
      <Card data-testid="xgestao-planos-loading">
        <CardHeader><Skeleton className="h-7 w-44" /></CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-3">
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-80 rounded-2xl" />)}
        </CardContent>
      </Card>
    );
  }

  if (planosError || perfilError || !perfil) {
    return (
      <Card data-testid="xgestao-planos-error">
        <CardHeader><CardTitle>Plano e uso</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Não foi possível carregar os planos agora. Tente novamente em instantes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="xgestao-planos-section">
      {/* A faixa já existia nas telas de pagamento do marketplace e faltava
          justamente aqui, onde o empreiteiro xgestão troca de plano. */}
      <AvisoAmbienteTeste detalhe="Seu plano é ativado normalmente para você testar os recursos." />
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-primary/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Plano e uso</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Acompanhe seus limites e escolha o plano ideal para sua operação.</p>
              {emTeste && perfil.teste?.fimTeste && (
                <p className="mt-1 text-sm font-medium" data-testid="xgestao-plano-fim-teste">
                  Teste grátis até {dataCurta(perfil.teste.fimTeste)}. Sem contratação, 24 horas depois a conta fica somente para leitura, com os dados preservados.
                </p>
              )}
              {perfil.teste?.testeNegadoPorDocumento && (
                <p className="mt-1 text-sm font-medium" data-testid="xgestao-plano-teste-negado">
                  Esse documento já usou o período de teste. Você pode assinar quando quiser.
                </p>
              )}
              {emTeste && perfil.teste?.primeiraCobrancaComBonus && (
                <p className="mt-1 text-sm font-semibold text-primary" data-testid="xgestao-plano-bonus">
                  Assinando durante o teste você ganha +1 mês grátis: a 1ª cobrança será só em {dataCurta(perfil.teste.primeiraCobrancaComBonus)}.
                </p>
              )}
              {cobranca && !cancelamentoAgendado && !emTeste && (
                <p className="mt-1 text-sm font-medium" data-testid="xgestao-plano-cobranca">
                  {perfil.inadimplente
                    ? <>Pagamento em atraso. Regularize para não perder a edição.</>
                    : cobranca.proximaEm
                      ? <>
                        {cobranca.primeiraCobranca ? '1ª cobrança' : 'Próxima cobrança'} em {dataCurta(cobranca.proximaEm)}:{' '}
                        {reais(cobranca.valor + cobranca.diferencaPendente)}
                        {cobranca.diferencaPendente > 0 ? ` (inclui ${reais(cobranca.diferencaPendente)} da mudança de plano)` : ''}.
                        {' '}Depois, {reais(cobranca.valor)} por {cobranca.ciclo === 'anual' ? 'ano' : 'mês'}.
                      </>
                      : null}
                </p>
              )}
              {cancelamentoAgendado && perfil.renovaEm && (
                <p className="mt-1 text-sm font-medium" data-testid="xgestao-plano-cancelamento-agendado">
                  Assinatura cancelada. Nenhuma nova cobrança será feita, e o acesso completo continua até {dataCurta(perfil.renovaEm)}. Depois, a conta fica somente para leitura, com os dados preservados.
                </p>
              )}
            </div>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <RiVipCrownLine className="size-4" />
              {perfil.catalogo.nome}{emTeste ? ' (teste grátis)' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {perfil.uso.map((item) => (
              <div key={item.key} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-xl font-bold">
                  {item.current}{' '}
                  <span className="text-sm font-normal text-muted-foreground">de {item.max < 0 ? 'ilimitado' : item.max}</span>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!perfil.hasCpfCnpj && (
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <RiErrorWarningLine className="mt-0.5 size-5 shrink-0" />
          <p>
            Informe o CPF ou CNPJ em{' '}
            <Link href="/xgestao/configuracoes?tab=empresa" className="font-semibold underline underline-offset-2">
              Minha Empresa
            </Link>{' '}
            para assinar um plano pago.
          </p>
        </div>
      )}

      {trocaAgendada && (
        <section
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
          data-testid="xgestao-troca-agendada"
        >
          <p>
            Mudança agendada: em {dataCurta(trocaAgendada.efetivaEm)} seu plano passa a ser {trocaAgendada.nomePara}{' '}
            ({reais(trocaAgendada.valorPara)} por mês). Até lá, tudo continua como está no plano {perfil.catalogo.nome}.
          </p>
          <Button
            variant="outline"
            disabled={previaTroca.isPending || confirmarTroca.isPending}
            onClick={() => {
              const atual = planos?.find((item) => item.tier === currentTier);
              if (atual) abrirTroca(atual);
            }}
            data-testid="button-desfazer-troca"
          >
            Desfazer mudança
          </Button>
        </section>
      )}

      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold">Compare os planos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Você pode alterar seu plano a qualquer momento.</p>
          {mostrarAnual && (
            <div className="mt-3 inline-flex rounded-lg border p-1 text-sm" role="group" aria-label="Ciclo de cobrança" data-testid="xgestao-ciclo">
              {(['mensal', 'anual'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={cicloEscolhido === c}
                  className={cn('rounded-md px-3 py-1 font-medium', cicloEscolhido === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                  onClick={() => setCicloEscolhido(c)}
                  data-testid={`xgestao-ciclo-${c}`}
                >
                  {c === 'mensal' ? 'Mensal' : 'Anual'}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {ORDER.map((tier) => {
            const plano = planos?.find((item) => item.tier === tier);
            return plano ? (
              <PlanCard
                key={plano.id}
                plano={plano}
                currentTier={currentTier}
                onChoose={choosePlan}
                pending={(checkout.isPending || previaTroca.isPending) && activeRequest === plano.id}
                canChoosePaid={perfil.hasCpfCnpj}
                emTeste={emTeste}
                somenteLeitura={perfil.somenteLeitura === true}
                cancelamentoAgendado={cancelamentoAgendado}
                modoTroca={modoTroca}
                tierAgendado={trocaAgendada?.tierPara ?? null}
                ciclo={cicloCards}
              />
            ) : null;
          })}
        </div>
      </section>

      {podeCancelar && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm" data-testid="xgestao-cancelar-assinatura">
          <p className="text-muted-foreground">
            {bonusSemPagamento
              ? `Ao cancelar antes do 1º pagamento, o mês grátis do teste deixa de valer: você continua usando o plano até ${dataCurta(acessoSeCancelar!)}.`
              : <>Ao cancelar, as próximas cobranças param e você continua usando o plano até o fim do período já pago
                {acessoSeCancelar ? ` (${dataCurta(acessoSeCancelar)})` : ''}.</>}
          </p>
          <Button variant="outline" onClick={() => setConfirmarCancelamento(true)} data-testid="button-cancelar-assinatura">
            Cancelar assinatura
          </Button>
        </section>
      )}

      <DialogoTroca
        troca={troca?.previa ?? null}
        onClose={() => { if (!confirmarTroca.isPending) setTroca(null); }}
        obrasMantidas={obrasMantidas}
        setObrasMantidas={setObrasMantidas}
        membrosMantidos={membrosMantidos}
        setMembrosMantidos={setMembrosMantidos}
        ciente={ciente}
        setCiente={setCiente}
        pendente={confirmarTroca.isPending}
        onConfirmar={confirmar}
        nomeAgendado={trocaAgendada?.nomePara ?? null}
      />

      <AlertDialog open={confirmarCancelamento} onOpenChange={setConfirmarCancelamento}>
        <AlertDialogContent data-testid="dialog-cancelar-assinatura">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar a assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              {bonusSemPagamento
                ? 'O mês grátis de quem assina no teste só vale com o 1º pagamento, uma vez por conta. Cancelando agora, nenhuma cobrança será feita e o mês grátis deixa de valer.'
                : 'Nenhuma nova cobrança será feita.'}{' '}
              Você continua com acesso completo
              {acessoSeCancelar ? ` até ${dataCurta(acessoSeCancelar)}` : ' até o fim do período pago'}; depois, a conta fica
              somente para leitura e nada é apagado. Você pode assinar de novo quando quiser
              {bonusSemPagamento ? ', sem um novo mês grátis' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* CRM-03 — opcional: ajuda a entender por que as pessoas saem. */}
          <div className="space-y-2" data-testid="cancelar-motivo">
            <p className="text-sm font-medium">Quer contar o motivo? (opcional)</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Motivo do cancelamento">
              {MOTIVOS_CANCELAMENTO.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={motivoCancelamento === m}
                  disabled={cancelar.isPending}
                  onClick={() => setMotivoCancelamento(motivoCancelamento === m ? null : m)}
                  data-testid={`cancelar-motivo-${m}`}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                    motivoCancelamento === m
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary dark:border-gray-700 dark:text-gray-300',
                  )}
                >
                  {ROTULO_MOTIVO_CANCELAMENTO[m]}
                </button>
              ))}
            </div>
            <Textarea
              value={motivoTexto}
              onChange={(e) => setMotivoTexto(e.target.value.slice(0, MOTIVO_CANCELAMENTO_TEXTO_MAX))}
              maxLength={MOTIVO_CANCELAMENTO_TEXTO_MAX}
              placeholder="Se quiser, conte um pouco mais"
              aria-label="Comentário sobre o cancelamento"
              disabled={cancelar.isPending}
              rows={3}
              data-testid="cancelar-motivo-texto"
            />
            <p className="text-right text-xs text-muted-foreground">{motivoTexto.length}/{MOTIVO_CANCELAMENTO_TEXTO_MAX}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelar.isPending}>Manter assinatura</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelar.isPending}
              data-testid="button-confirmar-cancelamento"
              onClick={(event) => {
                event.preventDefault();
                cancelar.mutate({ motivo: motivoCancelamento, motivoTexto: motivoTexto.trim() || null }, {
                  onSuccess: (data) => {
                    setConfirmarCancelamento(false);
                    toast({
                      title: 'Assinatura cancelada',
                      description: data.acessoAte
                        ? `Seu acesso completo continua até ${dataCurta(data.acessoAte)}.`
                        : 'Sua assinatura foi cancelada.',
                    });
                  },
                  onError: () => {
                    toast({ title: 'Não foi possível cancelar agora', description: 'Tente novamente em instantes.', variant: 'destructive' });
                  },
                });
              }}
            >
              {cancelar.isPending ? 'Cancelando…' : 'Cancelar assinatura'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
/** XG48 — diálogo único da troca: resumo da subida, ou aviso e escolha da descida. */
function DialogoTroca({
  troca,
  onClose,
  obrasMantidas,
  setObrasMantidas,
  membrosMantidos,
  setMembrosMantidos,
  ciente,
  setCiente,
  pendente,
  onConfirmar,
  nomeAgendado,
}: {
  troca: PreviaTroca | null;
  onClose: () => void;
  obrasMantidas: string[];
  setObrasMantidas: (lista: string[]) => void;
  membrosMantidos: string[];
  setMembrosMantidos: (lista: string[]) => void;
  ciente: boolean;
  setCiente: (valor: boolean) => void;
  pendente: boolean;
  onConfirmar: () => void;
  nomeAgendado: string | null;
}) {
  const ex = troca?.excedentes ?? null;
  const descendo = troca?.tipo === 'descer';
  const dataEfetiva = troca ? (troca.acao === 'descer_imediata' ? 'hoje' : dataCurta(troca.efetivaEm)) : '';
  const precisaCiencia = Boolean(ex && (ex.obras.precisaEscolher || ex.membros.precisaEscolher || ex.links.pausados > 0 || ex.perdeValoresPublicos));
  const escolhaCompleta = !ex || (
    (!ex.obras.precisaEscolher || obrasMantidas.length === ex.obras.limite)
    && (!ex.membros.precisaEscolher || membrosMantidos.length === ex.membros.limite)
  );
  const podeConfirmar = Boolean(troca) && !pendente && escolhaCompleta && (!precisaCiencia || ciente);
  const extra = troca ? Math.max(0, Math.round((troca.valorProximaFatura - troca.valorDepois) * 100) / 100) : 0;

  return (
    <AlertDialog open={troca !== null} onOpenChange={(aberto) => { if (!aberto) onClose(); }}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto" data-testid="dialog-troca-plano">
        {troca && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {troca.tipo === 'desfazer' ? `Manter o plano ${troca.planoAtual.nome}?` : `Mudar para o plano ${troca.planoNovo.nome}?`}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground" data-testid="troca-resumo">
                  {troca.tipo === 'desfazer' && (
                    <p>
                      A mudança para {nomeAgendado ?? 'o plano menor'} é desfeita, sem cobrança. Tudo continua como está, e a
                      próxima fatura{troca.proximaFaturaEm ? `, em ${dataCurta(troca.proximaFaturaEm)},` : ''} volta a ser de{' '}
                      {reais(troca.valorProximaFatura)}.
                    </p>
                  )}
                  {troca.tipo === 'subir' && (troca.acao === 'subir_sem_proporcional' ? (
                    <p>
                      Hoje: passa a ser {troca.planoNovo.nome}. A 1ª cobrança
                      {troca.proximaFaturaEm ? `, em ${dataCurta(troca.proximaFaturaEm)},` : ''} será de {reais(troca.valorProximaFatura)}.
                      Depois: {reais(troca.valorDepois)} por mês.
                    </p>
                  ) : (
                    <>
                      <p>
                        Hoje: passa a ser {troca.planoNovo.nome}. Próxima fatura
                        {troca.proximaFaturaEm ? ` em ${dataCurta(troca.proximaFaturaEm)}` : ''}: {reais(troca.valorDepois)} +{' '}
                        {reais(extra)} referente a {troca.diasRestantes} {troca.diasRestantes === 1 ? 'dia' : 'dias'} ={' '}
                        {reais(troca.valorProximaFatura)}. Depois: {reais(troca.valorDepois)} por mês.
                      </p>
                      <p>Nada é cobrado agora e o cartão continua o mesmo.</p>
                      {troca.acao === 'desfazer_e_subir' && nomeAgendado && (
                        <p>A mudança para {nomeAgendado} que estava agendada é desfeita.</p>
                      )}
                    </>
                  ))}
                  {descendo && (
                    <p>
                      {troca.acao === 'descer_imediata'
                        ? `O plano ${troca.planoNovo.nome} começa hoje.`
                        : `O plano ${troca.planoAtual.nome} continua valendo até ${dataEfetiva}.`}{' '}
                      A próxima fatura{troca.proximaFaturaEm ? `, em ${dataCurta(troca.proximaFaturaEm)},` : ''} já vem com{' '}
                      {reais(troca.valorProximaFatura)}. Nada é excluído.
                    </p>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            {descendo && ex && (
              <div className="space-y-4 text-sm">
                {ex.obras.precisaEscolher && (
                  <fieldset className="space-y-2" data-testid="troca-escolha-obras">
                    <legend className="font-medium">
                      Você tem {ex.obras.emAndamento.length} obras em andamento e o {troca.planoNovo.nome} permite editar{' '}
                      {ex.obras.limite}. As outras ficarão só para visualização a partir de {dataEfetiva}.
                    </legend>
                    <p className="text-xs text-muted-foreground">
                      Escolha {ex.obras.limite === 1 ? 'a obra que continua editável' : `as ${ex.obras.limite} obras que continuam editáveis`} ({obrasMantidas.length} de {ex.obras.limite}).
                    </p>
                    {ex.obras.emAndamento.map((obra) => (
                      <label key={obra.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={obrasMantidas.includes(obra.id)}
                          disabled={!obrasMantidas.includes(obra.id) && obrasMantidas.length >= ex.obras.limite}
                          onCheckedChange={(v) => setObrasMantidas(alternar(obrasMantidas, obra.id, v === true, ex.obras.limite))}
                          data-testid={`troca-obra-${obra.id}`}
                        />
                        <span>{obra.nome}</span>
                      </label>
                    ))}
                  </fieldset>
                )}
                {ex.membros.precisaEscolher && (
                  <fieldset className="space-y-2" data-testid="troca-escolha-membros">
                    <legend className="font-medium">
                      Sua equipe tem {ex.membros.lista.length} {ex.membros.lista.length === 1 ? 'pessoa' : 'pessoas'} além de você e o{' '}
                      {troca.planoNovo.nome} permite {ex.membros.limite}. As outras ficarão sem acesso (pausadas) a partir de {dataEfetiva}.
                    </legend>
                    <p className="text-xs text-muted-foreground">
                      Escolha quem continua com acesso ({membrosMantidos.length} de {ex.membros.limite}).
                    </p>
                    {ex.membros.lista.map((membro) => (
                      <label key={membro.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={membrosMantidos.includes(membro.id)}
                          disabled={!membrosMantidos.includes(membro.id) && membrosMantidos.length >= ex.membros.limite}
                          onCheckedChange={(v) => setMembrosMantidos(alternar(membrosMantidos, membro.id, v === true, ex.membros.limite))}
                          data-testid={`troca-membro-${membro.id}`}
                        />
                        <span>{membro.nome ?? membro.email}{membro.status === 'convidado' ? ' (convite pendente)' : ''}</span>
                      </label>
                    ))}
                  </fieldset>
                )}
                {ex.links.pausados > 0 && (
                  <p>
                    {ex.links.pausados === 1 ? '1 link do cliente passa' : `${ex.links.pausados} links do cliente passam`} do limite de{' '}
                    {ex.links.limitePorObra} por obra e {ex.links.pausados === 1 ? 'ficará pausado' : 'ficarão pausados'} a partir de {dataEfetiva}.
                    Os mais antigos de cada obra continuam ativos.
                  </p>
                )}
                {ex.perdeValoresPublicos && (
                  <p>Os valores deixam de aparecer nos links do cliente a partir de {dataEfetiva}.</p>
                )}
                {precisaCiencia && (
                  <label className="flex items-start gap-2 font-medium">
                    <Checkbox checked={ciente} onCheckedChange={(v) => setCiente(v === true)} data-testid="troca-ciente" />
                    <span>Entendi que as demais ficarão só para visualização e que essa escolha não poderá ser alterada</span>
                  </label>
                )}
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={pendente}>Voltar</AlertDialogCancel>
              <AlertDialogAction
                disabled={!podeConfirmar}
                data-testid="button-confirmar-troca"
                onClick={(event) => {
                  event.preventDefault();
                  onConfirmar();
                }}
              >
                {pendente ? 'Processando…' : troca.tipo === 'desfazer' ? 'Desfazer mudança' : `Mudar para ${troca.planoNovo.nome}`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
