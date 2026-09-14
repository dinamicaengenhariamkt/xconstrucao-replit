'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * XG12 — as atualizações da obra, como o console as lê.
 *
 * Espelha `MedicaoApiShape` de `app/api/contratante/medicoes/_shared.ts`.
 * Note `autorNome` (a pessoa que registrou) ao lado de `empreiteiroNome`
 * (a empresa): no xgestão a segunda repetiria o mesmo valor em toda linha.
 */
export interface ObraMedicaoApi {
  id: string;
  obraId: string;
  obraNome: string;
  empreiteiroNome: string;
  autorNome: string;
  autorId: string | null;
  numero: number;
  periodo: string;
  valor: number;
  status: 'aguardando_aprovacao' | 'aprovada' | 'rejeitada' | 'paga';
  dataEnvio: string;
  dataAvaliacao?: string;
  descricao: string;
  motivoRejeicao?: string;
  etapa: string;
  percentual: number;
  fotos: string[];
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.text()) || `${res.status}`);
  return res.json();
}

/**
 * A chave começa com `['obras', obraId]` de propósito: o `RegistrarMedicaoModal`
 * já invalida esse prefixo ao salvar, e o React Query casa por prefixo. A lista
 * se atualiza sozinha depois de registrar, sem tocar no modal.
 */
export function useObraMedicoes(obraId: string, enabled = true) {
  return useQuery({
    queryKey: ['obras', obraId, 'medicoes'],
    queryFn: () =>
      getJSON<{ rows: ObraMedicaoApi[] }>(`/api/obras/${obraId}/medicoes`).then((d) => d.rows),
    enabled: enabled && Boolean(obraId),
    staleTime: 30_000,
  });
}
