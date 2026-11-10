/**
 * Regras puras de vigência do plano xgestão (sem banco, sem `server-only`):
 * rodam no servidor, nos testes com `tsx` e, as datas, também na tela.
 *
 * Decisões de 09/11/2026:
 * - fim do teste: a conta fica em somente leitura 24h depois do prazo;
 * - cancelamento: o acesso segue até o fim do período já pago (`renovaEm`);
 * - pagamento recusado: carência de 7 dias contados do vencimento;
 * - assinar durante o teste dá +1 mês: a 1ª cobrança é 1 mês após o fim do teste.
 *
 * 10/11/2026: o bônus só vale com o 1º pagamento e uma vez por conta (abaixo).
 */
export const TOLERANCIA_FIM_TESTE_MS = 24 * 60 * 60 * 1000;
export const CARENCIA_INADIMPLENCIA_DIAS = 7;
const CARENCIA_INADIMPLENCIA_MS = CARENCIA_INADIMPLENCIA_DIAS * 24 * 60 * 60 * 1000;

export type AssinaturaXgestaoLida = {
  status: string;
  provider: string;
  renovaEm: Date | null;
  preco: string | number;
  /** Preenchido com a assinatura ainda ativa = cancelamento agendado para `renovaEm`. */
  canceladaEm?: Date | null;
};

/** Momento em que um teste vira somente leitura: fim do prazo + 24h. */
export function bloqueioDoTeste(fimTeste: Date): Date {
  return new Date(fimTeste.getTime() + TOLERANCIA_FIM_TESTE_MS);
}

/**
 * Soma meses de calendário sem pular mês: 31/01 + 1 mês = 28/02 (ou 29/02),
 * e não 03/03 como faria `setMonth`. Mantém a hora.
 */
export function somarMeses(data: Date, meses: number): Date {
  const resultado = new Date(data.getTime());
  const dia = resultado.getUTCDate();
  resultado.setUTCDate(1);
  resultado.setUTCMonth(resultado.getUTCMonth() + meses);
  const ultimoDia = new Date(Date.UTC(resultado.getUTCFullYear(), resultado.getUTCMonth() + 1, 0)).getUTCDate();
  resultado.setUTCDate(Math.min(dia, ultimoDia));
  return resultado;
}

/** Bônus de quem assina durante o teste: a 1ª cobrança fica 1 mês após o fim do teste. */
export function primeiraCobrancaComBonus(fimTeste: Date): Date {
  return somarMeses(fimTeste, 1);
}

/**
 * Regra do dono (10/11/2026): o mês bônus só vale se a assinatura chegar ao 1º
 * pagamento, e vale uma única vez por conta.
 *
 * `fimTesteEm` marca a assinatura que recebeu o bônus (guarda o fim do teste de
 * origem); `primeiroPagamentoEm` marca o 1º pagamento confirmado.
 */
export type AssinaturaParaCancelar = {
  renovaEm: Date | null;
  fimTesteEm?: Date | null;
  primeiroPagamentoEm?: Date | null;
};

/**
 * Até quando o acesso completo continua se a assinatura for cancelada agora.
 * - Com bônus e sem 1º pagamento: cancelou no teste, vale até o fim do teste + 24h;
 *   já no mês bônus, 24h a partir do cancelamento. Nunca passa de `renovaEm`.
 * - Nos demais casos: até o fim do período já pago (`renovaEm`), se ainda no futuro.
 */
export function acessoAteAoCancelar(assinatura: AssinaturaParaCancelar, agora = new Date()): Date | null {
  const renova = assinatura.renovaEm;
  if (assinatura.fimTesteEm && !assinatura.primeiroPagamentoEm) {
    const base = Math.max(assinatura.fimTesteEm.getTime(), agora.getTime());
    const ate = new Date(base + TOLERANCIA_FIM_TESTE_MS);
    return renova && renova.getTime() < ate.getTime() ? renova : ate;
  }
  return renova && renova.getTime() > agora.getTime() ? renova : null;
}

/**
 * Data da 1ª cobrança de uma assinatura nova do xgestão (null = cobra agora).
 * - No teste, sem bônus usado: 1 mês após o fim do teste (bônus).
 * - No teste, com bônus já usado: no fim do teste, sem mês extra.
 * - Com cancelamento agendado: no fim do período em que o acesso ainda vale.
 */
export function primeiraCobrancaAoAssinar(args: {
  fimTeste?: Date | null;
  bonusJaUsado: boolean;
  acessoAte?: Date | null;
}, agora = new Date()): { primeiraCobrancaEm: Date | null; comBonus: boolean } {
  if (args.fimTeste) {
    if (!args.bonusJaUsado) return { primeiraCobrancaEm: primeiraCobrancaComBonus(args.fimTeste), comBonus: true };
    return { primeiraCobrancaEm: args.fimTeste.getTime() > agora.getTime() ? args.fimTeste : null, comBonus: false };
  }
  if (args.acessoAte && args.acessoAte.getTime() > agora.getTime()) {
    return { primeiraCobrancaEm: args.acessoAte, comBonus: false };
  }
  return { primeiraCobrancaEm: null, comBonus: false };
}

/** O tier legado não define se uma empresa está pagando nem se pode escrever. */
export function assinaturaXgestaoVigente(
  assinatura: AssinaturaXgestaoLida | null,
  agora = new Date(),
): boolean {
  if (!assinatura) return false;
  const renova = assinatura.renovaEm?.getTime() ?? null;
  if (assinatura.provider === 'trial') {
    return assinatura.status === 'ativa' && renova !== null
      && renova + TOLERANCIA_FIM_TESTE_MS > agora.getTime();
  }
  if (!(Number(assinatura.preco) > 0)) return false;
  if (assinatura.status === 'ativa') {
    // Cancelada pelo assinante: vale até o fim do período pago, e não depois.
    if (assinatura.canceladaEm) return renova !== null && renova > agora.getTime();
    return true;
  }
  if (assinatura.status === 'inadimplente') {
    return renova !== null && renova + CARENCIA_INADIMPLENCIA_MS > agora.getTime();
  }
  return false;
}
