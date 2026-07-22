import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** J45 — status da subconta de recebimento do empreiteiro (projeção segura). */
export interface PublicSubconta {
  onboardingStatus: 'pendente' | 'aguardando_kyc' | 'aprovada' | 'rejeitada';
  kycStatus: string | null;
  walletId: string | null;
  tipoConta: string | null;
  pixChave: string | null;
  pixTipo: string | null;
  bancoCodigo: string | null;
  agencia: string | null;
  conta: string | null;
  contaDigito: string | null;
  contaTipo: string | null;
  titularNome: string | null;
}

export interface RecebimentoStatus {
  enabled: boolean;
  subconta: PublicSubconta | null;
}

export interface DadosRecebimentoInput {
  tipoConta: 'PIX' | 'TED';
  pixChave?: string;
  pixTipo?: string;
  bancoCodigo?: string;
  agencia?: string;
  conta?: string;
  contaDigito?: string;
  contaTipo?: string;
  titularNome?: string;
  titularCpfCnpj?: string;
  mobilePhone?: string;
  incomeValue?: number;
}

const KEY = ['empreiteiro', 'recebimento'] as const;
const URL = '/api/empreiteiro/recebimento/subconta';

export function useRecebimento() {
  return useQuery<RecebimentoStatus>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch(URL, { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useSalvarRecebimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dados: DadosRecebimentoInput) => {
      const res = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Não foi possível salvar o recebimento.');
      return data.subconta as PublicSubconta;
    },
    onSuccess: (subconta) => {
      qc.setQueryData<RecebimentoStatus>(KEY, (prev) =>
        prev ? { ...prev, subconta } : { enabled: true, subconta },
      );
    },
  });
}
