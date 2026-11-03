/** O tier legado não define se uma empresa está pagando nem se pode escrever. */
export function assinaturaXgestaoVigente(assinatura: {
  status: string; provider: string; renovaEm: Date | null; preco: string | number;
} | null, agora = new Date()): boolean {
  if (!assinatura || assinatura.status !== 'ativa') return false;
  if (assinatura.provider === 'trial') {
    return assinatura.renovaEm !== null && assinatura.renovaEm.getTime() > agora.getTime();
  }
  return Number(assinatura.preco) > 0;
}
