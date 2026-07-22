import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** J49 — item de histórico de saque (projeção da tabela `saques`). */
export interface SaqueItem {
  id: string;
  valor: string;
  status: 'pendente' | 'concluido' | 'falhou';
  asaasTransferId: string | null;
  metodo: string | null;
  createdAt: string;
}

export interface SaldoStatus {
  enabled: boolean;
  saldo: number | null;
  saques: SaqueItem[];
  /** Quando saldo=null mas enabled: motivo (ex: SUBCONTA_NAO_APROVADA). */
  motivo?: string;
}

const KEY = ['empreiteiro', 'saldo'] as const;
const SALDO_URL = '/api/empreiteiro/recebimento/saldo';
const SAQUE_URL = '/api/empreiteiro/recebimento/saque';

export function useSaldo() {
  return useQuery<SaldoStatus>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch(SALDO_URL, { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useSolicitarSaque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (valor: number) => {
      const res = await fetch(SAQUE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Não foi possível solicitar o saque.');
      return data.saque as SaqueItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
