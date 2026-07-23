import type { ContratoDocumento } from './types';

/** Rótulos PT-BR por tipo de documento aceito. */
export const DOCUMENTO_LABEL: Record<ContratoDocumento, string> = {
  termo_anunciante: 'Termo do Anunciante',
  termos: 'Termos de Uso',
  privacidade: 'Política de Privacidade',
};

/**
 * Tipos exibidos na área de Contratos. Hoje só o Termo do Anunciante (J59) tem
 * semântica de "contrato de entrada" com dado real. Quando a J58 (contrato
 * entre-partes) existir, novos tipos entram aqui.
 */
export const CONTRATO_DOCUMENTOS: ContratoDocumento[] = ['termo_anunciante'];
