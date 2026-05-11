/**
 * Store unificado de termos & privacidade.
 * Substitui os antigos `features/{contratante,empreiteiro}/termos/store/termos-store.ts`
 * que usavam apenas localStorage. Agora hidrata a partir do servidor (user_consents)
 * e propaga aceite/revogação para o backend.
 */
import { create } from 'zustand';

export const VERSAO_ATUAL_TERMOS = '1.0';
export const VERSAO_ATUAL_PRIVACIDADE = '1.0';

interface TermosState {
  termosAceitosEm: string | null;
  privacidadeAceitaEm: string | null;
  versaoTermosAceita: string | null;
  versaoPrivacidadeAceita: string | null;
  termosIp: string | null;
  privacidadeIp: string | null;
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  acceptAll: () => Promise<void>;
  revokeAll: () => Promise<void>;
  hasAcceptedAll: () => boolean;
  reset: () => void;
}

interface ConsentRow {
  documento: 'termos' | 'privacidade';
  versao: string;
  aceitoEm: string;
  revogadoEm: string | null;
  ip: string | null;
  userAgent: string | null;
}

export const useTermosStore = create<TermosState>((set, get) => ({
  termosAceitosEm: null,
  privacidadeAceitaEm: null,
  versaoTermosAceita: null,
  versaoPrivacidadeAceita: null,
  termosIp: null,
  privacidadeIp: null,
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch('/api/perfil/consent', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) {
        set({ loaded: true, loading: false });
        return;
      }
      const data = (await res.json()) as { consents: ConsentRow[] };
      const termos = data.consents.find((c) => c.documento === 'termos' && !c.revogadoEm);
      const privacidade = data.consents.find((c) => c.documento === 'privacidade' && !c.revogadoEm);
      set({
        termosAceitosEm: termos?.aceitoEm ?? null,
        versaoTermosAceita: termos?.versao ?? null,
        termosIp: termos?.ip ?? null,
        privacidadeAceitaEm: privacidade?.aceitoEm ?? null,
        versaoPrivacidadeAceita: privacidade?.versao ?? null,
        privacidadeIp: privacidade?.ip ?? null,
        loaded: true,
        loading: false,
      });
    } catch {
      set({ loaded: true, loading: false });
    }
  },

  acceptAll: async () => {
    const res = await fetch('/api/perfil/consent/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        versaoTermos: VERSAO_ATUAL_TERMOS,
        versaoPrivacidade: VERSAO_ATUAL_PRIVACIDADE,
      }),
    });
    if (!res.ok) throw new Error('Falha ao registrar aceite');
    const nowIso = new Date().toISOString();
    set({
      termosAceitosEm: nowIso,
      privacidadeAceitaEm: nowIso,
      versaoTermosAceita: VERSAO_ATUAL_TERMOS,
      versaoPrivacidadeAceita: VERSAO_ATUAL_PRIVACIDADE,
    });
    set({ loaded: false });
    await get().load();
  },

  revokeAll: async () => {
    await fetch('/api/perfil/consent/revoke', { method: 'POST', credentials: 'include' }).catch(() => {});
    set({
      termosAceitosEm: null,
      privacidadeAceitaEm: null,
      versaoTermosAceita: null,
      versaoPrivacidadeAceita: null,
      termosIp: null,
      privacidadeIp: null,
    });
  },

  hasAcceptedAll: () => {
    const s = get();
    return (
      !!s.termosAceitosEm &&
      !!s.privacidadeAceitaEm &&
      s.versaoTermosAceita === VERSAO_ATUAL_TERMOS &&
      s.versaoPrivacidadeAceita === VERSAO_ATUAL_PRIVACIDADE
    );
  },

  reset: () =>
    set({
      termosAceitosEm: null,
      privacidadeAceitaEm: null,
      versaoTermosAceita: null,
      versaoPrivacidadeAceita: null,
      loaded: false,
    }),
}));
