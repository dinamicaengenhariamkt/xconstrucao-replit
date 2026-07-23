'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RiBuilding2Line,
  RiVipCrownLine,
  RiBankLine,
  RiCheckLine,
  RiArrowRightLine,
  RiExternalLinkLine,
} from 'react-icons/ri';
import { useToast } from '@shared/hooks/use-toast';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@shared/components/ui/radio-group';
import { getRedirectPathByRole } from '@features/auth/utils/redirect-by-role';
import {
  useUpdatePerfilContratante,
  useUpdatePerfilEmpreiteiro,
} from '@features/perfil/hooks/use-perfil';
import { usePlanos, useCheckout, type PlanoApi } from '@features/planos/ui/use-planos';
import { useRecebimento } from '@features/marketplace/hooks/use-recebimento';
import { formatCep, unformatCep } from '@shared/lib/masks';
import { useConcluirOnboarding } from './useConcluirOnboarding';

type Persona = 'contratante' | 'empreiteiro' | 'anunciante';

interface OnboardingWizardProps {
  /** Papel primário do usuário (do /api/auth/me). */
  role: Persona;
}

/**
 * J51 — Wizard de onboarding (primeiro acesso). Pulável em todos os passos.
 * Passos por persona:
 *  - contratante: [empresa (PF/PJ)] → [planos] → [concluir]
 *  - empreiteiro: [empresa]        → [recebimento?] → [planos] → [concluir]
 *  - anunciante:  [empresa]        → [concluir]   (sem plano nem recebimento)
 *
 * NÃO cria/toca conta Asaas (isso já ocorre no cadastro, J44). Concluir E pular
 * chamam `POST /api/onboarding/concluir`; o gate pós-login não reabre o wizard.
 */
export function OnboardingWizard({ role }: OnboardingWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const concluir = useConcluirOnboarding();

  // Só empreiteiro vê o passo de recebimento, e apenas quando o split está on.
  // Gate o hook para não disparar a consulta (403) em contratante/anunciante.
  const recebimento = useRecebimento({ enabled: role === 'empreiteiro' });
  const mostrarRecebimento = role === 'empreiteiro' && recebimento.data?.enabled === true;
  const mostrarPlanos = role === 'contratante' || role === 'empreiteiro';

  // Sequência de passos calculada a partir da persona/flag.
  const steps = useMemo<StepId[]>(() => {
    const s: StepId[] = ['empresa'];
    if (mostrarRecebimento) s.push('recebimento');
    if (mostrarPlanos) s.push('planos');
    s.push('concluir');
    return s;
  }, [mostrarRecebimento, mostrarPlanos]);

  const [stepIndex, setStepIndex] = useState(0);
  const current = steps[stepIndex];

  const irParaDashboard = () => router.replace(getRedirectPathByRole(role));

  const finalizar = async () => {
    try {
      await concluir.mutateAsync();
    } catch {
      // Best-effort: não prender o usuário no wizard por falha de rede.
    } finally {
      irParaDashboard();
    }
  };

  const avancar = () => {
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
    else void finalizar();
  };

  const pular = () => {
    void finalizar();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1C1F22] flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-xl">
        <StepBar total={steps.length} index={stepIndex} />

        <div className="mt-8">
          {current === 'empresa' && (
            <StepEmpresa
              role={role}
              onNext={avancar}
              onToast={(t) => toast(t)}
            />
          )}
          {current === 'recebimento' && <StepRecebimento onNext={avancar} />}
          {current === 'planos' && (
            <StepPlanos
              role={role as 'contratante' | 'empreiteiro'}
              onNext={avancar}
              onToast={(t) => toast(t)}
            />
          )}
          {current === 'concluir' && (
            <StepConcluir onFinish={() => void finalizar()} loading={concluir.isPending} />
          )}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={pular}
            className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors underline"
            data-testid="button-onboarding-skip"
          >
            Pular por agora
          </button>
        </div>
      </div>
    </div>
  );
}

type StepId = 'empresa' | 'recebimento' | 'planos' | 'concluir';

function StepBar({ total, index }: { total: number; index: number }) {
  return (
    <div className="flex items-center gap-2" data-testid="onboarding-stepbar">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i <= index ? 'bg-[#333333] dark:bg-white' : 'bg-slate-200 dark:bg-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Passo 1 — Dados de empresa (PF/PJ explícito para contratante)
// ---------------------------------------------------------------------------

type ToastFn = (t: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;

function StepEmpresa({
  role,
  onNext,
  onToast,
}: {
  role: Persona;
  onNext: () => void;
  onToast: ToastFn;
}) {
  const updateContratante = useUpdatePerfilContratante();
  const updateEmpreiteiro = useUpdatePerfilEmpreiteiro();
  const isContratante = role === 'contratante';

  // Contratante escolhe PF/PJ; empreiteiro é sempre PJ (tem CNPJ, sem coluna tipo).
  const [tipo, setTipo] = useState<'Pessoa Física' | 'Pessoa Jurídica'>('Pessoa Jurídica');
  const [nome, setNome] = useState('');
  const [cep, setCep] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const salvando = updateContratante.isPending || updateEmpreiteiro.isPending;

  const salvarEavancar = async () => {
    try {
      if (isContratante) {
        await updateContratante.mutateAsync({
          ...(nome ? { nome } : {}),
          tipo,
          ...(cep ? { cep: unformatCep(cep) } : {}),
          ...(cidade ? { cidade } : {}),
          ...(estado ? { estado } : {}),
        });
      } else if (role === 'empreiteiro') {
        await updateEmpreiteiro.mutateAsync({
          ...(nome ? { nome } : {}),
          ...(cep ? { cep: unformatCep(cep) } : {}),
          ...(cidade ? { cidade } : {}),
          ...(estado ? { estado } : {}),
        });
      }
      onNext();
    } catch {
      onToast({
        title: 'Não foi possível salvar',
        description: 'Tente novamente ou pule por agora.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-1">
          <RiBuilding2Line className="text-2xl text-[#333333] dark:text-white" />
          <h2 className="text-xl font-bold" data-testid="text-onboarding-empresa-title">
            {isContratante ? 'Sobre você ou sua empresa' : 'Sobre sua empresa'}
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          Isso deixa seu cadastro pronto para publicar obras e emitir cobranças. Você pode ajustar
          depois nas Configurações.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
          Seus dados de cobrança são processados com segurança por um provedor externo de pagamentos.{" "}
          <Link href="/politica-privacidade" className="underline hover:text-[#333333] dark:hover:text-white">
            Saiba mais
          </Link>.
        </p>

        <div className="space-y-5">
          {isContratante && (
            <div>
              <Label className="mb-2 block">Você é</Label>
              <RadioGroup
                value={tipo}
                onValueChange={(v) => setTipo(v as 'Pessoa Física' | 'Pessoa Jurídica')}
                className="grid grid-cols-2 gap-3"
              >
                <label
                  className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    tipo === 'Pessoa Física'
                      ? 'border-[#333333] dark:border-white'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <RadioGroupItem value="Pessoa Física" data-testid="radio-pf" />
                  <span className="text-sm font-medium">Pessoa Física</span>
                </label>
                <label
                  className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    tipo === 'Pessoa Jurídica'
                      ? 'border-[#333333] dark:border-white'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <RadioGroupItem value="Pessoa Jurídica" data-testid="radio-pj" />
                  <span className="text-sm font-medium">Pessoa Jurídica</span>
                </label>
              </RadioGroup>
            </div>
          )}

          <div>
            <Label htmlFor="ob-nome" className="mb-2 block">
              {tipo === 'Pessoa Física' && isContratante ? 'Nome completo' : 'Nome / Razão social'}
            </Label>
            <Input
              id="ob-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={isContratante ? 'Como devemos te chamar' : 'Nome da sua empresa'}
              data-testid="input-onboarding-nome"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Label htmlFor="ob-cep" className="mb-2 block">CEP</Label>
              <Input
                id="ob-cep"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
                inputMode="numeric"
                placeholder="00000-000"
                data-testid="input-onboarding-cep"
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="ob-cidade" className="mb-2 block">Cidade</Label>
              <Input
                id="ob-cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade"
                data-testid="input-onboarding-cidade"
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="ob-uf" className="mb-2 block">UF</Label>
              <Input
                id="ob-uf"
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="UF"
                maxLength={2}
                data-testid="input-onboarding-uf"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={salvarEavancar} disabled={salvando} data-testid="button-onboarding-empresa-next">
            {salvando ? 'Salvando...' : 'Continuar'}
            <RiArrowRightLine className="ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Passo 2 — Recebimento (empreiteiro, opcional; só com split on)
// ---------------------------------------------------------------------------

function StepRecebimento({ onNext }: { onNext: () => void }) {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-1">
          <RiBankLine className="text-2xl text-[#333333] dark:text-white" />
          <h2 className="text-xl font-bold" data-testid="text-onboarding-recebimento-title">
            Como você vai receber
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          Configure seus dados de recebimento (PIX ou conta bancária) para receber pelas obras
          direto na plataforma. É opcional agora — dá para fazer depois nas Configurações.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
          Seus dados de recebimento são processados com segurança por um provedor externo de pagamentos.{" "}
          <Link href="/politica-privacidade" className="underline hover:text-[#333333] dark:hover:text-white">
            Saiba mais
          </Link>.
        </p>

        <a
          href="/empreiteiro/configuracoes?tab=recebimentos"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          data-testid="link-onboarding-recebimento"
        >
          Configurar recebimento
          <RiExternalLinkLine />
        </a>

        <div className="mt-8 flex justify-end">
          <Button variant="outline" onClick={onNext} data-testid="button-onboarding-recebimento-next">
            Fazer depois
            <RiArrowRightLine className="ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Passo 3 — Planos (merchandising do pago, free como saída). Oculto p/ anunciante.
// ---------------------------------------------------------------------------

function StepPlanos({
  role,
  onNext,
  onToast,
}: {
  role: 'contratante' | 'empreiteiro';
  onNext: () => void;
  onToast: ToastFn;
}) {
  const { data: planos, isLoading } = usePlanos();
  const checkout = useCheckout();

  // Plano pago em destaque = primeiro tier "pro" da persona; free como saída.
  const planoPago = useMemo<PlanoApi | undefined>(() => {
    if (!planos) return undefined;
    return planos.find((p) => p.tier === 'pro' && (p.persona === role || p.persona === 'ambos'));
  }, [planos, role]);

  const assinar = async () => {
    if (!planoPago) return;
    try {
      const result = await checkout.mutateAsync({ planoId: planoPago.id, ciclo: 'mensal' });
      // Gateway real (kind: 'redirect') já disparou window.location.assign no
      // hook — NÃO avançar o passo (o browser está saindo da página). Só segue
      // o wizard quando a ativação foi imediata (adapter manual).
      if (result.kind === 'activated') onNext();
    } catch (err) {
      onToast({
        title: 'Não foi possível assinar agora',
        description: err instanceof Error ? err.message : 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-1">
          <RiVipCrownLine className="text-2xl text-amber-500" />
          <h2 className="text-xl font-bold" data-testid="text-onboarding-planos-title">
            Acelere com o plano Pro
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Comece grátis quando quiser — mas o Pro libera mais obras, mais propostas e prioridade no
          marketplace desde o primeiro dia.
        </p>

        {isLoading && <p className="text-sm text-slate-400">Carregando planos...</p>}

        {planoPago && (
          <div className="rounded-2xl border-2 border-amber-400 p-6 mb-4">
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-bold text-lg">{planoPago.nome}</span>
              <span className="font-extrabold text-xl">
                R$ {Number(planoPago.valorMensal).toFixed(0)}
                <span className="text-sm font-medium text-slate-400">/mês</span>
              </span>
            </div>
            <ul className="space-y-2 mb-2">
              {planoPago.features.slice(0, 5).map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <RiCheckLine className="text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onNext}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 underline"
            data-testid="button-onboarding-plano-free"
          >
            Começar no plano grátis
          </button>
          <Button
            onClick={assinar}
            disabled={!planoPago || checkout.isPending}
            data-testid="button-onboarding-plano-assinar"
          >
            {checkout.isPending ? 'Processando...' : 'Assinar o Pro'}
            <RiArrowRightLine className="ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Passo final — Concluir
// ---------------------------------------------------------------------------

function StepConcluir({ onFinish, loading }: { onFinish: () => void; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-4">
            <RiCheckLine className="text-3xl text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2" data-testid="text-onboarding-concluir-title">
          Tudo pronto!
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Sua conta está configurada. Vamos para o seu painel.
        </p>
        <Button onClick={onFinish} disabled={loading} data-testid="button-onboarding-concluir">
          {loading ? 'Finalizando...' : 'Ir para o painel'}
          <RiArrowRightLine className="ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
