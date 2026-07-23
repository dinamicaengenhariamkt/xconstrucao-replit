/**
 * J60 — Área de Contratos no admin (registro de aceites).
 *
 * Hoje o único "contrato" com dado real é o Termo do Anunciante (J59), gravado em
 * `user_consents` (documento `termo_anunciante`). A tipagem já prevê `documento`
 * genérico para quando a J58 (contrato entre-partes) plugar novas fontes/tipos.
 */
export type ContratoDocumento = 'termo_anunciante' | 'termos' | 'privacidade' | 'contrato_obra';

export interface ContratoAceite {
  id: string;
  userId: string;
  /** Nome do usuário (fallback para email quando ausente). */
  usuario: string;
  email: string | null;
  role: string | null;
  documento: ContratoDocumento;
  versao: string;
  aceitoEm: string; // ISO
  ip: string | null;
}

export interface ContratoKpi {
  /** Documento (hoje só `termo_anunciante`). */
  documento: ContratoDocumento;
  /** Versão vigente do documento (null se nenhuma publicada). */
  versaoVigente: number | null;
  /** Total de aceites registrados (qualquer versão). */
  totalAceites: number;
  /** Aceites na versão vigente. */
  aceitesVigentes: number;
}
