/**
 * PRD 55 — tema do painel do xgestão (empreiteiro, admin xgestão e link público).
 *
 * Separado do tema do site (`features/landing/lib/site-tema.ts`) e do store
 * antigo (`@shared/store/theme-store`, que mexe no `<html>`): aqui o escuro é a
 * classe `.dark` no `<body>`, posta só enquanto uma tela do painel está aberta.
 * Assim modais, menus e avisos (que o Radix desenha no `body`) também ficam
 * escuros, e o marketplace e o site nunca são afetados.
 *
 * O `color-scheme` do `<html>` acompanha o tema resolvido: `only light` no claro
 * (desliga o "escuro forçado" do navegador, que invertia logo e cores) e `dark`
 * no escuro (o navegador usa o nosso escuro, não a inversão dele).
 */

export type PreferenciaTema = 'claro' | 'escuro' | 'automatico';
export type TemaResolvido = 'light' | 'dark';

export const CHAVE_PAINEL_TEMA = 'xgestao-painel-tema';
export const AVISO_PAINEL_TEMA = 'xgestao-painel-tema:mudou';
export const PREFERENCIA_PADRAO: PreferenciaTema = 'automatico';
export const CLASSE_PAINEL = 'xg-painel';
const MIDIA_ESCURO = '(prefers-color-scheme: dark)';

export const OPCOES_TEMA: ReadonlyArray<{ valor: PreferenciaTema; rotulo: string }> = [
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
  { valor: 'automatico', rotulo: 'Automático' },
];

export function normalizarPreferencia(valor: unknown): PreferenciaTema {
  return valor === 'claro' || valor === 'escuro' || valor === 'automatico' ? valor : PREFERENCIA_PADRAO;
}

export function resolverTema(preferencia: PreferenciaTema, celularNoEscuro: boolean): TemaResolvido {
  if (preferencia === 'escuro') return 'dark';
  if (preferencia === 'claro') return 'light';
  return celularNoEscuro ? 'dark' : 'light';
}

export function colorSchemeDoTema(tema: TemaResolvido): string {
  return tema === 'dark' ? 'dark' : 'only light';
}

// Reserva em memória para quando o storage está bloqueado: a escolha vale até recarregar.
let preferenciaEmMemoria: PreferenciaTema | null = null;

export function lerPreferencia(): PreferenciaTema {
  try {
    const guardada = window.localStorage.getItem(CHAVE_PAINEL_TEMA);
    if (guardada !== null) return normalizarPreferencia(guardada);
  } catch {
    // Storage bloqueado: cai na memória abaixo.
  }
  return preferenciaEmMemoria ?? PREFERENCIA_PADRAO;
}

export function celularNoEscuro(): boolean {
  try {
    return window.matchMedia(MIDIA_ESCURO).matches;
  } catch {
    return false;
  }
}

export function gravarPreferencia(preferencia: PreferenciaTema) {
  preferenciaEmMemoria = preferencia;
  try {
    window.localStorage.setItem(CHAVE_PAINEL_TEMA, preferencia);
  } catch {
    // Sem storage (aba anônima restrita): vale só até recarregar, pela memória.
  }
  window.dispatchEvent(new Event(AVISO_PAINEL_TEMA));
}

/** Aplica o tema no documento. Devolve a função que desfaz (ao sair do painel). */
export function aplicarTemaNoDocumento(tema: TemaResolvido): () => void {
  const { body, documentElement } = document;
  body.classList.add(CLASSE_PAINEL);
  body.classList.toggle('dark', tema === 'dark');
  documentElement.style.colorScheme = colorSchemeDoTema(tema);
  return () => {
    body.classList.remove(CLASSE_PAINEL, 'dark');
    documentElement.style.colorScheme = '';
  };
}

export function assinarMudancasDeTema(aviso: () => void): () => void {
  window.addEventListener(AVISO_PAINEL_TEMA, aviso);
  window.addEventListener('storage', aviso);
  let midia: MediaQueryList | null = null;
  try {
    midia = window.matchMedia(MIDIA_ESCURO);
    midia.addEventListener('change', aviso);
  } catch {
    midia = null;
  }
  return () => {
    window.removeEventListener(AVISO_PAINEL_TEMA, aviso);
    window.removeEventListener('storage', aviso);
    midia?.removeEventListener('change', aviso);
  };
}

/**
 * Script que roda antes da primeira pintura (vai no HTML do servidor), para o
 * painel não piscar claro antes de ficar escuro. Mesma regra das funções acima.
 * `fixo` ignora a preferência guardada (link público: segue sempre o celular).
 */
export function scriptTemaAntesDaPintura(fixo?: PreferenciaTema): string {
  const preferencia = fixo
    ? JSON.stringify(fixo)
    : `(function(){try{var v=localStorage.getItem(${JSON.stringify(CHAVE_PAINEL_TEMA)});return v==='claro'||v==='escuro'||v==='automatico'?v:${JSON.stringify(PREFERENCIA_PADRAO)}}catch(e){return ${JSON.stringify(PREFERENCIA_PADRAO)}}})()`;
  return `(function(){try{var p=${preferencia};var e=p==='escuro'||(p==='automatico'&&window.matchMedia(${JSON.stringify(MIDIA_ESCURO)}).matches);var b=document.body;b.classList.add(${JSON.stringify(CLASSE_PAINEL)});if(e)b.classList.add('dark');document.documentElement.style.colorScheme=e?'dark':'only light'}catch(x){}})()`;
}
