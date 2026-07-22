'use client';

import { useEffect, useState } from 'react';
import {
  RiBankLine,
  RiExternalLinkLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiAlertLine,
  RiSave3Line,
} from 'react-icons/ri';
import { useToast } from '@shared/hooks/use-toast';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Badge } from '@shared/components/ui/badge';
import { Skeleton } from '@shared/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@shared/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { formatPhone, unformatPhone } from '@shared/lib/masks';
import {
  useRecebimento,
  useSalvarRecebimento,
  type PublicSubconta,
  type DadosRecebimentoInput,
} from '@features/marketplace/hooks/use-recebimento';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
      {children}
    </p>
  );
}

/** Opções de tipo de chave PIX exibidas ao usuário → valor enviado em pixTipo. */
const PIX_TIPOS = [
  { value: 'CPF', label: 'CPF' },
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Telefone' },
  { value: 'EVP', label: 'Aleatória' },
] as const;

const CONTA_TIPOS = [
  { value: 'CONTA_CORRENTE', label: 'Corrente' },
  { value: 'CONTA_POUPANCA', label: 'Poupança' },
] as const;

/** Mascara a chave PIX para exibição em modo leitura, preservando o começo. */
function mascararChave(chave: string | null): string {
  if (!chave) return '—';
  if (chave.length <= 4) return '••••';
  return `${chave.slice(0, 3)}••••${chave.slice(-2)}`;
}

/** Exibe os dados salvos da subconta em modo leitura. */
function DadosSalvos({ subconta }: { subconta: PublicSubconta }) {
  const isPix = subconta.tipoConta === 'PIX';
  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-2 text-sm">
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Tipo</span>
        <span className="font-medium text-foreground">
          {isPix ? 'PIX' : 'Conta bancária (TED)'}
        </span>
      </div>
      {isPix ? (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Chave PIX</span>
          <span className="font-medium text-foreground">{mascararChave(subconta.pixChave)}</span>
        </div>
      ) : (
        <>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Banco</span>
            <span className="font-medium text-foreground">{subconta.bancoCodigo ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Agência</span>
            <span className="font-medium text-foreground">{subconta.agencia ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Conta</span>
            <span className="font-medium text-foreground">
              {subconta.conta ?? '—'}
              {subconta.contaDigito ? `-${subconta.contaDigito}` : ''}
            </span>
          </div>
        </>
      )}
      {subconta.titularNome && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Titular</span>
          <span className="font-medium text-foreground">{subconta.titularNome}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Formulário de configuração / reenvio dos dados de recebimento (J45).
 * `subconta` pré-preenche os campos quando o empreiteiro está editando dados
 * já salvos (status aprovada/aguardando_kyc) ou reenviando (rejeitada).
 */
function FormRecebimento({ subconta }: { subconta: PublicSubconta | null }) {
  const { toast } = useToast();
  const { mutateAsync: salvar, isPending } = useSalvarRecebimento();

  const [tipoConta, setTipoConta] = useState<'PIX' | 'TED'>(
    subconta?.tipoConta === 'TED' ? 'TED' : 'PIX',
  );
  const [pixChave, setPixChave] = useState('');
  const [pixTipo, setPixTipo] = useState<string>('CPF');
  const [bancoCodigo, setBancoCodigo] = useState('');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [contaDigito, setContaDigito] = useState('');
  const [contaTipo, setContaTipo] = useState<string>('CONTA_CORRENTE');
  const [titularNome, setTitularNome] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [incomeValue, setIncomeValue] = useState('');

  useEffect(() => {
    if (!subconta) return;
    setTipoConta(subconta.tipoConta === 'TED' ? 'TED' : 'PIX');
    setPixChave(subconta.pixChave ?? '');
    if (subconta.pixTipo) setPixTipo(subconta.pixTipo);
    setBancoCodigo(subconta.bancoCodigo ?? '');
    setAgencia(subconta.agencia ?? '');
    setConta(subconta.conta ?? '');
    setContaDigito(subconta.contaDigito ?? '');
    if (subconta.contaTipo) setContaTipo(subconta.contaTipo);
    setTitularNome(subconta.titularNome ?? '');
  }, [subconta]);

  const handleSalvar = async () => {
    const dados: DadosRecebimentoInput = {
      tipoConta,
      titularNome: titularNome.trim() || undefined,
      mobilePhone: mobilePhone ? unformatPhone(mobilePhone) : undefined,
      incomeValue: incomeValue ? Number(incomeValue) : undefined,
    };
    if (tipoConta === 'PIX') {
      dados.pixChave = pixChave.trim();
      dados.pixTipo = pixTipo;
    } else {
      dados.bancoCodigo = bancoCodigo.trim();
      dados.agencia = agencia.trim();
      dados.conta = conta.trim();
      dados.contaDigito = contaDigito.trim();
      dados.contaTipo = contaTipo;
    }

    try {
      await salvar(dados);
      toast({
        title: 'Dados salvos',
        description: 'Seus dados de recebimento foram enviados para verificação.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const pixInvalido = tipoConta === 'PIX' && !pixChave.trim();
  const tedInvalido =
    tipoConta === 'TED' && (!bancoCodigo.trim() || !agencia.trim() || !conta.trim());

  return (
    <div className="flex flex-col gap-4">
      {/* Tipo de recebimento */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Como você quer receber?</Label>
        <RadioGroup
          value={tipoConta}
          onValueChange={(v) => setTipoConta(v as 'PIX' | 'TED')}
          className="flex flex-col gap-2 sm:flex-row sm:gap-6"
          data-testid="radio-tipo-conta"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="PIX" id="recebimento-pix" data-testid="radio-pix" />
            <Label htmlFor="recebimento-pix" className="text-sm font-normal cursor-pointer">
              PIX
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="TED" id="recebimento-ted" data-testid="radio-ted" />
            <Label htmlFor="recebimento-ted" className="text-sm font-normal cursor-pointer">
              Conta bancária (TED)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {tipoConta === 'PIX' ? (
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label className="text-sm font-medium">Chave PIX</Label>
            <Input
              value={pixChave}
              onChange={(e) => setPixChave(e.target.value)}
              placeholder="CPF, email, telefone ou chave aleatória"
              data-testid="input-pix-chave"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:w-48">
            <Label className="text-sm font-medium">Tipo da chave</Label>
            <Select value={pixTipo} onValueChange={setPixTipo}>
              <SelectTrigger data-testid="select-pix-tipo">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {PIX_TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col gap-1.5 sm:w-40">
              <Label className="text-sm font-medium">Banco (código)</Label>
              <Input
                value={bancoCodigo}
                onChange={(e) => setBancoCodigo(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 341"
                inputMode="numeric"
                data-testid="input-banco-codigo"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label className="text-sm font-medium">Agência</Label>
              <Input
                value={agencia}
                onChange={(e) => setAgencia(e.target.value)}
                placeholder="0000"
                data-testid="input-agencia"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label className="text-sm font-medium">Conta</Label>
              <Input
                value={conta}
                onChange={(e) => setConta(e.target.value)}
                placeholder="00000"
                data-testid="input-conta"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:w-24">
              <Label className="text-sm font-medium">Dígito</Label>
              <Input
                value={contaDigito}
                onChange={(e) => setContaDigito(e.target.value)}
                placeholder="0"
                data-testid="input-conta-digito"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:w-40">
              <Label className="text-sm font-medium">Tipo de conta</Label>
              <Select value={contaTipo} onValueChange={setContaTipo}>
                <SelectTrigger data-testid="select-conta-tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CONTA_TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium">Nome do titular</Label>
        <Input
          value={titularNome}
          onChange={(e) => setTitularNome(e.target.value)}
          placeholder="Nome como consta na conta / chave"
          data-testid="input-titular-nome"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label className="text-sm font-medium">Telefone</Label>
          <Input
            value={mobilePhone}
            onChange={(e) => setMobilePhone(formatPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            data-testid="input-mobile-phone"
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <Label className="text-sm font-medium">
            Faturamento mensal estimado <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            type="number"
            min={0}
            value={incomeValue}
            onChange={(e) => setIncomeValue(e.target.value)}
            placeholder="R$"
            data-testid="input-income-value"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSalvar}
          disabled={isPending || pixInvalido || tedInvalido}
          data-testid="button-salvar-recebimento"
        >
          <RiSave3Line className="w-4 h-4 mr-2" />
          {isPending ? 'Salvando...' : 'Salvar dados de recebimento'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Seção "Dados de recebimento" (J45) — configuração da subconta ASAAS do
 * empreiteiro para receber pagamentos do marketplace. A camada de dados
 * (hooks + endpoint) já existe; aqui só orquestramos os estados de UI.
 *
 * A apiKey da subconta NUNCA chega ao client (não está em PublicSubconta).
 */
export function SecaoRecebimentos() {
  const { data, isLoading } = useRecebimento();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  // Flag off — recurso ainda indisponível.
  if (!data?.enabled) {
    return (
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Dados de recebimento</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0 flex items-start gap-3">
          <RiBankLine className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground" data-testid="text-recebimento-indisponivel">
            O recebimento de pagamentos pelo marketplace ainda não está disponível na sua conta.
            Assim que liberarmos, você poderá configurar aqui como quer receber.
          </p>
        </CardContent>
      </Card>
    );
  }

  const subconta = data.subconta;

  // Configuração inicial (sem subconta, ou status pendente) → formulário.
  if (!subconta || subconta.onboardingStatus === 'pendente') {
    return (
      <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Dados de recebimento</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Informe como você quer receber os pagamentos dos serviços realizados pelo marketplace.
            Os dados passam por uma verificação antes de serem ativados.
          </p>
          <FormRecebimento subconta={null} />
        </CardContent>
      </Card>
    );
  }

  return <StatusSubconta subconta={subconta} />;
}

/** Renderiza o status da subconta conforme onboardingStatus. */
function StatusSubconta({ subconta }: { subconta: PublicSubconta }) {
  const [editando, setEditando] = useState(false);
  const status = subconta.onboardingStatus;
  const onboardingUrl = (subconta as { onboardingUrl?: string | null }).onboardingUrl ?? null;

  // Rejeitada → sempre mostra o formulário para reenvio.
  if (status === 'rejeitada') {
    return (
      <Card className="rounded-xl border border-red-200 dark:border-red-900/40">
        <CardHeader className="p-6 pb-2">
          <SectionTitle>Dados de recebimento</SectionTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" data-testid="text-recebimento-status">
              <RiAlertLine className="w-3.5 h-3.5 mr-1" />
              Dados recusados
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Não conseguimos validar os dados enviados. Revise as informações abaixo e envie
            novamente para uma nova verificação.
          </p>
          <FormRecebimento subconta={subconta} />
        </CardContent>
      </Card>
    );
  }

  const aprovada = status === 'aprovada';

  return (
    <Card
      className={
        aprovada
          ? 'rounded-xl border border-green-200 dark:border-green-900/40'
          : 'rounded-xl border border-gray-100 dark:border-gray-800'
      }
    >
      <CardHeader className="p-6 pb-2">
        <SectionTitle>Dados de recebimento</SectionTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {aprovada ? (
            <Badge
              className="border-transparent bg-green-600 text-white hover:bg-green-600"
              data-testid="text-recebimento-status"
            >
              <RiCheckboxCircleLine className="w-3.5 h-3.5 mr-1" />
              Recebimento aprovado
            </Badge>
          ) : (
            <Badge variant="secondary" data-testid="text-recebimento-status">
              <RiTimeLine className="w-3.5 h-3.5 mr-1" />
              Aguardando verificação (KYC)
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {aprovada
            ? 'Seus dados foram validados. Você já pode receber pagamentos do marketplace.'
            : 'Sua documentação está em análise. Assim que a verificação (KYC) for concluída, você poderá receber pagamentos.'}
        </p>

        {!aprovada && onboardingUrl && (
          <a
            href={onboardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline w-fit"
            data-testid="link-onboarding"
          >
            <RiExternalLinkLine className="w-4 h-4" />
            Completar documentação
          </a>
        )}

        {editando ? (
          <FormRecebimento subconta={subconta} />
        ) : (
          <>
            <DadosSalvos subconta={subconta} />
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setEditando(true)}
                data-testid="button-editar-recebimento"
              >
                Editar dados
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
