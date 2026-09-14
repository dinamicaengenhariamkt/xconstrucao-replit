'use client';

import { useQueryClient } from '@tanstack/react-query';

/**
 * XG12 — o que a edição da obra sabe fazer, fora de qualquer tela.
 *
 * Antes isto vivia dentro do `EditarObraPage`. Com os modais da tela de
 * detalhe escrevendo nos mesmos campos, manter uma cópia por tela significaria
 * corrigir a validação de CEP em quatro lugares.
 */

export type ObraStatus = 'planejamento' | 'em_andamento' | 'pausada' | 'concluida';

export type ObraEditavel = {
  id: string;
  nome: string;
  endereco: string;
  tipo: string | null;
  descricao: string | null;
  cep: string | null;
  numero: string | null;
  complemento: string | null;
  cidade: string | null;
  uf: string | null;
  areaM2: string | null;
  valorTotal: string | null;
  progresso: number | null;
  status: ObraStatus;
  dataInicio: string | null;
  dataPrevisao: string | null;
  fotoCapaFileId: string | null;
  fotoCapaUrl: string | null;
};

/**
 * Desempacota `errors.fieldErrors` do Zod antes da mensagem genérica: é o que
 * faz "CEP inválido" chegar ao usuário em vez de "não foi possível salvar".
 */
export async function patchObra(
  obraId: string,
  payload: Record<string, unknown>,
): Promise<ObraEditavel> {
  const response = await fetch(`/api/obras/${obraId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firstFieldError = body?.errors?.fieldErrors
      ? Object.values(body.errors.fieldErrors)
          .flat()
          .find((value) => typeof value === 'string')
      : null;
    throw new Error(
      typeof firstFieldError === 'string'
        ? firstFieldError
        : typeof body?.message === 'string'
          ? body.message
          : 'Não foi possível salvar as alterações.',
    );
  }
  return body as ObraEditavel;
}

/** Toda chave que exibe dados da obra. Salvar em qualquer tela reflete em todas. */
export function useInvalidarObra(obraId: string) {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['xgestao', 'obra-editavel', obraId] }),
      queryClient.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras'] }),
      queryClient.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras', obraId] }),
      // Prefixo das listas por obra (`fotos`, `medicoes`, `lancamentos`, `health`).
      // Sem ele, trocar a capa atualizava o hero mas deixava a própria grade de
      // fotos do editor servindo cache — o React Query casa por prefixo.
      queryClient.invalidateQueries({ queryKey: ['obras', obraId] }),
    ]);
  };
}

export type CamposInformacoes = {
  nome: string;
  tipo: string;
  descricao: string;
  areaM2: string;
  valorTotal: string;
  dataInicio: string;
  dataPrevisao: string;
  status: ObraStatus;
};

export type CamposLocalizacao = {
  endereco: string;
  numero: string;
  complemento: string;
  cep: string;
  cidade: string;
  uf: string;
};

/**
 * Valida no cliente o que o servidor também valida. A dupla checagem não é
 * redundância inútil: o erro aparece antes do round-trip, e o servidor segue
 * sendo a autoridade (`validarCamposObraPropria`).
 *
 * Lança `Error` com a primeira mensagem — o padrão que os modais e o formulário
 * já usam no `mutationFn`.
 */
export function validarInformacoes(campos: Partial<CamposInformacoes>): void {
  if (campos.nome !== undefined && campos.nome.trim().length < 3) {
    throw new Error('Informe um nome com pelo menos 3 caracteres.');
  }
  if (
    campos.dataInicio &&
    campos.dataPrevisao &&
    campos.dataPrevisao < campos.dataInicio
  ) {
    throw new Error('A previsão de término não pode ser anterior ao início.');
  }
  if (campos.areaM2?.trim() && !Number.isFinite(Number(campos.areaM2.trim()))) {
    throw new Error('Informe a área como número, por exemplo 120.5.');
  }
  if (campos.valorTotal?.trim() && !Number.isFinite(Number(campos.valorTotal.trim()))) {
    throw new Error('Informe o orçamento como número.');
  }
}

export function validarLocalizacao(campos: Partial<CamposLocalizacao>): void {
  if (campos.endereco !== undefined && campos.endereco.trim().length < 3) {
    throw new Error('Informe o endereço da obra.');
  }
  if (campos.cep?.trim() && !/^\d{5}-?\d{3}$/.test(campos.cep.trim())) {
    throw new Error('CEP inválido. Use o formato 00000-000.');
  }
  if (campos.uf?.trim() && !/^[A-Za-z]{2}$/.test(campos.uf.trim())) {
    throw new Error('UF inválida. Use a sigla de 2 letras, como SP.');
  }
}

/** Payload de informações no formato que o PATCH espera (vazio vira null). */
export function payloadInformacoes(campos: CamposInformacoes): Record<string, unknown> {
  return {
    nome: campos.nome.trim(),
    tipo: campos.tipo.trim() || null,
    descricao: campos.descricao.trim() || null,
    areaM2: campos.areaM2.trim() || null,
    valorTotal: campos.valorTotal.trim() || '0',
    dataInicio: campos.dataInicio || null,
    dataPrevisao: campos.dataPrevisao || null,
    status: campos.status,
    // `progresso` nunca é enviado: a fonte de verdade são as atualizações.
  };
}

export function payloadLocalizacao(campos: CamposLocalizacao): Record<string, unknown> {
  return {
    endereco: campos.endereco.trim(),
    numero: campos.numero.trim() || null,
    complemento: campos.complemento.trim() || null,
    cep: campos.cep.trim() || null,
    cidade: campos.cidade.trim() || null,
    uf: campos.uf.trim().toUpperCase() || null,
  };
}
