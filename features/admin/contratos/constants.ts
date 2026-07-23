import type { ContratoDocumento } from './types';

/** Rótulos PT-BR por tipo de documento aceito. */
export const DOCUMENTO_LABEL: Record<ContratoDocumento, string> = {
  termo_anunciante: 'Termo do Anunciante',
  contrato_obra: 'Contrato de Obra',
  termos: 'Termos de Uso',
  privacidade: 'Política de Privacidade',
};

/**
 * Tipos exibidos na área de Contratos. Termo do Anunciante (J59, fonte
 * user_consents) e Contrato de Obra (J58, fonte contrato_assinaturas — assinatura
 * entre contratante e empreiteiro). Ambos têm dado real, sem mock.
 */
export const CONTRATO_DOCUMENTOS: ContratoDocumento[] = ['termo_anunciante', 'contrato_obra'];
