import { isCpfCnpjValid, unformatCpfCnpj } from '@shared/lib/masks';

/**
 * 10/11/2026 — regras do documento no 1º passo do wizard (J51), por perfil.
 * Puro (sem `server-only`): roda na tela, no servidor e nos testes com `tsx`.
 *
 *  - xgestão (empreiteiro com o papel `xgestao`): CPF ou CNPJ OBRIGATÓRIO. O
 *    teste grátis e o mês bônus valem uma vez por documento (XG50) e o
 *    checkout precisa dele; pedir no 1º passo fecha a porta de criar outra
 *    conta para ganhar outro teste.
 *  - empreiteiro do marketplace: opcional, só CNPJ (como antes).
 *  - contratante: opcional, segue o PF/PJ escolhido (como antes).
 *  - anunciante: não informa documento no wizard.
 */
export type PerfilDocumentoOnboarding = {
  role: 'contratante' | 'empreiteiro' | 'anunciante' | string;
  roles?: readonly string[];
  /** Só contratante: o PF/PJ marcado na tela. */
  tipoContratante?: 'Pessoa Física' | 'Pessoa Jurídica';
};

export const MENSAGEM_DOCUMENTO_XGESTAO =
  'Para liberar seu teste grátis e emitir suas cobranças com segurança, precisamos do seu CPF ou CNPJ. Usamos só para isso.';

/** Conta dona do xgestão: empreiteiro com o papel aditivo `xgestao`. */
export function ehContaXgestao(perfil: Pick<PerfilDocumentoOnboarding, 'role' | 'roles'>): boolean {
  return perfil.role === 'empreiteiro' && (perfil.roles ?? []).includes('xgestao');
}

export function documentoObrigatorioNoOnboarding(perfil: Pick<PerfilDocumentoOnboarding, 'role' | 'roles'>): boolean {
  return ehContaXgestao(perfil);
}

/**
 * Valida o que a pessoa digitou. Devolve a mensagem de erro, ou `null` quando
 * pode seguir. Vazio só é aceito quando o documento é opcional.
 */
export function validarDocumentoOnboarding(valor: string, perfil: PerfilDocumentoOnboarding): string | null {
  const digitos = unformatCpfCnpj(valor ?? '');

  if (ehContaXgestao(perfil)) {
    if (!digitos) return 'Informe seu CPF ou CNPJ para continuar.';
    if ((digitos.length !== 11 && digitos.length !== 14) || !isCpfCnpjValid(digitos)) {
      return 'CPF ou CNPJ inválido. Confira os números.';
    }
    return null;
  }

  if (perfil.role === 'anunciante') return null;
  if (!digitos) return null;

  const isContratante = perfil.role === 'contratante';
  const somenteCnpj = perfil.role === 'empreiteiro' || (isContratante && perfil.tipoContratante === 'Pessoa Jurídica');
  const somenteCpf = isContratante && perfil.tipoContratante === 'Pessoa Física';
  const rotulo = somenteCnpj ? 'CNPJ' : 'CPF';

  if (!isCpfCnpjValid(digitos)) return `${rotulo} inválido`;
  if (somenteCnpj && digitos.length !== 14) {
    return perfil.role === 'empreiteiro'
      ? 'Empreiteiro precisa de CNPJ — o cadastro é de pessoa jurídica'
      : 'Você marcou Pessoa Jurídica — informe um CNPJ';
  }
  if (somenteCpf && digitos.length !== 11) return 'Você marcou Pessoa Física — informe um CPF';
  return null;
}
