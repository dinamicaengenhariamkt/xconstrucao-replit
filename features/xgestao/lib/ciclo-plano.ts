/**
 * XG50 — ciclo de cobrança do plano (mensal ou anual), em regras puras.
 * Sem `server-only`: roda no servidor, na tela e nos testes com `tsx`.
 *
 * O anual está PREPARADO e DESLIGADO (decisão pendente do dono, 10/11/2026):
 * só aparece e só é aceito quando `planos.valor_anual` está preenchido E a
 * chave `platform_settings.xgestao.anualAtivo` é `true`. Ver doc 50.
 */
export type CicloPlano = 'mensal' | 'anual';

type PrecoPlano = { valorMensal: string | number; valorAnual?: string | number | null };

export function cicloDaAssinatura(ciclo: string | null | undefined): CicloPlano {
  return ciclo === 'anual' ? 'anual' : 'mensal';
}

export function mesesDoCiclo(ciclo: string | null | undefined): 1 | 12 {
  return cicloDaAssinatura(ciclo) === 'anual' ? 12 : 1;
}

function temValorAnual(plano: PrecoPlano): boolean {
  return plano.valorAnual !== null && plano.valorAnual !== undefined && Number(plano.valorAnual) > 0;
}

/** Valor cobrado por ciclo: o anual inteiro no anual, a mensalidade no mensal. */
export function valorDoCiclo(plano: PrecoPlano, ciclo: string | null | undefined): number {
  return cicloDaAssinatura(ciclo) === 'anual' && temValorAnual(plano) ? Number(plano.valorAnual) : Number(plano.valorMensal);
}

/** Receita mensal equivalente (MRR): anual / 12, arredondado a centavos. */
export function mensalidadeEquivalente(plano: PrecoPlano, ciclo: string | null | undefined): number {
  if (cicloDaAssinatura(ciclo) === 'anual' && temValorAnual(plano)) return Math.round(Number(plano.valorAnual) * 100 / 12) / 100;
  return Number(plano.valorMensal);
}

/** O anual do xgestão só existe com a chave ligada e o preço anual preenchido. */
export function anualDisponivelXgestao(plano: Pick<PrecoPlano, 'valorAnual'>, anualAtivo: boolean): boolean {
  return anualAtivo && plano.valorAnual !== null && plano.valorAnual !== undefined && Number(plano.valorAnual) > 0;
}
