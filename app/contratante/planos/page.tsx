'use client';

import { useMemo, useState } from 'react';
import { cn } from '@shared/lib/utils';
import {
  RiCheckLine,
  RiCloseLine,
  RiSeedlingLine,
  RiRocketLine,
  RiBuilding4Line,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiStarFill,
  RiVipCrownLine,
  RiCalendarLine,
  RiArrowRightLine,
} from 'react-icons/ri';
import { usePlanos, usePerfilPlano, useCheckout, useCancelarAssinatura, type PlanoApi } from '@features/planos/ui/use-planos';
import { PLANS_CATALOG, type PlanoTier } from '@shared/lib/plans-catalog';
import { useToast } from '@shared/hooks/use-toast';
import { AvisoAmbienteTeste } from '@features/shared/components/AvisoAmbienteTeste';
import { useRouter } from 'next/navigation';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@shared/components/ui/alert-dialog';

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
type PlanId = 'starter' | 'empresarial' | 'enterprise';

/** Mapeia o slot visual desta página para o tier real do catálogo. */
const SLOT_TIER: Record<PlanId, PlanoTier> = {
  starter: 'free',
  empresarial: 'pro',
  enterprise: 'enterprise',
};

const SLOT_LABEL: Record<PlanId, string> = {
  starter: 'Starter',
  empresarial: 'Empresarial',
  enterprise: 'Enterprise',
};

const TIER_ORDER: Record<PlanId, number> = {
  starter: 0,
  empresarial: 1,
  enterprise: 2,
};

interface Feature {
  label: string;
  starter: string | boolean;
  empresarial: string | boolean;
  enterprise: string | boolean;
}

/**
 * Limites numéricos derivados de PLANS_CATALOG — a MESMA fonte que
 * `getLimitesUsuario` usa para barrar o usuário (J40 P1 #8). Antes eram
 * literais na página, e divergiam do enforcement: a tabela prometia "2 obras"
 * no free enquanto o gate aplicava 1. `/configuracoes` já mostrava o número
 * certo, então o mesmo usuário via dois contratos diferentes.
 */
function limiteLabel(slot: PlanId, chave: string): string {
  const valor = PLANS_CATALOG.contratante[SLOT_TIER[slot]].limites[chave];
  if (valor === undefined) return '—';
  return valor >= 9999 ? 'Ilimitado' : String(valor);
}

const FEATURES: Feature[] = [
  {
    label: 'Obras publicadas simultâneas',
    starter: limiteLabel('starter', 'obrasAbertas'),
    empresarial: limiteLabel('empresarial', 'obrasAbertas'),
    enterprise: limiteLabel('enterprise', 'obrasAbertas'),
  },
  {
    label: 'Propostas recebidas por obra',
    starter: limiteLabel('starter', 'propostasRecebidas'),
    empresarial: limiteLabel('empresarial', 'propostasRecebidas'),
    enterprise: limiteLabel('enterprise', 'propostasRecebidas'),
  },
  {
    label: 'Empreiteiros contratados',
    starter: limiteLabel('starter', 'empreiteirosContratados'),
    empresarial: limiteLabel('empresarial', 'empreiteirosContratados'),
    enterprise: limiteLabel('enterprise', 'empreiteirosContratados'),
  },
  {
    label: 'Contratos ativos',
    starter: limiteLabel('starter', 'contratosAtivos'),
    empresarial: limiteLabel('empresarial', 'contratosAtivos'),
    enterprise: limiteLabel('enterprise', 'contratosAtivos'),
  },
  { label: 'Acesso ao diretório de empreiteiros', starter: 'Básico',    empresarial: 'Completo',  enterprise: 'Premium' },
  { label: 'Contratos digitais',                  starter: false,       empresarial: true,        enterprise: true },
  { label: 'Gestão de medições',                  starter: false,       empresarial: true,        enterprise: true },
  { label: 'Relatórios de obra',                  starter: false,       empresarial: true,        enterprise: 'Avançado' },
  { label: 'Análises com IA',                     starter: false,       empresarial: true,        enterprise: 'Avançado' },
  { label: 'Suporte',                             starter: 'E-mail',    empresarial: 'Prioritário', enterprise: 'Dedicado' },
  { label: 'Exportação de relatórios',            starter: false,       empresarial: true,        enterprise: true },
  { label: 'Integrações / API',                   starter: false,       empresarial: false,       enterprise: true },
];

const FAQ_ITEMS = [
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Você pode cancelar sua assinatura a qualquer momento, sem multas ou burocracia. Seu acesso continua ativo até o fim do período pago.',
  },
  {
    q: 'O que acontece com minhas obras se eu fizer downgrade?',
    a: 'Suas obras em andamento são preservadas. Se o número de obras publicadas exceder o limite do novo plano, você poderá gerenciar as existentes mas não poderá publicar novas até ajustar o número.',
  },
  {
    q: 'Há suporte na migração de plano?',
    a: 'Sim. Nossa equipe de sucesso está disponível para auxiliar em qualquer mudança de plano, tirar dúvidas e garantir que a transição seja tranquila.',
  },
];

/* ─────────────────────────────────────────────
   Feature Row value renderer
───────────────────────────────────────────── */
function FeatureValue({
  value,
  highlight = false,
}: {
  value: string | boolean;
  highlight?: boolean;
}) {
  if (typeof value === 'boolean') {
    return value ? (
      <RiCheckLine className={cn('w-5 h-5 mx-auto', highlight ? 'text-white/90' : 'text-primary')} />
    ) : (
      <RiCloseLine className="w-5 h-5 mx-auto text-gray-300 dark:text-gray-600" />
    );
  }
  return (
    <span className={cn('text-sm font-medium', highlight ? 'text-white/90' : 'text-gray-700 dark:text-gray-300')}>
      {value}
    </span>
  );
}

/* ─────────────────────────────────────────────
   FAQ Item
───────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{q}</span>
        {open ? (
          <RiArrowUpSLine className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <RiArrowDownSLine className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 bg-white dark:bg-gray-900 border-t border-gray-50 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Minha Assinatura Panel
───────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ativa: { label: 'Ativa', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  inadimplente: { label: 'Inadimplente', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  cancelada: { label: 'Cancelada', className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  pendente_reativacao: { label: 'Pendente', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

function MinhaAssinaturaPainel() {
  const { data: perfilPlano, isLoading } = usePerfilPlano();
  const cancelar = useCancelarAssinatura();
  const { toast } = useToast();
  const router = useRouter();

  if (isLoading || !perfilPlano) return null;
  if (perfilPlano.plano === 'free') return null;

  const tierLabel =
    perfilPlano.plano === 'pro' ? 'Empresarial' : perfilPlano.plano === 'enterprise' ? 'Enterprise' : perfilPlano.plano;

  const status = perfilPlano.assinaturaStatus ?? 'ativa';
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ativa;

  const renovaLabel = perfilPlano.renovaEm
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(perfilPlano.renovaEm))
    : null;

  function handleCancelar() {
    cancelar.mutate(undefined, {
      onSuccess: () => {
        toast({ title: 'Assinatura cancelada', description: 'Você voltou para o plano gratuito.' });
        router.refresh();
      },
      onError: () => {
        toast({ title: 'Erro', description: 'Não foi possível cancelar agora. Tente novamente.', variant: 'destructive' });
      },
    });
  }

  return (
    <div className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-testid="painel-minha-assinatura">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <RiVipCrownLine className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Minha Assinatura</p>
            <Badge className="bg-primary/10 text-primary border-0 text-xs" data-testid="badge-assinatura-tier">{tierLabel}</Badge>
            <Badge className={`border-0 text-xs ${statusCfg.className}`} data-testid="badge-status-assinatura">{statusCfg.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {perfilPlano.catalogo.precoMensal > 0
              ? `R$ ${perfilPlano.catalogo.precoMensal}/mês`
              : 'Gratuito'}
          </p>
          {renovaLabel && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <RiCalendarLine className="w-3.5 h-3.5" />
              {status === 'cancelada' ? 'Acesso até' : 'Próxima renovação:'} {renovaLabel}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:hover:bg-red-900/20"
              disabled={cancelar.isPending || status === 'cancelada'}
              data-testid="button-cancelar-assinatura-planos"
            >
              {cancelar.isPending ? 'Cancelando…' : 'Cancelar assinatura'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
              <AlertDialogDescription>
                Você voltará para o plano gratuito imediatamente. Obras em andamento são preservadas, mas os limites do plano gratuito passam a valer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelar}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-confirmar-cancelar"
              >
                Cancelar assinatura
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function ContratantePlanosPage() {
  const [anual, setAnual] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<PlanId | null>(null);
  const { data: planos } = usePlanos();
  const { data: perfilPlano } = usePerfilPlano();
  const checkout = useCheckout();
  const { toast } = useToast();

  const PLANO_ATUAL: PlanId =
    perfilPlano?.plano === 'pro' ? 'empresarial' : perfilPlano?.plano === 'enterprise' ? 'enterprise' : 'starter';

  const temAssinaturaPaga = PLANO_ATUAL !== 'starter';

  function planoDeSlot(slot: PlanId): PlanoApi | undefined {
    return planos?.find((p) => p.tier === SLOT_TIER[slot]);
  }

  /** Preço /mês exibido (anual mostra o valor mensal equivalente do plano anual). */
  function precoMensal(slot: PlanId): number | null {
    const p = planoDeSlot(slot);
    if (!p) return null;
    const v = anual ? p.valorAnual : p.valorMensal;
    const n = v == null ? null : Number(v);
    return n && n > 0 ? Math.round(n) : null;
  }

  /**
   * Maior desconto anual real entre os planos, em % inteiro — ou `null` quando
   * nenhum plano tem `valor_anual` cadastrado.
   *
   * O selo antes dizia "Economize 20%" fixo, enquanto `valor_anual` nunca é
   * populado pelo seed: o usuário via a promessa de 20% e, logo abaixo,
   * "R$ —" no lugar do preço. Agora o selo só aparece quando existe desconto
   * de verdade, e mostra o número que de fato vale.
   */
  const descontoAnualPercent = useMemo(() => {
    if (!planos) return null;
    let melhor = 0;
    for (const p of planos) {
      const mensal = Number(p.valorMensal ?? 0);
      const anualEquivalente = p.valorAnual == null ? null : Number(p.valorAnual);
      if (!mensal || !anualEquivalente || anualEquivalente <= 0) continue;
      const desconto = Math.round((1 - anualEquivalente / mensal) * 100);
      if (desconto > melhor) melhor = desconto;
    }
    return melhor > 0 ? melhor : null;
  }, [planos]);

  function executarAssinar(slot: PlanId) {
    const p = planoDeSlot(slot);
    if (!p || checkout.isPending) return;
    checkout.mutate(
      { planoId: p.id, ciclo: anual ? 'anual' : 'mensal' },
      {
        onSuccess: (data) => {
          if (data.kind === 'activated') {
            toast({ title: 'Plano ativado!', description: `Bem-vindo ao plano ${p.nome}.` });
          }
        },
        onError: (err) => {
          if (err.code === 'JA_ASSINANTE') return;
          if (err.code === 'PERFIL_INCOMPLETO') {
            toast({
              title: 'Cadastro incompleto',
              description: 'Informe seu CPF/CNPJ em Configurações antes de assinar.',
              variant: 'destructive',
            });
            return;
          }
          if (err.code === 'LIMITE_PLANO') {
            toast({
              title: 'Limite do plano atingido',
              description: 'Você atingiu o limite do seu plano atual. Faça upgrade para continuar.',
              variant: 'destructive',
            });
            return;
          }
          toast({
            title: 'Não foi possível iniciar o pagamento',
            description: 'Tente novamente em instantes ou entre em contato com o suporte.',
            variant: 'destructive',
          });
        },
      },
    );
  }

  function assinar(slot: PlanId) {
    // Mostrar dialog para QUALQUER troca de plano quando há assinatura ativa
    if (temAssinaturaPaga && slot !== PLANO_ATUAL) {
      setPendingSlot(slot);
      return;
    }
    executarAssinar(slot);
  }

  function confirmarTroca() {
    if (!pendingSlot) return;
    executarAssinar(pendingSlot);
    setPendingSlot(null);
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-background-dark">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <RiStarFill className="w-3.5 h-3.5" />
            Planos & Preços
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight mb-4">
            Escolha o plano ideal<br className="hidden sm:block" /> para sua construtora
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Publique obras, gerencie contratos e encontre os melhores empreiteiros da sua região.
          </p>
        </div>

        <AvisoAmbienteTeste className="mb-8" detalhe="Seu plano é ativado normalmente para você testar os recursos." />

        {/* ── Minha Assinatura ── */}
        <MinhaAssinaturaPainel />

        {/* ── Toggle Mensal / Anual ──
            Só faz sentido com preço anual cadastrado (`planos.valor_anual`).
            Sem ele, alternar para "Anual" trocava todos os preços por "R$ —"
            e ainda assim mandava `ciclo: 'anual'` no checkout. */}
        {descontoAnualPercent != null && (
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={cn('text-sm font-medium transition-colors', !anual ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400')}>
            Mensal
          </span>
          <button
            onClick={() => setAnual((v) => !v)}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none',
              anual ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
            )}
            aria-label="Alternar cobrança anual"
            data-testid="toggle-ciclo-anual"
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                anual ? 'translate-x-6' : 'translate-x-0'
              )}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium transition-colors', anual ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400')}>
              Anual
            </span>
            {anual && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wide">
                Economize {descontoAnualPercent}%
              </span>
            )}
          </div>
        </div>
        )}

        {/* ── Plan Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-center mb-16">

          {/* Starter */}
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 lg:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <RiSeedlingLine className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Starter</p>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Para começar</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">Grátis</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Sem necessidade de cartão de crédito</p>
            </div>

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FEATURES.map((feat) => (
                <li key={feat.label} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="shrink-0 w-5">
                    {typeof feat.starter === 'boolean' ? (
                      feat.starter
                        ? <RiCheckLine className="w-4 h-4 text-primary" />
                        : <RiCloseLine className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    ) : (
                      <RiCheckLine className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <span>
                    {typeof feat.starter === 'string' ? (
                      <><span className="font-semibold text-gray-800 dark:text-gray-200">{feat.starter}</span> {feat.label.toLowerCase()}</>
                    ) : feat.starter ? feat.label : (
                      <span className="line-through text-gray-300 dark:text-gray-600">{feat.label}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {PLANO_ATUAL === 'starter' ? (
              <button disabled className="w-full py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-400 cursor-not-allowed" data-testid="button-plano-atual-starter">
                Plano atual
              </button>
            ) : (
              <button
                onClick={() => assinar('starter')}
                disabled={checkout.isPending || !planoDeSlot('starter')}
                className="w-full py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="button-assinar-starter"
              >
                {checkout.isPending ? 'Processando…' : 'Começar grátis'}
              </button>
            )}
          </div>

          {/* Empresarial — destacado */}
          <div className="relative bg-primary rounded-3xl shadow-2xl p-6 lg:p-8 flex flex-col xl:scale-[1.04] xl:z-10">
            {/* Badge Mais Popular */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1.5 rounded-full bg-amber-400 text-amber-900 text-[11px] font-extrabold uppercase tracking-wider shadow-lg">
                ⭐ Mais Popular
              </span>
            </div>

            {/* Plano atual badge */}
            {PLANO_ATUAL === 'empresarial' && (
              <div className="absolute top-6 right-6">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wide">
                  Seu plano
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <RiRocketLine className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Empresarial</p>
                <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Mais completo</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-extrabold text-white">
                  R$ {precoMensal('empresarial') ?? '—'}
                </span>
                <span className="text-white/70 text-sm mb-2">/mês</span>
              </div>
              {anual && precoMensal('empresarial') != null && (
                <p className="text-xs text-white/60 mt-1">Cobrado anualmente (R$ {(precoMensal('empresarial')! * 12).toLocaleString('pt-BR')}/ano)</p>
              )}
            </div>

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FEATURES.map((feat) => (
                <li key={feat.label} className="flex items-center gap-3 text-sm text-white/90">
                  <div className="shrink-0 w-5">
                    {typeof feat.empresarial === 'boolean' ? (
                      feat.empresarial
                        ? <RiCheckLine className="w-4 h-4 text-white" />
                        : <RiCloseLine className="w-4 h-4 text-white/30" />
                    ) : (
                      <RiCheckLine className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span>
                    {typeof feat.empresarial === 'string' ? (
                      <><span className="font-semibold text-white">{feat.empresarial}</span> {feat.label.toLowerCase()}</>
                    ) : feat.empresarial ? feat.label : (
                      <span className="line-through text-white/30">{feat.label}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {PLANO_ATUAL === 'empresarial' ? (
              <button disabled className="w-full py-3 rounded-xl bg-white/20 text-sm font-bold text-white cursor-not-allowed" data-testid="button-plano-atual-empresarial">
                Plano atual
              </button>
            ) : (
              <button
                onClick={() => assinar('empresarial')}
                disabled={checkout.isPending || !planoDeSlot('empresarial')}
                className="w-full py-3 rounded-xl bg-white text-sm font-extrabold text-primary hover:bg-white/90 transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="button-assinar-empresarial"
              >
                {checkout.isPending ? 'Processando…' : 'Assinar agora'}
              </button>
            )}
          </div>

          {/* Enterprise */}
          <div className="relative rounded-3xl p-6 lg:p-8 flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-700 shadow-xl">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 md:top-6">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                Melhor ROI
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <RiBuilding4Line className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Enterprise</p>
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Para escalar</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-extrabold text-white">
                  R$ {precoMensal('enterprise') ?? '—'}
                </span>
                <span className="text-white/50 text-sm mb-2">/mês</span>
              </div>
              {anual && precoMensal('enterprise') != null && (
                <p className="text-xs text-white/40 mt-1">Cobrado anualmente (R$ {(precoMensal('enterprise')! * 12).toLocaleString('pt-BR')}/ano)</p>
              )}
            </div>

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FEATURES.map((feat) => (
                <li key={feat.label} className="flex items-center gap-3 text-sm text-white/80">
                  <div className="shrink-0 w-5">
                    {typeof feat.enterprise === 'boolean' ? (
                      feat.enterprise
                        ? <RiCheckLine className="w-4 h-4 text-emerald-400" />
                        : <RiCloseLine className="w-4 h-4 text-white/20" />
                    ) : (
                      <RiCheckLine className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <span>
                    {typeof feat.enterprise === 'string' ? (
                      <><span className="font-semibold text-white">{feat.enterprise}</span> {feat.label.toLowerCase()}</>
                    ) : feat.enterprise ? feat.label : (
                      <span className="line-through text-white/20">{feat.label}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {PLANO_ATUAL === 'enterprise' ? (
              <button disabled className="w-full py-3 rounded-xl bg-white/10 text-sm font-bold text-white cursor-not-allowed" data-testid="button-plano-atual-enterprise">
                Plano atual
              </button>
            ) : (
              <button
                onClick={() => assinar('enterprise')}
                disabled={checkout.isPending || !planoDeSlot('enterprise')}
                className="w-full py-3 rounded-xl bg-white text-sm font-extrabold text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="button-assinar-enterprise"
              >
                {checkout.isPending ? 'Processando…' : 'Assinar agora'}
              </button>
            )}
          </div>
        </div>

        {/* ── Feature Comparison Table ── */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Compare todos os recursos
          </h2>
          <div className="overflow-x-auto rounded-2xl">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 min-w-[540px]">
            {/* Table header */}
            <div className="grid grid-cols-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
              <div className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Recurso</div>
              <div className="p-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Starter</div>
              <div className="p-4 text-center text-xs font-bold text-primary uppercase tracking-wider bg-primary/5">Empresarial</div>
              <div className="p-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Enterprise</div>
            </div>
            {/* Rows */}
            {FEATURES.map((feat, idx) => (
              <div
                key={feat.label}
                className={cn(
                  'grid grid-cols-4 items-center',
                  idx < FEATURES.length - 1 && 'border-b border-gray-50 dark:border-gray-800/60'
                )}
              >
                <div className="p-4 text-sm text-gray-700 dark:text-gray-300">{feat.label}</div>
                <div className="p-4 text-center">
                  <FeatureValue value={feat.starter} />
                </div>
                <div className="p-4 text-center bg-primary/[0.03] dark:bg-primary/5">
                  <FeatureValue value={feat.empresarial} highlight />
                </div>
                <div className="p-4 text-center">
                  <FeatureValue value={feat.enterprise} />
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Perguntas frequentes
          </h2>
          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

      </div>

      {/* ── Diálogo confirmação troca de plano ── */}
      {(() => {
        const isUpgrade = pendingSlot !== null && TIER_ORDER[pendingSlot] > TIER_ORDER[PLANO_ATUAL];
        const pendingPreco = pendingSlot ? precoMensal(pendingSlot) : null;
        const renovaLabel = perfilPlano?.renovaEm
          ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(perfilPlano.renovaEm))
          : null;
        // vigenciaEm: se há assinatura ativa, a mudança entra em vigor no fim do ciclo atual.
        // Para nova assinatura, entra em vigor imediatamente (hoje).
        const vigenciaEm = renovaLabel ?? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());
        return (
          <AlertDialog open={pendingSlot !== null} onOpenChange={(o) => { if (!o) setPendingSlot(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle data-testid="dialog-troca-plano-titulo">
                  {pendingSlot !== null ? (isUpgrade ? 'Fazer upgrade de plano?' : 'Fazer downgrade de plano?') : 'Trocar de plano?'}
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    {pendingSlot !== null && (
                      <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted/50 text-foreground font-medium">
                        <span data-testid="dialog-plano-atual">{SLOT_LABEL[PLANO_ATUAL]}</span>
                        <RiArrowRightLine className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span data-testid="dialog-plano-novo">{SLOT_LABEL[pendingSlot]}</span>
                        {pendingPreco != null && (
                          <span className="ml-auto text-xs font-normal text-muted-foreground">
                            R$ {pendingPreco}/mês
                          </span>
                        )}
                      </div>
                    )}
                    <p>
                      {renovaLabel
                        ? <>Seu plano mudará para <strong>{pendingSlot ? SLOT_LABEL[pendingSlot] : ''}</strong> ao final do ciclo atual.</>
                        : <>{isUpgrade ? 'Upgrade' : 'Troca'} para o plano <strong>{pendingSlot ? SLOT_LABEL[pendingSlot] : ''}</strong>. Os limites entrarão em vigor imediatamente.</>
                      }
                    </p>
                    <div className="text-xs space-y-1 mt-1">
                      <p>
                        Data de vigência:{' '}
                        <strong data-testid="dialog-vigencia-em">{vigenciaEm}</strong>
                      </p>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPendingSlot(null)}>Manter plano atual</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmarTroca}
                  disabled={checkout.isPending}
                  data-testid="button-confirmar-troca-plano"
                >
                  <RiArrowRightLine className="w-4 h-4 mr-1" />
                  {checkout.isPending ? 'Processando…' : 'Confirmar troca'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      })()}
    </div>
  );
}
