/**
 * XG52 — consentimento de e-mail de marketing do xgestão (LGPD, art. 7º, I e
 * art. 8º). Regras puras: rodam no servidor, na tela e nos testes com `tsx`.
 *
 * - opt-in desmarcado por padrão: sem registro = sem consentimento;
 * - não é condição para usar o produto (cadastro e assinatura não dependem dele);
 * - revogação a qualquer momento, pelas configurações ou pelo link do e-mail;
 * - guarda quando aceitou, quando revogou e de onde veio a última mudança.
 */
export const ORIGENS_CONSENTIMENTO = ['cadastro', 'configuracoes', 'descadastro'] as const;
export type OrigemConsentimento = (typeof ORIGENS_CONSENTIMENTO)[number];

export interface EstadoConsentimento {
  consentimentoEm: Date | null;
  revogadoEm: Date | null;
}

/** Aceita hoje: houve consentimento e nenhuma revogação depois dele. */
export function marketingAtivo(estado: EstadoConsentimento | null | undefined): boolean {
  if (!estado?.consentimentoEm) return false;
  if (!estado.revogadoEm) return true;
  return estado.revogadoEm.getTime() < estado.consentimentoEm.getTime();
}

export interface MudancaConsentimento {
  marketingConsentimentoEm?: Date;
  marketingRevogadoEm: Date | null;
  marketingOrigem: OrigemConsentimento;
}

/**
 * Colunas a gravar quando o titular aceita ou revoga. Aceitar grava a data
 * nova e limpa a revogação; revogar mantém a data do aceite (prova de quando
 * consentiu) e grava a revogação. Descadastro só revoga.
 */
export function mudancaConsentimento(aceitar: boolean, origem: OrigemConsentimento, agora = new Date()): MudancaConsentimento {
  if (aceitar && origem === 'descadastro') throw new Error('descadastro só revoga');
  if (aceitar) return { marketingConsentimentoEm: agora, marketingRevogadoEm: null, marketingOrigem: origem };
  return { marketingRevogadoEm: agora, marketingOrigem: origem };
}
