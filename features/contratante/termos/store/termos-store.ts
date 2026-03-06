import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Versões atuais dos documentos.
// Ao bumpar estas constantes, todos os contratantes precisam re-aceitar.
export const VERSAO_ATUAL_TERMOS = '1.0';
export const VERSAO_ATUAL_PRIVACIDADE = '1.0';

interface TermosStore {
  termosAceitosEm: string | null;
  privacidadeAceitaEm: string | null;
  versaoTermosAceita: string | null;
  versaoPrivacidadeAceita: string | null;
  acceptAll: () => void;
  hasAcceptedAll: () => boolean;
  revokeAll: () => void;
}

export const useContratanteTermosStore = create<TermosStore>()(
  persist(
    (set, get) => ({
      termosAceitosEm: null,
      privacidadeAceitaEm: null,
      versaoTermosAceita: null,
      versaoPrivacidadeAceita: null,

      acceptAll: () => {
        const now = new Date().toISOString();
        set({
          termosAceitosEm: now,
          privacidadeAceitaEm: now,
          versaoTermosAceita: VERSAO_ATUAL_TERMOS,
          versaoPrivacidadeAceita: VERSAO_ATUAL_PRIVACIDADE,
        });
      },

      hasAcceptedAll: () => {
        const { termosAceitosEm, privacidadeAceitaEm, versaoTermosAceita, versaoPrivacidadeAceita } = get();
        return (
          !!termosAceitosEm &&
          !!privacidadeAceitaEm &&
          versaoTermosAceita === VERSAO_ATUAL_TERMOS &&
          versaoPrivacidadeAceita === VERSAO_ATUAL_PRIVACIDADE
        );
      },

      revokeAll: () => {
        set({
          termosAceitosEm: null,
          privacidadeAceitaEm: null,
          versaoTermosAceita: null,
          versaoPrivacidadeAceita: null,
        });
      },
    }),
    { name: 'xconstrucao-contratante-termos' },
  ),
);
